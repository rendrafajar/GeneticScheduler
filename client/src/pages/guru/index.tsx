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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, Pencil, Trash2, Filter } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const teacherSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama guru wajib diisi"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  maxHoursPerWeek: z.coerce.number().min(1, "Jam mengajar minimum 1").max(40, "Jam mengajar maksimum 40"),
  unavailableDays: z.array(z.string()).optional(),
  unavailableTimeSlots: z.array(z.string()).optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimeSlots: z.array(z.string()).optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

export default function GuruPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form setup
  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      nip: "",
      name: "",
      email: "",
      phone: "",
      specialization: "",
      maxHoursPerWeek: 24,
      unavailableDays: [],
      unavailableTimeSlots: [],
      preferredDays: [],
      preferredTimeSlots: [],
    },
  });

  // Fetch teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ["/api/teachers"],
  });

  // Fetch time slots for availability settings
  const { data: timeSlots } = useQuery({
    queryKey: ["/api/timeslots"],
  });

  // Create teacher mutation
  const createMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      const res = await apiRequest("POST", "/api/teachers", data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Berhasil",
        description: "Data guru berhasil ditambahkan",
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

  // Update teacher mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: TeacherFormData }) => {
      const res = await apiRequest("PUT", `/api/teachers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Berhasil",
        description: "Data guru berhasil diperbarui",
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

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Berhasil",
        description: "Data guru berhasil dihapus",
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

  const openAddDialog = () => {
    setEditingId(null);
    form.reset({
      nip: "",
      name: "",
      email: "",
      phone: "",
      specialization: "",
      maxHoursPerWeek: 24,
      unavailableDays: [],
      unavailableTimeSlots: [],
      preferredDays: [],
      preferredTimeSlots: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (teacher: any) => {
    setEditingId(teacher.id);
    form.reset({
      nip: teacher.nip,
      name: teacher.name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      specialization: teacher.specialization || "",
      maxHoursPerWeek: teacher.maxHoursPerWeek,
      unavailableDays: teacher.unavailableDays || [],
      unavailableTimeSlots: teacher.unavailableTimeSlots || [],
      preferredDays: teacher.preferredDays || [],
      preferredTimeSlots: teacher.preferredTimeSlots || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data guru ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: TeacherFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  // Filter teachers by search query
  const filteredTeachers = teachers 
    ? teachers.filter((teacher: any) => 
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        teacher.nip.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <Layout title="Guru">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Guru</CardTitle>
            <CardDescription>
              Kelola data guru dan ketersediaan waktu mengajar
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Guru
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex">
            <div className="relative w-full max-w-sm">
              <Input 
                placeholder="Cari berdasarkan nama atau NIP..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIP</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Spesialisasi</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Maksimum Jam</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher: any) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.nip}</TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.specialization || "-"}</TableCell>
                    <TableCell>{teacher.email || "-"}</TableCell>
                    <TableCell>{teacher.maxHoursPerWeek} jam</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(teacher)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(teacher.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    {searchQuery 
                      ? "Tidak ada guru yang cocok dengan pencarian" 
                      : "Belum ada data guru. Klik tombol \"Tambah Guru\" untuk menambahkan."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Data Guru" : "Tambah Guru Baru"}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? "Perbarui informasi guru yang sudah ada" 
                : "Tambahkan data guru baru ke dalam sistem"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="availability">Ketersediaan</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIP</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan NIP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan nama lengkap" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input placeholder="Nomor telepon" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spesialisasi</FormLabel>
                          <FormControl>
                            <Input placeholder="Bidang keahlian" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxHoursPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maksimum Jam Mengajar per Minggu</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="availability" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Hari Tidak Tersedia</h3>
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="unavailableDays"
                          render={({ field }) => (
                            <FormItem>
                              {daysOfWeek.map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`unavailable-${day}`}
                                    checked={field.value?.includes(day)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), day]
                                        : (field.value || []).filter((d) => d !== day);
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                  <Label htmlFor={`unavailable-${day}`}>{day}</Label>
                                </div>
                              ))}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Hari Diutamakan</h3>
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="preferredDays"
                          render={({ field }) => (
                            <FormItem>
                              {daysOfWeek.map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`preferred-${day}`}
                                    checked={field.value?.includes(day)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), day]
                                        : (field.value || []).filter((d) => d !== day);
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                  <Label htmlFor={`preferred-${day}`}>{day}</Label>
                                </div>
                              ))}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {editingId ? "Perbarui" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
