import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus, CheckCircle2, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Search, StickyNote, Plus, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ScatterChart, Scatter
} from "recharts";
import { ChartType, KpiCardTrend } from "@workspace/api-client-react";

function aggregateChartData(
  rows: Record<string, unknown>[],
  categoryKey: string,
  dataKey: string
): Record<string, unknown>[] {
  if (!rows.length) return [];
  const firstRow = rows[0];

  const catExists = categoryKey in firstRow;
  const dataExists = dataKey in firstRow;

  if (catExists && dataExists) {
    return rows;
  }

  if (catExists && !dataExists) {
    const grouped: Record<string, { count: number; sum: number }> = {};
    for (const row of rows) {
      const cat = String(row[categoryKey] ?? "Unknown");
      if (!grouped[cat]) grouped[cat] = { count: 0, sum: 0 };
      grouped[cat].count++;
      const possibleNum = Object.values(row).find(v => typeof v === "number");
      if (typeof possibleNum === "number") grouped[cat].sum += possibleNum;
    }
    return Object.entries(grouped).map(([cat, { count, sum }]) => ({
      [categoryKey]: cat,
      [dataKey]: sum > 0 ? sum : count,
      _count: count,
    }));
  }

  if (!catExists) {
    const allKeys = Object.keys(firstRow);
    const numKeys = allKeys.filter(k => typeof firstRow[k] === "number");
    const strKeys = allKeys.filter(k => typeof firstRow[k] === "string");
    const bestCat = strKeys[0] ?? allKeys[0] ?? categoryKey;
    const bestData = numKeys[0] ?? dataKey;
    return aggregateChartData(rows, bestCat, bestData);
  }

  return rows;
}

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: "13px",
  },
  itemStyle: { color: "#94a3b8" },
  labelStyle: { color: "#f1f5f9", fontWeight: 600 },
};

const AXIS_STYLE = {
  stroke: "#64748b",
  fontSize: 11,
  tickLine: false as const,
  axisLine: false as const,
};

type SortDir = "asc" | "desc";

interface CustomNote {
  id: string;
  text: string;
  createdAt: string;
}

