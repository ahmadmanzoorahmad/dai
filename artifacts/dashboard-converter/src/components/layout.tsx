import { Link, useLocation } from "wouter";
import { LineChart, LayoutDashboard, Settings, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <LineChart className="h-6 w-6" />
            <span>DashboardAI</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
            <Plus className="h-4 w-4" />
            New Dashboard
          </Link>
          <Link href="/library" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith('/library') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}>
            <LayoutDashboard className="h-4 w-4" />
            Library
          </Link>
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center px-6 md:hidden sticky top-0 z-10">
          <Button variant="ghost" size="icon" className="mr-4">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <LineChart className="h-5 w-5" />
            <span>DashboardAI</span>
          </Link>
        </header>
        
        <main className="flex-1 flex flex-col h-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
