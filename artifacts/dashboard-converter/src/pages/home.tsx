import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  useCreateDashboard, 
  useUploadDashboard,
  useGetDashboardStats,
  useListDashboards 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UploadCloud, 
  Link as LinkIcon, 
  FileText, 
  ArrowRight,
  Database,
  BarChart3,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createDashboard = useCreateDashboard();
  const uploadDashboard = useUploadDashboard();
  const { data: stats } = useGetDashboardStats();
  const { data: recentDashboards } = useListDashboards();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    try {
      const result = await createDashboard.mutateAsync({
        data: { sourceType: "url", sourceUrl: url }
      });
      setLocation(`/dashboard/${result.id}`);
    } catch (error) {
      toast({ title: "Error creating dashboard", variant: "destructive" });
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    
    try {
      const result = await createDashboard.mutateAsync({
        data: { sourceType: "text", textContent: text }
      });
      setLocation(`/dashboard/${result.id}`);
    } catch (error) {
      toast({ title: "Error creating dashboard", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await uploadDashboard.mutateAsync({
        data: { file }
      });
      setLocation(`/dashboard/${result.id}`);
    } catch (error) {
      toast({ title: "Error uploading file", variant: "destructive" });
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <div className="relative min-h-[500px] flex flex-col items-center justify-center p-8 overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        </div>
        
        <div className="z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Database className="h-4 w-4" />
            Intelligent Data Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Convert any data into <span className="text-primary">instant insight</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Upload a document, paste a URL, or drop raw text. Our intelligence layer instantly builds a comprehensive, beautiful dashboard.
          </p>

          <Card className="w-full max-w-2xl mt-8 shadow-2xl border-primary/20 bg-background/80 backdrop-blur-xl">
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none rounded-t-lg border-b bg-transparent">
                <TabsTrigger value="url" className="data-[state=active]:bg-card rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <LinkIcon className="h-4 w-4 mr-2" /> URL
                </TabsTrigger>
                <TabsTrigger value="file" className="data-[state=active]:bg-card rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <UploadCloud className="h-4 w-4 mr-2" /> File Upload
                </TabsTrigger>
                <TabsTrigger value="text" className="data-[state=active]:bg-card rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <FileText className="h-4 w-4 mr-2" /> Raw Text
                </TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="url" className="mt-0">
                  <form onSubmit={handleUrlSubmit} className="flex gap-4">
                    <Input 
                      placeholder="https://example.com/data" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 h-12 bg-card"
                      data-testid="input-url"
                    />
                    <Button type="submit" disabled={!url || createDashboard.isPending} size="lg" className="px-8" data-testid="button-submit-url">
                      {createDashboard.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Analyze"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="file" className="mt-0">
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-card"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="zone-file-upload"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload}
                      accept=".pdf,.csv,.xlsx,.xls,.txt,.docx"
                      data-testid="input-file"
                    />
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      {uploadDashboard.isPending ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        <UploadCloud className="h-8 w-8" />
                      )}
                    </div>
                    <p className="text-lg font-medium text-foreground">Click to upload document</p>
                    <p className="text-sm text-muted-foreground mt-2">PDF, CSV, Excel, Word, or Text files</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="mt-0">
                  <form onSubmit={handleTextSubmit} className="space-y-4">
                    <Textarea 
                      placeholder="Paste your raw data, JSON, or text content here..." 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[150px] bg-card resize-none font-mono text-sm"
                      data-testid="input-text"
                    />
                    <Button type="submit" disabled={!text || createDashboard.isPending} className="w-full h-12" data-testid="button-submit-text">
                      {createDashboard.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Process Data"}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Stats and Recent */}
      <div className="max-w-6xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4">Platform Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground font-medium">Total Dashboards</p>
                  <p className="text-3xl font-bold mt-2" data-testid="text-stat-total">{stats?.total || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground font-medium">Completed</p>
                  <p className="text-3xl font-bold mt-2 text-primary" data-testid="text-stat-completed">{stats?.completedCount || 0}</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card className="bg-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground font-medium mb-4">Sources Breakdown</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <span>URLs</span>
                  </div>
                  <span className="font-medium">{stats?.bySourceType?.url || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span>Files</span>
                  </div>
                  <span className="font-medium">{stats?.bySourceType?.file || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Text</span>
                  </div>
                  <span className="font-medium">{stats?.bySourceType?.text || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Recent Dashboards</h3>
            <Link href="/library" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentDashboards?.slice(0, 4).map((db) => (
              <Card key={db.id} className="hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => setLocation(`/dashboard/${db.id}`)} data-testid={`card-dashboard-${db.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1 truncate max-w-[200px]" title={db.title}>{db.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {db.sourceType === 'url' ? <LinkIcon className="h-3 w-3" /> : 
                         db.sourceType === 'file' ? <FileSpreadsheet className="h-3 w-3" /> : 
                         <FileText className="h-3 w-3" />}
                        {db.sourceFileName || db.sourceUrl || "Raw Text"}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      db.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      db.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {db.status}
                    </div>
                  </div>
                  
                  {db.status === 'completed' && (
                    <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>{db.kpiCount} KPIs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        <span>{db.rowCount} Rows</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
