import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
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
import { 
  DownloadIcon, 
  FileTextIcon, 
  BookOpenIcon, 
  UserIcon, 
  DoorOpenIcon, 
  CalendarIcon,
  FileIcon,
  FilterIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Schedule } from "@shared/schema";

// Hari dalam Bahasa Indonesia
const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Fungsi untuk mendapatkan warna latar belakang berdasarkan nama mata pelajaran (konsisten)
function getSubjectColor(subjectName: string): string {
  // Menggunakan hash sederhana untuk menghasilkan warna yang konsisten
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Pilihan warna pastel lembut
  const colors = [
    "bg-blue-50 text-blue-800",
    "bg-green-50 text-green-800",
    "bg-amber-50 text-amber-800",
    "bg-purple-50 text-purple-800", 
    "bg-pink-50 text-pink-800",
    "bg-teal-50 text-teal-800",
    "bg-lime-50 text-lime-800",
    "bg-indigo-50 text-indigo-800",
    "bg-rose-50 text-rose-800",
    "bg-cyan-50 text-cyan-800"
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

export default function LihatJadwalPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("class");
  const [selectedGeneration, setSelectedGeneration] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  
  // Parse query parameters untuk mendapatkan ID generasi jadwal jika ada
  const queryParams = new URLSearchParams(location.split("?")[1] || "");
  const generationId = queryParams.get("id");
  
  // Jika ada ID generasi dalam URL, gunakan itu sebagai generasi yang dipilih
  useState(() => {
    if (generationId) {
      setSelectedGeneration(generationId);
    }
  });
  
  // Fetch data semua generasi jadwal
  const { data: generations, isLoading: isLoadingGenerations } = useQuery({
    queryKey: ["/api/schedule-generations"],
  });
  
  // Fetch data guru
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["/api/teachers"],
  });
  
  // Fetch data kelas
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/classes"],
  });
  
  // Fetch data ruangan
  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["/api/rooms"],
  });
  
  // Fetch data mata pelajaran
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["/api/subjects"],
  });
  
  // Fetch data slot waktu
  const { data: timeSlots, isLoading: isLoadingTimeSlots } = useQuery({
    queryKey: ["/api/timeslots"],
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
  
  // Fetch jadwal berdasarkan generasi yang dipilih
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
  
  // Mutasi untuk export jadwal ke Excel
  const exportToExcelMutation = useMutation({
    mutationFn: async () => {
      // Ini adalah simulasi ekspor ke Excel
      // Dalam implementasi sebenarnya, ini akan memanggil API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Jadwal berhasil diekspor ke Excel",
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
  
  // Mutasi untuk export jadwal ke PDF
  const exportToPdfMutation = useMutation({
    mutationFn: async () => {
      // Ini adalah simulasi ekspor ke PDF
      // Dalam implementasi sebenarnya, ini akan memanggil API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Jadwal berhasil diekspor ke PDF",
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
  
  // Fungsi untuk mendapatkan nama kelas berdasarkan ID
  const getClassName = (classId: number) => {
    if (!classes) return "-";
    const cls = classes.find((c: any) => c.id === classId);
    return cls ? cls.name : "-";
  };
  
  // Fungsi untuk mendapatkan nama ruangan berdasarkan ID
  const getRoomName = (roomId: number) => {
    if (!rooms) return "-";
    const room = rooms.find((r: any) => r.id === roomId);
    return room ? room.name : "-";
  };
  
  // Fungsi untuk mendapatkan nama mata pelajaran berdasarkan ID
  const getSubjectName = (subjectId: number) => {
    if (!subjects) return "-";
    const subject = subjects.find((s: any) => s.id === subjectId);
    return subject ? subject.name : "-";
  };
  
  // Fungsi untuk mendapatkan info slot waktu berdasarkan ID
  const getTimeSlotInfo = (timeSlotId: number) => {
    if (!timeSlots) return { day: "-", time: "-" };
    const timeSlot = timeSlots.find((ts: any) => ts.id === timeSlotId);
    if (!timeSlot) return { day: "-", time: "-" };
    return {
      day: timeSlot.day,
      time: `${timeSlot.startTime} - ${timeSlot.endTime}`
    };
  };
  
  // Filter jadwal berdasarkan kelas yang dipilih
  const filteredByClass = schedules && selectedClass !== "all"
    ? schedules.filter((schedule: any) => schedule.classId.toString() === selectedClass)
    : schedules;
  
  // Filter jadwal berdasarkan guru yang dipilih
  const filteredByTeacher = schedules && selectedTeacher !== "all"
    ? schedules.filter((schedule: any) => schedule.teacherId.toString() === selectedTeacher)
    : schedules;
  
  // Filter jadwal berdasarkan ruangan yang dipilih
  const filteredByRoom = schedules && selectedRoom !== "all"
    ? schedules.filter((schedule: any) => schedule.roomId.toString() === selectedRoom)
    : schedules;
  
  // Mengorganisir jadwal berdasarkan hari dan waktu untuk tampilan per kelas
  const organizeByDayTime = (schedules: any[], classId: number) => {
    if (!schedules || !timeSlots) return [];
    
    const filtered = classId !== 0 
      ? schedules.filter((s: any) => s.classId === classId)
      : schedules;
    
    // Kelompokkan berdasarkan hari
    const byDay: { [key: string]: any[] } = {};
    daysOfWeek.forEach(day => { byDay[day] = []; });
    
    filtered.forEach((schedule: any) => {
      const { day } = getTimeSlotInfo(schedule.timeSlotId);
      if (byDay[day]) {
        byDay[day].push(schedule);
      }
    });
    
    // Sort berdasarkan waktu mulai
    for (const day in byDay) {
      byDay[day].sort((a: any, b: any) => {
        const timeSlotA = timeSlots.find((ts: any) => ts.id === a.timeSlotId);
        const timeSlotB = timeSlots.find((ts: any) => ts.id === b.timeSlotId);
        if (!timeSlotA || !timeSlotB) return 0;
        
        return timeSlotA.startTime.localeCompare(timeSlotB.startTime);
      });
    }
    
    return byDay;
  };
  
  // Mengorganisir jadwal berdasarkan hari dan waktu untuk tampilan per guru
  const organizeByDayTimeForTeacher = (schedules: any[], teacherId: number) => {
    if (!schedules || !timeSlots) return [];
    
    const filtered = teacherId !== 0 
      ? schedules.filter((s: any) => s.teacherId === teacherId)
      : schedules;
    
    // Kelompokkan berdasarkan hari
    const byDay: { [key: string]: any[] } = {};
    daysOfWeek.forEach(day => { byDay[day] = []; });
    
    filtered.forEach((schedule: any) => {
      const { day } = getTimeSlotInfo(schedule.timeSlotId);
      if (byDay[day]) {
        byDay[day].push(schedule);
      }
    });
    
    // Sort berdasarkan waktu mulai
    for (const day in byDay) {
      byDay[day].sort((a: any, b: any) => {
        const timeSlotA = timeSlots.find((ts: any) => ts.id === a.timeSlotId);
        const timeSlotB = timeSlots.find((ts: any) => ts.id === b.timeSlotId);
        if (!timeSlotA || !timeSlotB) return 0;
        
        return timeSlotA.startTime.localeCompare(timeSlotB.startTime);
      });
    }
    
    return byDay;
  };
  
  // Mengorganisir jadwal berdasarkan hari dan waktu untuk tampilan per ruangan
  const organizeByDayTimeForRoom = (schedules: any[], roomId: number) => {
    if (!schedules || !timeSlots) return [];
    
    const filtered = roomId !== 0 
      ? schedules.filter((s: any) => s.roomId === roomId)
      : schedules;
    
    // Kelompokkan berdasarkan hari
    const byDay: { [key: string]: any[] } = {};
    daysOfWeek.forEach(day => { byDay[day] = []; });
    
    filtered.forEach((schedule: any) => {
      const { day } = getTimeSlotInfo(schedule.timeSlotId);
      if (byDay[day]) {
        byDay[day].push(schedule);
      }
    });
    
    // Sort berdasarkan waktu mulai
    for (const day in byDay) {
      byDay[day].sort((a: any, b: any) => {
        const timeSlotA = timeSlots.find((ts: any) => ts.id === a.timeSlotId);
        const timeSlotB = timeSlots.find((ts: any) => ts.id === b.timeSlotId);
        if (!timeSlotA || !timeSlotB) return 0;
        
        return timeSlotA.startTime.localeCompare(timeSlotB.startTime);
      });
    }
    
    return byDay;
  };
  
  // Fungsi untuk melakukan ekspor ke Excel
  const handleExportToExcel = () => {
    exportToExcelMutation.mutate();
  };
  
  // Fungsi untuk melakukan ekspor ke PDF
  const handleExportToPdf = () => {
    exportToPdfMutation.mutate();
  };
  
  // Fungsi untuk mendapatkan data generasi jadwal yang dipilih
  const getSelectedGeneration = () => {
    if (!generations) return null;
    return generations.find((gen: any) => gen.id.toString() === selectedGeneration);
  };
  
  const isLoading = isLoadingGenerations || isLoadingTeachers || isLoadingClasses || 
                   isLoadingRooms || isLoadingSubjects || isLoadingTimeSlots || isLoadingSchedules;
  
  return (
    <Layout title="Lihat Jadwal">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lihat Jadwal Pelajaran</CardTitle>
            <CardDescription>
              Lihat dan kelola jadwal pelajaran yang telah dibuat
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportToExcel}
              disabled={exportToExcelMutation.isPending || !schedules || schedules.length === 0}
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportToPdf}
              disabled={exportToPdfMutation.isPending || !schedules || schedules.length === 0}
            >
              <FileIcon className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pilih Generasi Jadwal */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pilih Jadwal
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <Select
                value={selectedGeneration}
                onValueChange={setSelectedGeneration}
                disabled={isLoadingGenerations || !completedGenerations || completedGenerations.length === 0}
              >
                <SelectTrigger className="w-full md:w-[350px]">
                  <SelectValue placeholder="Pilih jadwal yang ingin dilihat" />
                </SelectTrigger>
                <SelectContent>
                  {completedGenerations && completedGenerations.map((gen: any) => (
                    <SelectItem key={gen.id} value={gen.id.toString()}>
                      {gen.name} ({gen.academicYear}, Semester {gen.semester === "ganjil" ? "Ganjil" : "Genap"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {getSelectedGeneration() && (
                <div className="flex items-center text-sm text-slate-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Dibuat pada: {new Date(getSelectedGeneration().createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long", 
                    year: "numeric"
                  })}
                </div>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !schedules || schedules.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              {!selectedGeneration 
                ? "Silakan pilih jadwal dari daftar di atas" 
                : "Tidak ada data jadwal yang tersedia"}
            </div>
          ) : (
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
                <TabsTrigger value="class">
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Per Kelas
                </TabsTrigger>
                <TabsTrigger value="teacher">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Per Guru
                </TabsTrigger>
                <TabsTrigger value="room">
                  <DoorOpenIcon className="h-4 w-4 mr-2" />
                  Per Ruangan
                </TabsTrigger>
              </TabsList>
              
              {/* Tab Jadwal Per Kelas */}
              <TabsContent value="class">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Kelas
                  </label>
                  <div className="flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2 text-slate-400" />
                    <Select
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                    >
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Semua Kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {classes && classes.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedClass === "all" ? (
                  // Tampilan semua kelas dalam bentuk tabel
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Guru</TableHead>
                          <TableHead>Hari</TableHead>
                          <TableHead>Jam</TableHead>
                          <TableHead>Ruangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredByClass && filteredByClass.length > 0 ? (
                          filteredByClass.map((schedule: any) => {
                            const { day, time } = getTimeSlotInfo(schedule.timeSlotId);
                            const subjectName = getSubjectName(schedule.subjectId);
                            
                            return (
                              <TableRow key={schedule.id}>
                                <TableCell className="font-medium">{getClassName(schedule.classId)}</TableCell>
                                <TableCell>
                                  <Badge className={getSubjectColor(subjectName)}>
                                    {subjectName}
                                  </Badge>
                                </TableCell>
                                <TableCell>{getTeacherName(schedule.teacherId)}</TableCell>
                                <TableCell>{day}</TableCell>
                                <TableCell>{time}</TableCell>
                                <TableCell>{getRoomName(schedule.roomId)}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                              Tidak ada data jadwal yang tersedia
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  // Tampilan per kelas berdasarkan hari
                  <div className="space-y-6">
                    {classes && selectedClass && (
                      <h3 className="text-lg font-medium">
                        Jadwal Kelas: {getClassName(parseInt(selectedClass))}
                      </h3>
                    )}
                    
                    {daysOfWeek.map(day => {
                      const daySchedules = organizeByDayTime(filteredByClass, parseInt(selectedClass))[day] || [];
                      
                      return (
                        <Card key={day} className="border">
                          <CardHeader className="py-3 px-4 bg-slate-50">
                            <CardTitle className="text-base">{day}</CardTitle>
                          </CardHeader>
                          <CardContent className="px-0 py-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-32">Jam</TableHead>
                                  <TableHead>Mata Pelajaran</TableHead>
                                  <TableHead>Guru</TableHead>
                                  <TableHead>Ruangan</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {daySchedules.length > 0 ? (
                                  daySchedules.map((schedule: any) => {
                                    const { time } = getTimeSlotInfo(schedule.timeSlotId);
                                    const subjectName = getSubjectName(schedule.subjectId);
                                    
                                    return (
                                      <TableRow key={schedule.id}>
                                        <TableCell>{time}</TableCell>
                                        <TableCell>
                                          <Badge className={getSubjectColor(subjectName)}>
                                            {subjectName}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{getTeacherName(schedule.teacherId)}</TableCell>
                                        <TableCell>{getRoomName(schedule.roomId)}</TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                                      Tidak ada jadwal pada hari {day}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab Jadwal Per Guru */}
              <TabsContent value="teacher">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Guru
                  </label>
                  <div className="flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2 text-slate-400" />
                    <Select
                      value={selectedTeacher}
                      onValueChange={setSelectedTeacher}
                    >
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Semua Guru" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Guru</SelectItem>
                        {teachers && teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedTeacher === "all" ? (
                  // Tampilan semua guru dalam bentuk tabel
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guru</TableHead>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Hari</TableHead>
                          <TableHead>Jam</TableHead>
                          <TableHead>Ruangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredByTeacher && filteredByTeacher.length > 0 ? (
                          filteredByTeacher.map((schedule: any) => {
                            const { day, time } = getTimeSlotInfo(schedule.timeSlotId);
                            const subjectName = getSubjectName(schedule.subjectId);
                            
                            return (
                              <TableRow key={schedule.id}>
                                <TableCell className="font-medium">{getTeacherName(schedule.teacherId)}</TableCell>
                                <TableCell>
                                  <Badge className={getSubjectColor(subjectName)}>
                                    {subjectName}
                                  </Badge>
                                </TableCell>
                                <TableCell>{getClassName(schedule.classId)}</TableCell>
                                <TableCell>{day}</TableCell>
                                <TableCell>{time}</TableCell>
                                <TableCell>{getRoomName(schedule.roomId)}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                              Tidak ada data jadwal yang tersedia
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  // Tampilan per guru berdasarkan hari
                  <div className="space-y-6">
                    {teachers && selectedTeacher && (
                      <h3 className="text-lg font-medium">
                        Jadwal Guru: {getTeacherName(parseInt(selectedTeacher))}
                      </h3>
                    )}
                    
                    {daysOfWeek.map(day => {
                      const daySchedules = organizeByDayTimeForTeacher(filteredByTeacher, parseInt(selectedTeacher))[day] || [];
                      
                      return (
                        <Card key={day} className="border">
                          <CardHeader className="py-3 px-4 bg-slate-50">
                            <CardTitle className="text-base">{day}</CardTitle>
                          </CardHeader>
                          <CardContent className="px-0 py-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-32">Jam</TableHead>
                                  <TableHead>Mata Pelajaran</TableHead>
                                  <TableHead>Kelas</TableHead>
                                  <TableHead>Ruangan</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {daySchedules.length > 0 ? (
                                  daySchedules.map((schedule: any) => {
                                    const { time } = getTimeSlotInfo(schedule.timeSlotId);
                                    const subjectName = getSubjectName(schedule.subjectId);
                                    
                                    return (
                                      <TableRow key={schedule.id}>
                                        <TableCell>{time}</TableCell>
                                        <TableCell>
                                          <Badge className={getSubjectColor(subjectName)}>
                                            {subjectName}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{getClassName(schedule.classId)}</TableCell>
                                        <TableCell>{getRoomName(schedule.roomId)}</TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                                      Tidak ada jadwal pada hari {day}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab Jadwal Per Ruangan */}
              <TabsContent value="room">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Ruangan
                  </label>
                  <div className="flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2 text-slate-400" />
                    <Select
                      value={selectedRoom}
                      onValueChange={setSelectedRoom}
                    >
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Semua Ruangan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Ruangan</SelectItem>
                        {rooms && rooms.map((room: any) => (
                          <SelectItem key={room.id} value={room.id.toString()}>{room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedRoom === "all" ? (
                  // Tampilan semua ruangan dalam bentuk tabel
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ruangan</TableHead>
                          <TableHead>Mata Pelajaran</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Guru</TableHead>
                          <TableHead>Hari</TableHead>
                          <TableHead>Jam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredByRoom && filteredByRoom.length > 0 ? (
                          filteredByRoom.map((schedule: any) => {
                            const { day, time } = getTimeSlotInfo(schedule.timeSlotId);
                            const subjectName = getSubjectName(schedule.subjectId);
                            
                            return (
                              <TableRow key={schedule.id}>
                                <TableCell className="font-medium">{getRoomName(schedule.roomId)}</TableCell>
                                <TableCell>
                                  <Badge className={getSubjectColor(subjectName)}>
                                    {subjectName}
                                  </Badge>
                                </TableCell>
                                <TableCell>{getClassName(schedule.classId)}</TableCell>
                                <TableCell>{getTeacherName(schedule.teacherId)}</TableCell>
                                <TableCell>{day}</TableCell>
                                <TableCell>{time}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                              Tidak ada data jadwal yang tersedia
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  // Tampilan per ruangan berdasarkan hari
                  <div className="space-y-6">
                    {rooms && selectedRoom && (
                      <h3 className="text-lg font-medium">
                        Jadwal Ruangan: {getRoomName(parseInt(selectedRoom))}
                      </h3>
                    )}
                    
                    {daysOfWeek.map(day => {
                      const daySchedules = organizeByDayTimeForRoom(filteredByRoom, parseInt(selectedRoom))[day] || [];
                      
                      return (
                        <Card key={day} className="border">
                          <CardHeader className="py-3 px-4 bg-slate-50">
                            <CardTitle className="text-base">{day}</CardTitle>
                          </CardHeader>
                          <CardContent className="px-0 py-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-32">Jam</TableHead>
                                  <TableHead>Mata Pelajaran</TableHead>
                                  <TableHead>Kelas</TableHead>
                                  <TableHead>Guru</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {daySchedules.length > 0 ? (
                                  daySchedules.map((schedule: any) => {
                                    const { time } = getTimeSlotInfo(schedule.timeSlotId);
                                    const subjectName = getSubjectName(schedule.subjectId);
                                    
                                    return (
                                      <TableRow key={schedule.id}>
                                        <TableCell>{time}</TableCell>
                                        <TableCell>
                                          <Badge className={getSubjectColor(subjectName)}>
                                            {subjectName}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{getClassName(schedule.classId)}</TableCell>
                                        <TableCell>{getTeacherName(schedule.teacherId)}</TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                                      Tidak ada jadwal pada hari {day}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
