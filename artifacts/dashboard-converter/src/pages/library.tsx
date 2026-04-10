import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListDashboards, 
  useDeleteDashboard,
  getListDashboardsQueryKey,
  useGetDashboardStats
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Link as LinkIcon, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  BarChart3, 
  Trash2,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Library() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: dashboards, isLoading } = useListDashboards();
  const { data: stats } = useGetDashboardStats();
  const deleteDashboard = useDeleteDashboard();

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteDashboard.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListDashboardsQueryKey() });
      toast({ title: "Dashboard deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete dashboard", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-background p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Library</h1>
          <p className="text-muted-foreground mt-1">Manage and view all your generated insights</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-medium">{stats?.total || 0} Total</span>
          </div>
        </div>
      </div>

      {!dashboards?.length ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-card p-12 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No dashboards yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">Create your first dashboard by uploading a file, pasting a URL, or providing raw text data.</p>
          <Link href="/">
            <Button size="lg" data-testid="button-create-first">Create Dashboard</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dashboards.map((db) => (
            <Card key={db.id} className="group bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col" data-testid={`card-library-item-${db.id}`}>
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {db.sourceType === 'url' ? <LinkIcon className="h-5 w-5" /> : 
                       db.sourceType === 'file' ? <FileSpreadsheet className="h-5 w-5" /> : 
                       <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1" title={db.title}>{db.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={
                          db.status === 'completed' ? 'border-green-500/20 text-green-500 bg-green-500/5' :
                          db.status === 'failed' ? 'border-destructive/20 text-destructive bg-destructive/5' :
                          'border-primary/20 text-primary bg-primary/5'
                        }>
                          {db.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-delete-${db.id}`}>
                        {deletingId === db.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{db.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(db.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                {db.status === 'completed' ? (
                  <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">{db.kpiCount}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">KPIs</p>
                    </div>
                    <div className="text-center border-l border-r border-border">
                      <p className="text-xl font-bold text-foreground">{db.chartCount}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Charts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">{db.rowCount}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rows</p>
                    </div>
                  </div>
                ) : db.status === 'failed' ? (
                  <div className="mt-auto pt-4 flex items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Processing failed</span>
                  </div>
                ) : (
                  <div className="mt-auto pt-4 flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Processing data...</span>
                  </div>
                )}
                
                <div className="mt-4 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(db.createdAt).toLocaleDateString()}
                  </div>
                  <Link href={`/dashboard/${db.id}`}>
                    <Button variant="secondary" size="sm" className="h-8" data-testid={`button-view-${db.id}`}>
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