function useCustomNotes(dashboardId: number) {
  const key = `dashboard-notes-${dashboardId}`;

  const [notes, setNotes] = useState<CustomNote[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]") as CustomNote[];
    } catch {
      return [];
    }
  });

  const save = (updated: CustomNote[]) => {
    setNotes(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const add = (text: string) => {
    if (!text.trim()) return;
    save([...notes, { id: Date.now().toString(), text: text.trim(), createdAt: new Date().toISOString() }]);
  };

  const remove = (id: string) => save(notes.filter(n => n.id !== id));

  return { notes, add, remove };
}

export default function DashboardView() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [tableFilter, setTableFilter] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const { notes, add: addNote, remove: removeNote } = useCustomNotes(Number(id));

  const { data: dashboard, isLoading, error } = useGetDashboard(Number(id), {
    query: {
      enabled: !!id,
      queryKey: getGetDashboardQueryKey(Number(id))
    }
  });

  const isProcessing = dashboard?.status === 'pending' || dashboard?.status === 'processing';
  const processedData = dashboard?.processedData ?? null;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isProcessing) {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey(Number(id)) });
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isProcessing, id, queryClient]);

  const filteredRows = useMemo(() => {
    if (!processedData) return [];
    const lowerFilter = tableFilter.toLowerCase();
    const rows = lowerFilter
      ? processedData.rows.filter(row =>
          Object.values(row).some(v => String(v ?? "").toLowerCase().includes(lowerFilter))
        )
      : processedData.rows;
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortCol] ?? "";
      const bVal = b[sortCol] ?? "";
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      const isNum = !isNaN(aNum) && !isNaN(bNum);
      const cmp = isNum ? aNum - bNum : String(aVal).localeCompare(String(bVal));
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [processedData, tableFilter, sortCol, sortDir]);

  function handleSort(colKey: string) {
    if (sortCol === colKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(colKey);
      setSortDir("asc");
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground max-w-md">The dashboard could not be found or an error occurred.</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 max-w-2xl mx-auto w-full">
        <div className="w-full bg-card border border-border rounded-xl p-8 text-center space-y-6 shadow-lg">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">AI</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Data</h2>
            <p className="text-muted-foreground">Extracting entities, finding patterns, and generating visualizations...</p>
          </div>
          <div className="space-y-3 text-left w-full max-w-md mx-auto pt-4">
            <div className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-primary" /> <span>Reading source material</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-primary" /> <span>Identifying key metrics</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground animate-pulse">
              <div className="h-5 w-5 rounded-full border-2 border-primary/50 border-t-primary animate-spin" />
              <span>Building interactive charts</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dashboard.status === 'failed') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Processing Failed</h2>
        <p className="text-muted-foreground max-w-md mb-4">{dashboard.errorMessage || "Our AI encountered an error while processing your data."}</p>
      </div>
    );
  }

  if (!processedData) return null;

  function renderChart(chart: NonNullable<typeof processedData>["charts"][number], idx: number) {
    const primaryColor = CHART_COLORS[idx % CHART_COLORS.length];
    const chartData = aggregateChartData(processedData!.rows, chart.categoryKey, chart.dataKey);

    if (chart.type === ChartType.bar) {
      return (
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey={chart.categoryKey} {...AXIS_STYLE} />
          <YAxis {...AXIS_STYLE} width={60} tickFormatter={v => typeof v === 'number' && v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey={chart.dataKey} fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={60}>
            {processedData!.rows.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      );
    }

    if (chart.type === ChartType.line) {
      return (
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey={chart.categoryKey} {...AXIS_STYLE} />
          <YAxis {...AXIS_STYLE} width={60} tickFormatter={v => typeof v === 'number' && v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey={chart.dataKey}
            stroke={primaryColor}
            strokeWidth={2.5}
            dot={{ r: 4, fill: primaryColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: primaryColor }}
          />
        </LineChart>
      );
    }

    if (chart.type === ChartType.area) {
      return (
        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={`areaGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey={chart.categoryKey} {...AXIS_STYLE} />
          <YAxis {...AXIS_STYLE} width={60} tickFormatter={v => typeof v === 'number' && v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Area
            type="monotone"
            dataKey={chart.dataKey}
            fill={`url(#areaGrad-${idx})`}
            stroke={primaryColor}
            strokeWidth={2.5}
          />
        </AreaChart>
      );
    }

    if (chart.type === ChartType.pie) {
      const pieData = chartData.slice(0, 10);
      return (
        <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <Pie
            data={pieData}
            dataKey={chart.dataKey}
            nameKey={chart.categoryKey}
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={40}
            paddingAngle={2}
            label={({ name, percent }) => `${String(name).slice(0, 8)} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend
            formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{String(value).slice(0, 12)}</span>}
          />
        </PieChart>
      );
    }

    return (
      <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey={chart.categoryKey} {...AXIS_STYLE} name={chart.categoryKey} />
        <YAxis dataKey={chart.dataKey} {...AXIS_STYLE} width={60} name={chart.dataKey} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} {...TOOLTIP_STYLE} />
        <Scatter data={chartData} fill={primaryColor} />
      </ScatterChart>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-background p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {dashboard.sourceType.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">{new Date(dashboard.createdAt).toLocaleDateString()}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
            {processedData.title}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            {processedData.summary}
          </p>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {processedData.kpis.map((kpi, idx) => (
          <Card
            key={idx}
            className="bg-card shadow-sm border-border"
            style={{ borderTop: `3px solid ${CHART_COLORS[idx % CHART_COLORS.length]}` }}
            data-testid={`card-kpi-${idx}`}
          >
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1 leading-tight">{kpi.label}</p>
              <div className="flex items-end justify-between gap-1">
                <h3 className="text-2xl font-bold text-foreground leading-none">
                  {kpi.value}
                  {kpi.unit && <span className="text-sm text-muted-foreground ml-1">{kpi.unit}</span>}
                </h3>
                {kpi.trend && kpi.trendValue && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${
                    kpi.trend === KpiCardTrend.up ? 'text-emerald-400' :
                    kpi.trend === KpiCardTrend.down ? 'text-rose-400' : 'text-muted-foreground'
                  }`}>
                    {kpi.trend === KpiCardTrend.up ? <TrendingUp className="h-3 w-3" /> :
                     kpi.trend === KpiCardTrend.down ? <TrendingDown className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                    <span>{kpi.trendValue}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {processedData.charts.map((chart, idx) => (
              <Card key={idx} className="bg-card shadow-sm border-border" data-testid={`card-chart-${idx}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <div
                      className="h-3 w-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <div>
                      <CardTitle className="text-base font-bold leading-tight">{chart.title}</CardTitle>
                      {chart.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{chart.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart(chart, idx)}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Data Table */}
          <Card className="bg-card shadow-sm border-border overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-bold">
                  Raw Data Extract
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredRows.length} of {processedData.rows.length} rows)
                  </span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter rows..."
                    value={tableFilter}
                    onChange={e => setTableFilter(e.target.value)}
                    className="pl-8 h-9 w-56 text-sm"
                    data-testid="input-table-filter"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table data-testid="table-data">
                  <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                    <TableRow className="border-border hover:bg-transparent">
                      {processedData.columns.map((col) => (
                        <TableHead
                          key={col.key}
                          className="text-muted-foreground font-medium cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => handleSort(col.key)}
                          data-testid={`th-${col.key}`}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sortCol === col.key ? (
                              sortDir === "asc"
                                ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
                                : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={processedData.columns.length} className="text-center text-muted-foreground py-8">
                          No rows match your filter.
                        </TableCell>
                      </TableRow>
                    ) : filteredRows.map((row, i) => (
                      <TableRow key={i} className="border-border hover:bg-muted/50 transition-colors">
                        {processedData.columns.map((col) => (
                          <TableCell key={col.key} className="py-2.5 text-sm">
                            {row[col.key] !== undefined && row[col.key] !== null
                              ? String(row[col.key])
                              : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-4">

          {/* AI Insights */}
          <Card className="bg-blue-950/40 border-blue-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-400">
                <ArrowRight className="h-4 w-4" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {processedData.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/10 text-sm leading-relaxed text-foreground"
                  data-testid={`card-insight-${idx}`}
                >
                  {insight}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Custom Notes */}
          <Card className="bg-amber-950/30 border-amber-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-400">
                  <StickyNote className="h-4 w-4" />
                  My Notes
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                  onClick={() => setShowNoteInput(v => !v)}
                >
                  {showNoteInput ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showNoteInput && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add specific context, observations, or information about this data..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="min-h-[90px] text-sm bg-amber-950/20 border-amber-500/20 resize-none placeholder:text-amber-700/60"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white h-8 text-xs"
                    onClick={() => {
                      addNote(noteText);
                      setNoteText("");
                      setShowNoteInput(false);
                    }}
                    disabled={!noteText.trim()}
                  >
                    <Save className="h-3 w-3 mr-1.5" />
                    Save Note
                  </Button>
                </div>
              )}

              {notes.length === 0 && !showNoteInput && (
                <p className="text-xs text-amber-700/70 italic text-center py-2">
                  Add notes to capture context or specific observations
                </p>
              )}

              {notes.map((note) => (
                <div
                  key={note.id}
                  className="group relative p-3 rounded-lg bg-amber-900/20 border border-amber-500/10 text-sm text-foreground leading-relaxed"
                >
                  <p className="pr-6">{note.text}</p>
                  <p className="text-[10px] text-amber-700/60 mt-1.5">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeNote(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 hover:text-amber-400"
                    title="Remove note"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
