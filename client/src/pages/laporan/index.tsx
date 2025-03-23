import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  FileTextIcon, 
  DownloadIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  BarChart3Icon,
  ClipboardListIcon,
  GraduationCapIcon,
  BookOpenIcon,
  UserIcon
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function LaporanPage() {
  const { toast } = useToast();
  const [selectedGeneration, setSelectedGeneration] = useState<string>("");
  const [currentTab, setCurrentTab] = useState("overview");
  
  // Fetch data semua generasi jadwal
  const { data: generations, isLoading: isLoadingGenerations } = useQuery({
    queryKey: ["/api/schedule-generations"],
  });
  
  // Filter generasi jadwal yang telah selesai (completed)
  const completedGenerations = generations 
    ? generations.filter((gen: any) => gen.status === "completed")
    : [];
  
  // Gunakan generasi paling baru jika tidak ada yang dipilih
  useState(() => {
    if (completedGenerations && completedGenerations.length > 0 && !selectedGeneration) {
      setSelectedGeneration(completedGenerations[0].id.toString());
    }
  });
  
  // Fetch detail generasi jadwal terpilih
  const { data: generationDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["/api/schedule-generations", selectedGeneration],
    queryFn: async () => {
      if (!selectedGeneration) return null;
      const res = await fetch(`/api/schedule-generations/${selectedGeneration}`);
      if (!res.ok) throw new Error("Gagal memuat detail generasi jadwal");
      return await res.json();
    },
    enabled: !!selectedGeneration,
  });
  
  // Fetch semua jadwal terkait generasi terpilih
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["/api/schedules", { generationId: selectedGeneration }],
    queryFn: async () => {
      if (!selectedGeneration) return [];
      const res = await fetch(`/api/schedules?generationId=${selectedGeneration}`);
      if (!res.ok) throw new Error("Gagal memuat jadwal");
      return await res.json();
    },
    enabled: !!selectedGeneration,
  });
  
  // Fetch data guru dan mata pelajaran untuk analisis beban mengajar
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["/api/teachers"],
  });
  
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["/api/subjects"],
  });
  
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/classes"],
  });
  
  // Fetch data slot waktu
  const { data: timeSlots, isLoading: isLoadingTimeSlots } = useQuery({
    queryKey: ["/api/timeslots"],
  });
  
  // Mutasi untuk export laporan
  const exportReportMutation = useMutation({
    mutationFn: async () => {
      // Simulasi ekspor laporan ke PDF
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Laporan berhasil diekspor ke PDF",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fungsi untuk mendapatkan nama guru berdasarkan ID
  const getTeacherName = (teacherId: number) => {
    if (!teachers) return "-";
    const teacher = teachers.find((t: any) => t.id === teacherId);
    return teacher ? teacher.name : "-";
  };
  
  // Fungsi untuk mendapatkan nama mata pelajaran berdasarkan ID
  const getSubjectName = (subjectId: number) => {
    if (!subjects) return "-";
    const subject = subjects.find((s: any) => s.id === subjectId);
    return subject ? subject.name : "-";
  };
  
  // Fungsi untuk mendapatkan nama kelas berdasarkan ID
  const getClassName = (classId: number) => {
    if (!classes) return "-";
    const cls = classes.find((c: any) => c.id === classId);
    return cls ? cls.name : "-";
  };
  
  // Fungsi untuk mendapatkan info slot waktu berdasarkan ID
  const getTimeSlotInfo = (timeSlotId: number) => {
    if (!timeSlots) return { day: "-", time: "-", duration: 0 };
    const timeSlot = timeSlots.find((ts: any) => ts.id === timeSlotId);
    if (!timeSlot) return { day: "-", time: "-", duration: 0 };
    
    // Hitung durasi dalam menit
    const startParts = timeSlot.startTime.split(':').map(Number);
    const endParts = timeSlot.endTime.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    const duration = endMinutes - startMinutes;
    
    return {
      day: timeSlot.day,
      time: `${timeSlot.startTime} - ${timeSlot.endTime}`,
      duration: duration // durasi dalam menit
    };
  };
  
  // Hitung beban mengajar per guru
  const calculateTeacherWorkload = () => {
    if (!schedules || !teachers || !timeSlots) return [];
    
    const workload: { [key: number]: number } = {};
    
    // Inisialisasi workload untuk semua guru
    teachers.forEach((teacher: any) => {
      workload[teacher.id] = 0;
    });
    
    // Hitung total menit mengajar per guru
    schedules.forEach((schedule: any) => {
      const { duration } = getTimeSlotInfo(schedule.timeSlotId);
      if (workload[schedule.teacherId] !== undefined) {
        workload[schedule.teacherId] += duration;
      }
    });
    
    // Convert ke format jam dan urutkan berdasarkan beban tertinggi
    return teachers.map((teacher: any) => ({
      id: teacher.id,
      name: teacher.name,
      minutesPerWeek: workload[teacher.id] || 0,
      hoursPerWeek: Math.round((workload[teacher.id] || 0) / 60 * 10) / 10, // rounded to 1 decimal
      maxHours: teacher.maxHoursPerWeek,
      utilization: Math.round(((workload[teacher.id] || 0) / 60) / teacher.maxHoursPerWeek * 100)
    })).sort((a, b) => b.minutesPerWeek - a.minutesPerWeek);
  };
  
  // Hitung distribusi mata pelajaran
  const calculateSubjectDistribution = () => {
    if (!schedules || !subjects) return [];
    
    const distribution: { [key: number]: number } = {};
    
    // Inisialisasi distribution untuk semua mata pelajaran
    subjects.forEach((subject: any) => {
      distribution[subject.id] = 0;
    });
    
    // Hitung jumlah jadwal per mata pelajaran
    schedules.forEach((schedule: any) => {
      if (distribution[schedule.subjectId] !== undefined) {
        distribution[schedule.subjectId]++;
      }
    });
    
    // Format data untuk grafik
    return subjects.map((subject: any) => ({
      id: subject.id,
      name: subject.name,
      count: distribution[subject.id] || 0
    })).sort((a, b) => b.count - a.count);
  };
  
  // Hitung distribusi kelas
  const calculateClassDistribution = () => {
    if (!schedules || !classes) return [];
    
    const distribution: { [key: number]: number } = {};
    
    // Inisialisasi distribution untuk semua kelas
    classes.forEach((cls: any) => {
      distribution[cls.id] = 0;
    });
    
    // Hitung jumlah jadwal per kelas
    schedules.forEach((schedule: any) => {
      if (distribution[schedule.classId] !== undefined) {
        distribution[schedule.classId]++;
      }
    });
    
    // Format data untuk grafik
    return classes.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      count: distribution[cls.id] || 0
    })).sort((a, b) => b.count - a.count);
  };
  
  // Hitung ringkasan statistik
  const calculateStatistics = () => {
    if (!schedules || !teachers || !classes || !subjects) return {
      totalSchedules: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSubjects: 0,
      averageTeacherLoad: 0,
      maxUtilization: 0,
      minUtilization: 0,
      conflicts: 0
    };
    
    const teacherWorkloads = calculateTeacherWorkload();
    
    // Hitung rata-rata beban mengajar
    const totalHours = teacherWorkloads.reduce((sum, teacher) => sum + teacher.hoursPerWeek, 0);
    const averageTeacherLoad = teacherWorkloads.length > 0 ? totalHours / teacherWorkloads.length : 0;
    
    // Cari utilisasi tertinggi dan terendah
    const utilizations = teacherWorkloads.map(teacher => teacher.utilization);
    const maxUtilization = utilizations.length > 0 ? Math.max(...utilizations) : 0;
    const minUtilization = utilizations.length > 0 ? Math.min(...utilizations) : 0;
    
    return {
      totalSchedules: schedules.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      averageTeacherLoad: Math.round(averageTeacherLoad * 10) / 10,
      maxUtilization,
      minUtilization,
      conflicts: generationDetail ? generationDetail.conflictCount || 0 : 0
    };
  };
  
  // Warna untuk grafik
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Data untuk distribusi mata pelajaran (top 10)
  const subjectData = calculateSubjectDistribution().slice(0, 10);
  
  // Data untuk grafik beban mengajar (top 10)
  const workloadData = calculateTeacherWorkload().slice(0, 10);
  
  // Data untuk grafik utilisasi guru
  const utilizationData = [
    { name: '0-25%', value: 0 },
    { name: '26-50%', value: 0 },
    { name: '51-75%', value: 0 },
    { name: '76-100%', value: 0 },
    { name: '>100%', value: 0 }
  ];
  
  calculateTeacherWorkload().forEach(teacher => {
    if (teacher.utilization <= 25) {
      utilizationData[0].value++;
    } else if (teacher.utilization <= 50) {
      utilizationData[1].value++;
    } else if (teacher.utilization <= 75) {
      utilizationData[2].value++;
    } else if (teacher.utilization <= 100) {
      utilizationData[3].value++;
    } else {
      utilizationData[4].value++;
    }
  });
  
  // Statistik ringkasan
  const stats = calculateStatistics();
  
  // Format tanggal
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format durasi
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 1) {
      return `${remainingSeconds} detik`;
    } else if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}d`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}j ${remainingMinutes}m ${remainingSeconds}d`;
    }
  };
  
  // Fungsi untuk ekspor laporan
  const handleExportReport = () => {
    exportReportMutation.mutate();
  };
  
  const isLoading = isLoadingGenerations || isLoadingDetail || isLoadingSchedules || 
                   isLoadingTeachers || isLoadingSubjects || isLoadingClasses || isLoadingTimeSlots;
  
  return (
    <Layout title="Laporan">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Laporan Penjadwalan</CardTitle>
            <CardDescription>
              Analisis dan statistik hasil penjadwalan
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={exportReportMutation.isPending || !selectedGeneration}
          >
            <FileTextIcon className="h-4 w-4 mr-2" />
            Export Laporan
          </Button>
        </CardHeader>
        <CardContent>
          {/* Pilih Generasi Jadwal */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pilih Jadwal
            </label>
            <Select
              value={selectedGeneration}
              onValueChange={setSelectedGeneration}
              disabled={isLoadingGenerations || !completedGenerations || completedGenerations.length === 0}
            >
              <SelectTrigger className="w-full md:w-[350px]">
                <SelectValue placeholder="Pilih jadwal untuk melihat laporan" />
              </SelectTrigger>
              <SelectContent>
                {completedGenerations && completedGenerations.map((gen: any) => (
                  <SelectItem key={gen.id} value={gen.id.toString()}>
                    {gen.name} ({gen.academicYear}, Semester {gen.semester === "ganjil" ? "Ganjil" : "Genap"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !selectedGeneration ? (
            <div className="text-center py-20 text-slate-500">
              Silakan pilih jadwal dari daftar di atas untuk melihat laporan
            </div>
          ) : !generationDetail ? (
            <div className="text-center py-20 text-slate-500">
              Data tidak ditemukan
            </div>
          ) : (
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
                <TabsTrigger value="overview">
                  <BarChart3Icon className="h-4 w-4 mr-2" />
                  Ringkasan
                </TabsTrigger>
                <TabsTrigger value="workload">
                  <ClipboardListIcon className="h-4 w-4 mr-2" />
                  Beban Mengajar
                </TabsTrigger>
                <TabsTrigger value="distribution">
                  <GraduationCapIcon className="h-4 w-4 mr-2" />
                  Distribusi
                </TabsTrigger>
              </TabsList>
              
              {/* Tab Ringkasan */}
              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Info Generasi Jadwal */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{generationDetail.name}</CardTitle>
                      <CardDescription>
                        Tahun Ajaran {generationDetail.academicYear}, Semester {generationDetail.semester === "ganjil" ? "Ganjil" : "Genap"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-slate-500">Dibuat pada</div>
                          <div className="font-medium">{formatDate(generationDetail.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Selesai pada</div>
                          <div className="font-medium">{formatDate(generationDetail.completedAt)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Durasi Proses</div>
                          <div className="font-medium">{formatDuration(generationDetail.executionTime)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Nilai Fitness</div>
                          <div className="font-medium">
                            {generationDetail.fitnessValue 
                              ? `${(parseFloat(generationDetail.fitnessValue) * 100).toFixed(0)}%` 
                              : "-"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-1 flex justify-between">
                          <span>Kualitas Jadwal</span>
                          <span>
                            {generationDetail.fitnessValue 
                              ? `${(parseFloat(generationDetail.fitnessValue) * 100).toFixed(0)}%` 
                              : "-"}
                          </span>
                        </div>
                        <Progress 
                          value={generationDetail.fitnessValue ? parseFloat(generationDetail.fitnessValue) * 100 : 0} 
                          className="h-2" 
                        />
                        
                        <div className="mt-4 flex items-start gap-1 text-sm text-slate-600">
                          <InfoIcon className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                          <div>
                            {generationDetail.conflictCount === 0 ? (
                              <span>Jadwal berhasil dibuat tanpa bentrok dan memenuhi semua batasan.</span>
                            ) : (
                              <span>Terdapat {generationDetail.conflictCount} bentrok dalam jadwal final.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Statistik Jadwal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Statistik Jadwal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                                <CalendarIcon className="h-4 w-4" />
                              </div>
                              <span>Total Jadwal</span>
                            </div>
                            <span className="font-semibold">{stats.totalSchedules}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
                                <BookOpenIcon className="h-4 w-4" />
                              </div>
                              <span>Total Mata Pelajaran</span>
                            </div>
                            <span className="font-semibold">{stats.totalSubjects}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                                <GraduationCapIcon className="h-4 w-4" />
                              </div>
                              <span>Total Kelas</span>
                            </div>
                            <span className="font-semibold">{stats.totalClasses}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                                <UserIcon className="h-4 w-4" />
                              </div>
                              <span>Total Guru</span>
                            </div>
                            <span className="font-semibold">{stats.totalTeachers}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
                                <AlertTriangleIcon className="h-4 w-4" />
                              </div>
                              <span>Bentrok Jadwal</span>
                            </div>
                            <span className="font-semibold">{stats.conflicts}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Beban Mengajar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>Rata-rata jam mengajar guru</span>
                            <span className="font-semibold">{stats.averageTeacherLoad} jam/minggu</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <span>Utilisasi tertinggi</span>
                            <span className="font-semibold">{stats.maxUtilization}%</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <span>Utilisasi terendah</span>
                            <span className="font-semibold">{stats.minUtilization}%</span>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <div className="text-sm mb-2">Distribusi Utilisasi Guru</div>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={utilizationData.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {utilizationData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Legend layout="vertical" verticalAlign="bottom" align="center" />
                                  <RechartsTooltip formatter={(value) => [`${value} guru`, 'Jumlah']} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Pengaturan Algoritma Genetika */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Pengaturan Algoritma Genetika</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-slate-500">Ukuran Populasi</div>
                          <div className="font-medium">{generationDetail.populationSize}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Jumlah Generasi</div>
                          <div className="font-medium">{generationDetail.maxGenerations}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Probabilitas Crossover</div>
                          <div className="font-medium">{generationDetail.crossoverRate}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Probabilitas Mutasi</div>
                          <div className="font-medium">{generationDetail.mutationRate}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Tab Beban Mengajar */}
              <TabsContent value="workload">
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Beban Mengajar Guru</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-6">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={workloadData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis label={{ value: 'Jam per Minggu', angle: -90, position: 'insideLeft' }} />
                              <RechartsTooltip formatter={(value) => [`${value} jam`, 'Beban Mengajar']} />
                              <Bar dataKey="hoursPerWeek" fill="#0f766e" name="Jam Mengajar" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Guru</TableHead>
                            <TableHead>Beban Mengajar</TableHead>
                            <TableHead>Maksimum</TableHead>
                            <TableHead>Utilisasi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculateTeacherWorkload().map((teacher) => (
                            <TableRow key={teacher.id}>
                              <TableCell className="font-medium">{teacher.name}</TableCell>
                              <TableCell>{teacher.hoursPerWeek} jam</TableCell>
                              <TableCell>{teacher.maxHours} jam</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        teacher.utilization > 100 
                                          ? 'bg-red-500' 
                                          : teacher.utilization > 80 
                                            ? 'bg-amber-500' 
                                            : 'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(teacher.utilization, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm">{teacher.utilization}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Tab Distribusi */}
              <TabsContent value="distribution">
                <div className="space-y-6">
                  {/* Distribusi Mata Pelajaran */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Distribusi Mata Pelajaran</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={subjectData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} />
                            <RechartsTooltip formatter={(value) => [`${value} jadwal`, 'Jumlah']} />
                            <Bar dataKey="count" fill="#8884d8" name="Jumlah Jadwal" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Distribusi Kelas */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Distribusi Kelas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {calculateClassDistribution().map((classItem) => (
                          <div key={classItem.id} className="border rounded-md p-4">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">{classItem.name}</span>
                              <span>{classItem.count} jadwal</span>
                            </div>
                            <Progress value={(classItem.count / Math.max(...calculateClassDistribution().map(c => c.count))) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
