import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentSchedule from "@/components/dashboard/RecentSchedule";
import GenerationResult from "@/components/dashboard/GenerationResult";
import AlgorithmSettings from "@/components/dashboard/AlgorithmSettings";
import GenerateScheduleModal from "@/components/modals/GenerateScheduleModal";
import { useQuery } from "@tanstack/react-query";
import { 
  UserIcon, 
  UsersIcon, 
  BookOpenIcon, 
  DoorOpenIcon, 
  CogIcon, 
  CalendarDaysIcon 
} from "lucide-react";
import { QuickActionProps } from "@/types";

export default function Dashboard() {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const { user } = useAuth();

  // Fetch dashboard statistics data
  const { data: statistics, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: false, // Disabled for now, will be enabled in production
  });

  // Placeholder data - in production this would come from the API
  const stats = {
    teacherCount: 48,
    classCount: 24,
    subjectCount: 78,
    roomCount: 32,
    newTeachers: 2,
    classInfo: "6 jurusan, 4 tingkat kelas",
    curriculumInfo: "Kurikulum Merdeka 2022",
    roomInfo: "18 teori, 14 praktikum"
  };

  const quickActions: QuickActionProps[] = [
    {
      icon: <UserIcon className="h-4 w-4" />,
      title: "Tambah Guru",
      description: "Input data guru baru",
      href: "/guru",
      iconBgColor: "bg-primary-100",
      iconColor: "text-primary-700"
    },
    {
      icon: <UsersIcon className="h-4 w-4" />,
      title: "Tambah Kelas",
      description: "Input data kelas baru",
      href: "/kelas",
      iconBgColor: "bg-primary-100",
      iconColor: "text-primary-700"
    },
    {
      icon: <BookOpenIcon className="h-4 w-4" />,
      title: "Tambah Mata Pelajaran",
      description: "Input mata pelajaran baru",
      href: "/kurikulum",
      iconBgColor: "bg-primary-100",
      iconColor: "text-primary-700"
    },
    {
      icon: <DoorOpenIcon className="h-4 w-4" />,
      title: "Tambah Ruangan",
      description: "Input data ruangan baru",
      href: "/ruangan",
      iconBgColor: "bg-primary-100",
      iconColor: "text-primary-700"
    }
  ];

  const openGenerateModal = () => {
    setIsGenerateModalOpen(true);
  };

  return (
    <Layout title="Dashboard">
      {/* Welcome card */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-lg p-6 text-white mb-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-2">Selamat Datang di SMARTA</h1>
        <p className="mb-4 opacity-90">Sistem Manajemen Penjadwalan Terpadu dengan Algoritma Genetika</p>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="secondary" 
            className="bg-white text-primary-700 hover:bg-slate-100"
            onClick={openGenerateModal}
          >
            <CogIcon className="mr-2 h-4 w-4" />
            <span>Generate Jadwal Baru</span>
          </Button>
          <Button 
            variant="outline" 
            className="bg-primary-800 text-white border-primary-800 hover:bg-primary-900 hover:text-white"
            asChild
          >
            <Link href="/lihat-jadwal">
              <CalendarDaysIcon className="mr-2 h-4 w-4" />
              <span>Lihat Jadwal Terbaru</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Guru" 
          value={stats.teacherCount} 
          icon={<UserIcon className="h-5 w-5" />} 
          iconBgColor="bg-blue-100" 
          iconColor="text-blue-500" 
          trend={{ 
            value: `${stats.newTeachers} guru baru bulan ini`, 
            isPositive: true 
          }} 
        />
        
        <StatCard 
          title="Total Kelas" 
          value={stats.classCount} 
          icon={<UsersIcon className="h-5 w-5" />} 
          iconBgColor="bg-purple-100" 
          iconColor="text-purple-500" 
          trend={{ 
            value: stats.classInfo
          }} 
        />
        
        <StatCard 
          title="Total Mata Pelajaran" 
          value={stats.subjectCount} 
          icon={<BookOpenIcon className="h-5 w-5" />} 
          iconBgColor="bg-amber-100" 
          iconColor="text-amber-500" 
          trend={{ 
            value: stats.curriculumInfo
          }} 
        />
        
        <StatCard 
          title="Total Ruangan" 
          value={stats.roomCount} 
          icon={<DoorOpenIcon className="h-5 w-5" />} 
          iconBgColor="bg-teal-100" 
          iconColor="text-teal-500" 
          trend={{ 
            value: stats.roomInfo
          }} 
        />
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <QuickActions actions={quickActions} />
        <RecentSchedule />
      </div>
      
      {/* Additional content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenerationResult />
        <AlgorithmSettings />
      </div>

      {/* Generate Schedule Modal */}
      <GenerateScheduleModal 
        isOpen={isGenerateModalOpen} 
        onClose={() => setIsGenerateModalOpen(false)} 
      />
    </Layout>
  );
}
