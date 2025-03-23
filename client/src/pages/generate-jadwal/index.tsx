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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, InfoIcon, CogIcon, CheckCircle, XCircle, PlayCircle, Clock, CalendarCheck } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScheduleGeneration } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Form schema
const generateFormSchema = z.object({
  name: z.string().min(3, "Nama jadwal wajib diisi"),
  academicYear: z.string().min(1, "Tahun ajaran wajib diisi"),
  semester: z.enum(["ganjil", "genap"]),
  populationSize: z.coerce.number().min(50, "Minimal 50").max(500, "Maksimal 500"),
  maxGenerations: z.coerce.number().min(50, "Minimal 50").max(1000, "Maksimal 1000"),
  crossoverRate: z.string(),
  mutationRate: z.string(),
  selectionMethod: z.enum(["tournament", "roulette", "rank"]),
});

type GenerateFormData = z.infer<typeof generateFormSchema>;

export default function GenerateJadwalPage() {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("new");
  
  // Form setup
  const form = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      name: `Jadwal ${getCurrentSemesterInfo()}`,
      academicYear: getCurrentAcademicYear(),
      semester: determineCurrentSemester(),
      populationSize: 200,
      maxGenerations: 150,
      crossoverRate: "0.85",
      mutationRate: "0.15",
      selectionMethod: "tournament",
    },
  });

  // Fetch past generations
  const { data: scheduleGenerations, isLoading } = useQuery({
    queryKey: ["/api/schedule-generations"],
  });

  // Create generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: GenerateFormData) => {
      const res = await apiRequest("POST", "/api/schedule-generations", data);
      return res.json();
    },
    onSuccess: () => {
      setCurrentTab("history");
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-generations"] });
      toast({
        title: "Berhasil",
        description: "Proses generate jadwal telah dimulai",
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

  // Fetch data readiness statistics
  const { data: readinessStats } = useQuery({
    queryKey: ["/api/readiness-stats"],
    enabled: false, // Will be enabled with a proper endpoint
  });

  // Helper functions for date formatting
  function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-based month
    
    // If it's after July, academic year is this year and next year
    if (month > 7) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  }

  function determineCurrentSemester() {
    const now = new Date();
    const month = now.getMonth() + 1; // 0-based month
    
    // Ganjil: August to December, Genap: January to June
    if (month >= 8 || month <= 1) {
      return "ganjil";
    } else {
      return "genap";
    }
  }

  function getCurrentSemesterInfo() {
    const semester = determineCurrentSemester() === "ganjil" ? "Ganjil" : "Genap";
    return `${semester} ${getCurrentAcademicYear()}`;
  }

  // Mock data for development purposes - would be replaced with actual API calls
  const readiness = {
    teachers: { count: 48, status: "complete" },
    classes: { count: 24, status: "complete" },
    subjects: { count: 78, status: "complete" },
    rooms: { count: 32, status: "complete" },
    timeSlots: { count: 35, status: "complete" },
    teacherSubjects: { count: 156, status: "warning" },
    classSubjects: { count: 180, status: "complete" },
    status: "ready", // "ready", "incomplete", "empty"
    message: "Data siap untuk generasi jadwal"
  };

  const warningMessages = [
    "Beberapa guru belum ditetapkan mata pelajaran yang diajar",
    "Preferensi waktu untuk beberapa guru belum ditetapkan"
  ];

  // Filter generations by status
  const inProgressGenerations = scheduleGenerations 
    ? scheduleGenerations.filter((gen: ScheduleGeneration) => gen.status === "in_progress") 
    : [];

  const completedGenerations = scheduleGenerations 
    ? scheduleGenerations.filter((gen: ScheduleGeneration) => gen.status === "completed")
    : [];

  const failedGenerations = scheduleGenerations 
    ? scheduleGenerations.filter((gen: ScheduleGeneration) => gen.status === "failed")
    : [];

  const pendingGenerations = scheduleGenerations 
    ? scheduleGenerations.filter((gen: ScheduleGeneration) => gen.status === "pending")
    : [];

  // Submit handler
  const onSubmit = (data: GenerateFormData) => {
    generateMutation.mutate(data);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: id });
    } catch (e) {
      return dateString;
    }
  };

  // Format duration for display
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

  // Get status badge based on generation status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Selesai
        </span>;
      case "in_progress":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1 animate-spin" />
          Berjalan
        </span>;
      case "failed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Gagal
        </span>;
      case "pending":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Menunggu
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          {status}
        </span>;
    }
  };

  return (
    <Layout title="Generate Jadwal">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="new">Generate Baru</TabsTrigger>
          <TabsTrigger value="history">Riwayat Generate</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>
        
        {/* Generate New Schedule Tab */}
        <TabsContent value="new">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Jadwal Baru</CardTitle>
                  <CardDescription>
                    Buat jadwal pelajaran baru dengan menggunakan algoritma genetika
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Jadwal</FormLabel>
                              <FormControl>
                                <Input placeholder="Masukkan nama jadwal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="academicYear"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tahun Ajaran</FormLabel>
                                <FormControl>
                                  <Input placeholder="Contoh: 2023/2024" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="semester"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Semester</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex space-x-4"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="ganjil" id="ganjil" />
                                      <Label htmlFor="ganjil">Ganjil</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="genap" id="genap" />
                                      <Label htmlFor="genap">Genap</Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <h3 className="text-md font-medium">Pengaturan Algoritma Genetika</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="populationSize"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex justify-between">
                                  <span>Ukuran Populasi</span>
                                  <span className="text-slate-500 text-sm font-normal">{field.value}</span>
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={50}
                                    max={500}
                                    step={10}
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="maxGenerations"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex justify-between">
                                  <span>Jumlah Generasi Maksimum</span>
                                  <span className="text-slate-500 text-sm font-normal">{field.value}</span>
                                </FormLabel>
                                <FormControl>
                                  <Slider
                                    min={50}
                                    max={1000}
                                    step={10}
                                    value={[field.value]}
                                    onValueChange={(value) => field.onChange(value[0])}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="crossoverRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex justify-between">
                                  <span>Probabilitas Crossover</span>
                                  <span className="text-slate-500 text-sm font-normal">{field.value}</span>
                                </FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih nilai" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0.75">0.75</SelectItem>
                                    <SelectItem value="0.80">0.80</SelectItem>
                                    <SelectItem value="0.85">0.85</SelectItem>
                                    <SelectItem value="0.90">0.90</SelectItem>
                                    <SelectItem value="0.95">0.95</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="mutationRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex justify-between">
                                  <span>Probabilitas Mutasi</span>
                                  <span className="text-slate-500 text-sm font-normal">{field.value}</span>
                                </FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih nilai" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0.05">0.05</SelectItem>
                                    <SelectItem value="0.10">0.10</SelectItem>
                                    <SelectItem value="0.15">0.15</SelectItem>
                                    <SelectItem value="0.20">0.20</SelectItem>
                                    <SelectItem value="0.25">0.25</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="selectionMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Metode Seleksi</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih metode seleksi" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="tournament">Tournament Selection</SelectItem>
                                  <SelectItem value="roulette">Roulette Wheel</SelectItem>
                                  <SelectItem value="rank">Rank Selection</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Alert className={
                          readiness.status === "ready" 
                            ? "bg-blue-50 border-blue-200 text-blue-800" 
                            : readiness.status === "incomplete" 
                              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                              : "bg-red-50 border-red-200 text-red-800"
                        }>
                          <InfoIcon className="h-4 w-4" />
                          <AlertTitle>Perkiraan Waktu Proses</AlertTitle>
                          <AlertDescription>
                            Dengan pengaturan saat ini, proses generate akan membutuhkan waktu sekitar 3-5 menit.
                          </AlertDescription>
                        </Alert>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          className="space-x-2"
                          disabled={generateMutation.isPending || readiness.status !== "ready"}
                        >
                          {generateMutation.isPending ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Memproses...</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-4 w-4" />
                              <span>Mulai Generate</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              {/* Readiness Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Kesiapan Data</CardTitle>
                  <CardDescription>
                    Status data yang diperlukan untuk generate jadwal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-center">
                      <span>Guru</span>
                      <div className="flex items-center">
                        <span className="mr-2">{readiness.teachers.count}</span>
                        {readiness.teachers.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Kelas</span>
                      <div className="flex items-center">
                        <span className="mr-2">{readiness.classes.count}</span>
                        {readiness.classes.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Mata Pelajaran</span>
                      <div className="flex items-center">
                        <span className="mr-2">{readiness.subjects.count}</span>
                        {readiness.subjects.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Ruangan</span>
                      <div className="flex items-center">
                        <span className="mr-2">{readiness.rooms.count}</span>
                        {readiness.rooms.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Slot Waktu</span>
                      <div className="flex items-center">
                        <span className="mr-2">{readiness.timeSlots.count}</span>
                        {readiness.timeSlots.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Guru-Mapel</span>
                      <div className="flex items-center">
                        <span className="mr-2">{readiness.teacherSubjects.count}</span>
                        {readiness.teacherSubjects.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Kelas-Mapel</span>
                      <div className="flex items-center">
                        <span className="mr-2">{readiness.classSubjects.count}</span>
                        {readiness.classSubjects.status === "complete" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </li>
                  </ul>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span>Status:</span>
                      <span className={
                        readiness.status === "ready" 
                          ? "text-green-600 font-medium" 
                          : readiness.status === "incomplete" 
                            ? "text-amber-600 font-medium"
                            : "text-red-600 font-medium"
                      }>
                        {readiness.status === "ready" 
                          ? "Siap" 
                          : readiness.status === "incomplete" 
                            ? "Perlu Perbaikan"
                            : "Data Tidak Lengkap"}
                      </span>
                    </div>
                    
                    {readiness.status === "incomplete" && (
                      <div className="text-sm text-amber-600 space-y-1">
                        {warningMessages.map((msg, idx) => (
                          <div key={idx} className="flex items-start">
                            <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Recently Generated Card */}
              {completedGenerations && completedGenerations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Jadwal Terbaru</CardTitle>
                    <CardDescription>
                      Jadwal yang terakhir dibuat
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {completedGenerations.slice(0, 1).map((generation: ScheduleGeneration) => (
                      <div key={generation.id} className="space-y-4">
                        <h3 className="font-medium">{generation.name}</h3>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500 block">Dibuat pada:</span>
                            <span>{formatDate(generation.createdAt)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Nilai Fitness:</span>
                            <span>{generation.fitnessValue || "-"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Durasi Proses:</span>
                            <span>{formatDuration(generation.executionTime)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Bentrok:</span>
                            <span>{generation.conflictCount || 0}</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-slate-500 block text-sm mb-1">Kualitas Jadwal:</span>
                          <div className="flex items-center space-x-3">
                            <Progress 
                              value={generation.fitnessValue ? parseFloat(generation.fitnessValue) * 100 : 0} 
                              className="h-2 flex-grow" 
                            />
                            <span className="text-sm font-medium">
                              {generation.fitnessValue 
                                ? `${(parseFloat(generation.fitnessValue) * 100).toFixed(0)}%` 
                                : "-"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" className="space-x-1" asChild>
                            <a href={`/lihat-jadwal?id=${generation.id}`}>
                              <CalendarCheck className="h-4 w-4" />
                              <span>Lihat Jadwal</span>
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Generation History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Generate Jadwal</CardTitle>
              <CardDescription>
                Daftar jadwal yang pernah digenerate sebelumnya
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : scheduleGenerations && scheduleGenerations.length > 0 ? (
                <div className="space-y-4">
                  {/* In Progress Jobs */}
                  {inProgressGenerations.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2 text-slate-900">Sedang Berjalan</h3>
                      <div className="space-y-3">
                        {inProgressGenerations.map((generation: ScheduleGeneration) => (
                          <div 
                            key={generation.id} 
                            className="border rounded-md p-4 bg-blue-50 border-blue-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{generation.name}</h4>
                                <div className="text-sm text-slate-600 mt-1">
                                  Dibuat pada {formatDate(generation.createdAt)}
                                </div>
                              </div>
                              <div>
                                {getStatusBadge(generation.status)}
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <div className="text-sm text-slate-600 mb-1">Proses Generate:</div>
                              <div className="relative">
                                <Progress value={50} className="h-2" />
                                <div className="flex justify-between text-xs mt-1">
                                  <span>Mohon tunggu...</span>
                                  <span className="text-blue-600 font-medium">Berjalan</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Completed Generations */}
                  <div>
                    <h3 className="font-medium mb-2 text-slate-900">Riwayat Generate</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Jadwal</TableHead>
                            <TableHead>Tahun Ajaran</TableHead>
                            <TableHead>Tanggal Generate</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Nilai Fitness</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...completedGenerations, ...failedGenerations, ...pendingGenerations]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((generation: ScheduleGeneration) => (
                              <TableRow key={generation.id}>
                                <TableCell className="font-medium">{generation.name}</TableCell>
                                <TableCell>{generation.academicYear}</TableCell>
                                <TableCell>{formatDate(generation.createdAt)}</TableCell>
                                <TableCell>{getStatusBadge(generation.status)}</TableCell>
                                <TableCell>
                                  {generation.fitnessValue 
                                    ? `${(parseFloat(generation.fitnessValue) * 100).toFixed(0)}%` 
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {generation.status === "completed" ? (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={`/lihat-jadwal?id=${generation.id}`}>
                                        Lihat Jadwal
                                      </a>
                                    </Button>
                                  ) : (
                                    <Button variant="outline" size="sm" disabled>
                                      {generation.status === "failed" ? "Gagal" : "Menunggu"}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          
                          {[...completedGenerations, ...failedGenerations, ...pendingGenerations].length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                                Belum ada jadwal yang digenerate
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Belum ada jadwal yang digenerate
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Algorithm Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Algoritma Genetika</CardTitle>
              <CardDescription>
                Konfigurasi parameter untuk algoritma genetika
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Parameter Umum</h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <Label className="flex justify-between mb-2">
                        <span>Ukuran Populasi</span>
                        <span className="text-slate-500 text-sm">200</span>
                      </Label>
                      <Slider defaultValue={[200]} min={50} max={500} step={10} className="mb-1" />
                      <p className="text-sm text-slate-500">
                        Jumlah solusi dalam satu generasi. Nilai yang lebih besar memberikan lebih banyak variasi tetapi membutuhkan lebih banyak waktu komputasi.
                      </p>
                    </div>
                    
                    <div>
                      <Label className="flex justify-between mb-2">
                        <span>Jumlah Generasi Maksimum</span>
                        <span className="text-slate-500 text-sm">150</span>
                      </Label>
                      <Slider defaultValue={[150]} min={50} max={1000} step={10} className="mb-1" />
                      <p className="text-sm text-slate-500">
                        Jumlah maksimum iterasi yang akan dilakukan algoritma. Nilai yang lebih besar memberikan hasil yang lebih baik tetapi membutuhkan lebih banyak waktu.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Parameter Crossover dan Mutasi</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2">Probabilitas Crossover</Label>
                      <Select defaultValue="0.85">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih nilai" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.75">0.75</SelectItem>
                          <SelectItem value="0.80">0.80</SelectItem>
                          <SelectItem value="0.85">0.85</SelectItem>
                          <SelectItem value="0.90">0.90</SelectItem>
                          <SelectItem value="0.95">0.95</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-slate-500 mt-1">
                        Peluang terjadinya pertukaran informasi antar solusi. Nilai yang lebih tinggi meningkatkan eksplorasi solusi.
                      </p>
                    </div>
                    
                    <div>
                      <Label className="mb-2">Probabilitas Mutasi</Label>
                      <Select defaultValue="0.15">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih nilai" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.05">0.05</SelectItem>
                          <SelectItem value="0.10">0.10</SelectItem>
                          <SelectItem value="0.15">0.15</SelectItem>
                          <SelectItem value="0.20">0.20</SelectItem>
                          <SelectItem value="0.25">0.25</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-slate-500 mt-1">
                        Peluang terjadinya perubahan acak pada solusi. Nilai yang lebih tinggi meningkatkan keragaman solusi.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Metode Seleksi</h3>
                  
                  <div>
                    <RadioGroup defaultValue="tournament" className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="tournament" id="tournament" className="mt-1" />
                        <div>
                          <Label htmlFor="tournament" className="font-medium">Tournament Selection</Label>
                          <p className="text-sm text-slate-500">
                            Memilih individu terbaik dari subset populasi yang dipilih secara acak. Memberikan keseimbangan antara eksplorasi dan eksploitasi.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="roulette" id="roulette" className="mt-1" />
                        <div>
                          <Label htmlFor="roulette" className="font-medium">Roulette Wheel</Label>
                          <p className="text-sm text-slate-500">
                            Probabilitas seleksi sebanding dengan nilai fitness. Individu dengan fitness tinggi memiliki peluang lebih besar untuk dipilih.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="rank" id="rank" className="mt-1" />
                        <div>
                          <Label htmlFor="rank" className="font-medium">Rank Selection</Label>
                          <p className="text-sm text-slate-500">
                            Seleksi berdasarkan peringkat fitness, bukan nilai absolutnya. Mengurangi dominasi individu dengan fitness sangat tinggi.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    <CogIcon className="mr-2 h-4 w-4" />
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
