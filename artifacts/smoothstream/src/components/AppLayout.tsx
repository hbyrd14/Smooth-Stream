import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  LogOut,
  Video,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Video className="w-6 h-6" />
          <span>SmoothStream</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith("/dashboard") || location.startsWith("/events") ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${location.startsWith("/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
            <SettingsIcon className="w-5 h-5" />
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors w-full">
            <LogOut className="w-5 h-5" />
            Log out
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <Video className="w-5 h-5" />
          <span>SmoothStream</span>
        </div>
        <Button variant="ghost" size="icon">
          <Menu className="w-6 h-6" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
