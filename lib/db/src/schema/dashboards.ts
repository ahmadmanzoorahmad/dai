import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dashboardsTable = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sourceType: text("source_type", { enum: ["url", "file", "text"] }).notNull(),
  sourceUrl: text("source_url"),
  sourceFileName: text("source_file_name"),
  rawContent: text("raw_content"),
  processedData: jsonb("processed_data"),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] })
    .notNull()
    .default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDashboardSchema = createInsertSchema(dashboardsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
export type Dashboard = typeof dashboardsTable.$inferSelect;
