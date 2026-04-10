import { Router, type IRouter } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { dashboardsTable } from "@workspace/db";
import { eq, desc, count, and, gte, sql } from "drizzle-orm";
import {
  CreateDashboardBody,
  GetDashboardParams,
  DeleteDashboardParams,
  GetDashboardStatsResponse,
} from "@workspace/api-zod";
import { processContentWithAI } from "./aiProcessor.js";
import { extractTextFromUrl, extractTextFromBuffer } from "./contentExtractor.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function buildSummary(d: typeof dashboardsTable.$inferSelect) {
  const data = d.processedData as {
    kpis?: unknown[];
    charts?: unknown[];
    rows?: unknown[];
  } | null;
  return {
    id: d.id,
    title: d.title,
    sourceType: d.sourceType,
    sourceUrl: d.sourceUrl ?? null,
    sourceFileName: d.sourceFileName ?? null,
    status: d.status,
    kpiCount: data?.kpis?.length ?? 0,
    chartCount: data?.charts?.length ?? 0,
    rowCount: data?.rows?.length ?? 0,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function buildFull(d: typeof dashboardsTable.$inferSelect) {
  return {
    id: d.id,
    title: d.title,
    sourceType: d.sourceType,
    sourceUrl: d.sourceUrl ?? null,
    sourceFileName: d.sourceFileName ?? null,
    status: d.status,
    processedData: d.processedData ?? null,
    errorMessage: d.errorMessage ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

router.get("/dashboards/stats", async (req, res) => {
  const allDashboards = await db.select().from(dashboardsTable).orderBy(desc(dashboardsTable.createdAt));
  const total = allDashboards.length;
  const bySourceType = { url: 0, file: 0, text: 0 };
  let completedCount = 0;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let recentCount = 0;
  for (const d of allDashboards) {
    bySourceType[d.sourceType as keyof typeof bySourceType]++;
    if (d.status === "completed") completedCount++;
    if (d.createdAt >= oneDayAgo) recentCount++;
  }
  const stats = GetDashboardStatsResponse.parse({ total, bySourceType, recentCount, completedCount });
  res.json(stats);
});

router.get("/dashboards", async (_req, res) => {
  const dashboards = await db
    .select()
    .from(dashboardsTable)
    .orderBy(desc(dashboardsTable.createdAt));
  res.json(dashboards.map(buildSummary));
});

router.post("/dashboards", async (req, res) => {
  const parseResult = CreateDashboardBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.message });
    return;
  }
  const body = parseResult.data;

  if (body.sourceType === "file") {
    res.status(400).json({ error: "File uploads must use the /dashboards/upload endpoint" });
    return;
  }

  if (body.sourceType === "url" && !body.sourceUrl) {
    res.status(400).json({ error: "sourceUrl is required for URL source type" });
    return;
  }

  let urlHostname: string | null = null;
  if (body.sourceUrl) {
    try {
      urlHostname = new URL(body.sourceUrl).hostname;
    } catch {
      res.status(400).json({ error: "Invalid URL format" });
      return;
    }
  }

  const title = body.title ?? (urlHostname ? urlHostname : "Dashboard");

  const [dashboard] = await db.insert(dashboardsTable).values({
    title,
    sourceType: body.sourceType,
    sourceUrl: body.sourceUrl ?? null,
    rawContent: body.textContent ?? null,
    status: "processing",
  }).returning();

  res.status(201).json(buildFull(dashboard));

  setImmediate(async () => {
    try {
      let content = "";
      let sourceHint = "";

      if (body.sourceType === "url" && body.sourceUrl) {
        sourceHint = `URL: ${body.sourceUrl}`;
        content = await extractTextFromUrl(body.sourceUrl);
      } else if (body.sourceType === "text" && body.textContent) {
        sourceHint = "pasted text";
        content = body.textContent;
      } else {
        throw new Error("No content provided");
      }

      const processedData = await processContentWithAI(content, sourceHint);

      await db.update(dashboardsTable).set({
        processedData: processedData as never,
        title: processedData.title,
        status: "completed",
        updatedAt: new Date(),
      }).where(eq(dashboardsTable.id, dashboard.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await db.update(dashboardsTable).set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      }).where(eq(dashboardsTable.id, dashboard.id));
    }
  });
});

router.post("/dashboards/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const title = (req.body as { title?: string }).title ?? req.file.originalname ?? "Uploaded File";

  const [dashboard] = await db.insert(dashboardsTable).values({
    title,
    sourceType: "file",
    sourceFileName: req.file.originalname,
    status: "processing",
  }).returning();

  res.status(201).json(buildFull(dashboard));

  setImmediate(async () => {
    try {
      const content = await extractTextFromBuffer(
        req.file!.buffer,
        req.file!.mimetype,
        req.file!.originalname,
      );
      const sourceHint = `file: ${req.file!.originalname}`;
      const processedData = await processContentWithAI(content, sourceHint);

      await db.update(dashboardsTable).set({
        processedData: processedData as never,
        title: processedData.title,
        status: "completed",
        updatedAt: new Date(),
      }).where(eq(dashboardsTable.id, dashboard.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await db.update(dashboardsTable).set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      }).where(eq(dashboardsTable.id, dashboard.id));
    }
  });
});

router.get("/dashboards/:id", async (req, res) => {
  const parseResult = GetDashboardParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid dashboard ID" });
    return;
  }
  const { id } = parseResult.data;

  const [dashboard] = await db
    .select()
    .from(dashboardsTable)
    .where(eq(dashboardsTable.id, id));

  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  res.json(buildFull(dashboard));
});

router.delete("/dashboards/:id", async (req, res) => {
  const parseResult = DeleteDashboardParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid dashboard ID" });
    return;
  }
  const { id } = parseResult.data;

  const deleted = await db
    .delete(dashboardsTable)
    .where(eq(dashboardsTable.id, id))
    .returning();

  if (!deleted.length) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  res.status(204).send();
});

export default router;
