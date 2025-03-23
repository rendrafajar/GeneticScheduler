import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
}

export default function Layout({ title = "SMARTA", children }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={title} 
          onOpenSidebar={() => setSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 p-4 md:py-4 text-center text-sm text-slate-600">
          &copy; 2023 SMARTA - Sistem Manajemen Penjadwalan Terpadu | Versi 1.0.0
        </footer>
      </div>
    </div>
  );
}
