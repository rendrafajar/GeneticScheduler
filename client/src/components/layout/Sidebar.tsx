import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  CalendarIcon, 
  LayoutDashboardIcon, 
  BookOpenIcon, 
  UserIcon, 
  UsersIcon, 
  DoorOpenIcon, 
  ClockIcon, 
  CogIcon, 
  BarChartIcon, 
  UserCogIcon, 
  LogOutIcon,
  Settings2Icon,
  CalendarDaysIcon
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [userInitials, setUserInitials] = useState("SM");

  useEffect(() => {
    if (user && user.fullName) {
      const initials = user.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      setUserInitials(initials);
    }
  }, [user]);

  const navItems = [
    {
      group: "Menu Utama",
      items: [
        { name: "Dashboard", path: "/", icon: <LayoutDashboardIcon className="w-5 h-5" /> },
      ]
    },
    {
      group: "Manajemen Data",
      items: [
        { name: "Kurikulum", path: "/kurikulum", icon: <BookOpenIcon className="w-5 h-5" /> },
        { name: "Guru", path: "/guru", icon: <UserIcon className="w-5 h-5" /> },
        { name: "Kelas", path: "/kelas", icon: <UsersIcon className="w-5 h-5" /> },
        { name: "Ruangan", path: "/ruangan", icon: <DoorOpenIcon className="w-5 h-5" /> },
        { name: "Slot Waktu", path: "/slot-waktu", icon: <ClockIcon className="w-5 h-5" /> },
      ]
    },
    {
      group: "Penjadwalan",
      items: [
        { name: "Generate Jadwal", path: "/generate-jadwal", icon: <Settings2Icon className="w-5 h-5" /> },
        { name: "Lihat Jadwal", path: "/lihat-jadwal", icon: <CalendarDaysIcon className="w-5 h-5" /> },
        { name: "Laporan", path: "/laporan", icon: <BarChartIcon className="w-5 h-5" /> },
      ]
    },
    {
      group: "Pengaturan",
      items: [
        { name: "Pengaturan Aplikasi", path: "/pengaturan", icon: <CogIcon className="w-5 h-5" />, admin: true },
        { name: "Manajemen Pengguna", path: "/pengguna", icon: <UserCogIcon className="w-5 h-5" />, admin: true },
      ]
    },
  ];

  const isAdmin = user?.role === "admin";

  return (
    <div className={cn(
      "bg-slate-900 text-white w-64 flex-shrink-0 fixed md:relative h-screen z-20 transition-all duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Logo and app name */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="bg-primary-600 rounded p-1.5">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">SMARTA</h1>
          </div>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-slate-400 hover:text-white"
          onClick={onClose}
        >
          <span className="sr-only">Close sidebar</span>
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Button>
      </div>
      
      {/* User info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-primary-700 text-white">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium truncate">{user?.fullName}</div>
            <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <nav className="py-4">
          {navItems.map((group, groupIndex) => {
            // Filter out admin-only items if user is not admin
            const filteredItems = group.items.filter(item => !item.admin || isAdmin);
            
            // Skip rendering the group if there are no items to show
            if (filteredItems.length === 0) return null;
            
            return (
              <div key={groupIndex} className="mb-4">
                <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase">
                  {group.group}
                </div>
                
                {filteredItems.map((item, itemIndex) => (
                  <Link key={itemIndex} href={item.path}>
                    <a className={cn(
                      "flex items-center space-x-2 px-4 py-2.5 text-slate-300 hover:bg-slate-800",
                      location === item.path && "bg-primary-700 text-white hover:bg-primary-700"
                    )}>
                      {item.icon}
                      <span>{item.name}</span>
                    </a>
                  </Link>
                ))}
                
                {groupIndex < navItems.length - 1 && filteredItems.length > 0 && (
                  <Separator className="my-4 bg-slate-700" />
                )}
              </div>
            );
          })}

          <div className="px-4 mt-8">
            <button 
              className="flex items-center space-x-2 px-4 py-2.5 text-slate-300 hover:bg-slate-800 w-full"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOutIcon className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </nav>
      </ScrollArea>
    </div>
  );
}
