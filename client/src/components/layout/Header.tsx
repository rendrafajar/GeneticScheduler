import { Button } from "@/components/ui/button";
import { BellIcon, HelpCircleIcon } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
}

export default function Header({ title, onOpenSidebar }: HeaderProps) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    if (location === "/") return "Dashboard";
    if (location === "/kurikulum") return "Kurikulum";
    if (location === "/guru") return "Guru";
    if (location === "/kelas") return "Kelas";
    if (location === "/ruangan") return "Ruangan";
    if (location === "/slot-waktu") return "Slot Waktu";
    if (location === "/generate-jadwal") return "Generate Jadwal";
    if (location === "/lihat-jadwal") return "Lihat Jadwal";
    if (location === "/laporan") return "Laporan";
    if (location === "/pengaturan") return "Pengaturan Aplikasi";
    if (location === "/pengguna") return "Manajemen Pengguna";
    return title;
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-4 text-slate-600 hover:text-slate-900"
          onClick={onOpenSidebar}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          <span className="sr-only">Menu</span>
        </Button>
        <h2 className="text-lg font-semibold">{getPageTitle()}</h2>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full">
          <BellIcon className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full">
          <HelpCircleIcon className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>
      </div>
    </header>
  );
}
