import { openai } from "@workspace/integrations-openai-ai-server";

export interface KpiCard {
  label: string;
  value: string;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export interface ChartConfig {
  title: string;
  type: "bar" | "line" | "pie" | "area" | "scatter" | "none";
  dataKey: string;
  categoryKey: string;
  description?: string;
}

export interface DataColumn {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "boolean";
  important: boolean;
}

export interface ProcessedDashboardData {
  title: string;
  summary: string;
  insights: string[];
  kpis: KpiCard[];
  columns: DataColumn[];
  charts: ChartConfig[];
  rows: Record<string, unknown>[];
}

export async function processContentWithAI(
  content: string,
  sourceHint: string,
): Promise<ProcessedDashboardData> {
  const systemPrompt = `You are an expert data analyst and dashboard designer. Your job is to analyze any content (documents, web pages, CSV data, text, tables) and extract the most important information to build an interactive dashboard.

You will:
1. Identify the key data points, metrics, and trends
2. Select the most important columns/fields to display
3. Suggest appropriate charts and visualizations
4. Generate KPI cards with the most impactful metrics
5. Write clear insights and a concise summary
6. Normalize all data into a consistent tabular format

Return ONLY a valid JSON object with no extra text.`;

  const userPrompt = `Analyze this content from ${sourceHint} and generate a dashboard configuration:

---
${content.slice(0, 25000)}
---

Return a JSON object with this exact structure:
{
  "title": "A descriptive dashboard title based on the content",
  "summary": "2-3 sentence executive summary of what the data shows",
  "insights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"],
  "kpis": [
    {
      "label": "Metric Name",
      "value": "Value",
      "unit": "optional unit like %, $, K, etc",
      "trend": "up|down|neutral",
      "trendValue": "optional +5.2%"
    }
  ],
  "columns": [
    {
      "key": "columnKey",
      "label": "Display Label",
      "type": "string|number|date|boolean",
      "important": true
    }
  ],
  "charts": [
    {
      "title": "Chart Title",
      "type": "bar|line|pie|area|scatter",
      "dataKey": "valueColumnKey",
      "categoryKey": "labelColumnKey",
      "description": "What this chart shows"
    }
  ],
  "rows": [
    { "columnKey": "value", ... }
  ]
}

Rules:
- Include 3-6 KPI cards with the most impactful metrics
- Select 5-10 of the MOST IMPORTANT columns (mark them important: true), hide less important ones
- Suggest 2-4 charts that best visualize the data patterns
- Include up to 100 rows of normalized data
- If content is not tabular, extract key information into a table format
- Make values human-readable (format numbers, dates, percentages)
- Use specific, data-driven insights (not generic statements)`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const rawJson = response.choices[0]?.message?.content ?? "{}";
  
  try {
    const parsed = JSON.parse(rawJson) as ProcessedDashboardData;
    return {
      title: parsed.title ?? "Untitled Dashboard",
      summary: parsed.summary ?? "",
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      kpis: Array.isArray(parsed.kpis) ? parsed.kpis : [],
      columns: Array.isArray(parsed.columns) ? parsed.columns : [],
      charts: Array.isArray(parsed.charts) ? parsed.charts : [],
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
    };
  } catch {
    throw new Error("AI returned invalid JSON response");
  }
}
