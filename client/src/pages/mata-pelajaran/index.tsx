import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, Pencil, Trash2, Filter, BookOpen } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const subjectSchema = z.object({
  name: z.string().min(1, "Nama mata pelajaran wajib diisi"),
  code: z.string().min(1, "Kode mata pelajaran wajib diisi"),
  curriculumId: z.coerce.number().min(1, "Kurikulum wajib dipilih"),
  hoursPerWeek: z.coerce.number().min(1, "Jam per minggu minimum 1"),
  requiresPractical: z.boolean().default(false),
  description: z.string().optional(),
  preferredTimeSlots: z.array(z.string()).optional(),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

export default function MataPelajaranPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCurriculum, setFilterCurriculum] = useState<number | "all">("all");
  
  // Form setup
  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      curriculumId: 0,
      hoursPerWeek: 2,
      requiresPractical: false,
      description: "",
      preferredTimeSlots: [],
    },
  });

  // Fetch subjects
  const { data: subjects, isLoading } = useQuery({
    queryKey: ["/api/subjects"],
    staleTime: 1000, // Reduce stale time to refresh data more often
  });

  // Fetch curricula for dropdown
  const { data: curricula } = useQuery({
    queryKey: ["/api/curricula"],
  });

  // Fetch time slots for availability selection
  const { data: timeSlots } = useQuery({
    queryKey: ["/api/timeslots"],
  });

  // Create subject mutation
  const createMutation = useMutation({
    mutationFn: async (data: SubjectFormData) => {
      const res = await apiRequest("POST", "/api/subjects", data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Berhasil",
        description: "Mata pelajaran berhasil ditambahkan",
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

  // Update subject mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SubjectFormData }) => {
      const res = await apiRequest("PUT", `/api/subjects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Berhasil",
        description: "Mata pelajaran berhasil diperbarui",
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

  // Delete subject mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Berhasil",
        description: "Mata pelajaran berhasil dihapus",
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
      name: "",
      code: "",
      curriculumId: curricula && curricula.length > 0 ? curricula[0].id : 0,
      hoursPerWeek: 2,
      requiresPractical: false,
      description: "",
      preferredTimeSlots: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (subject: any) => {
    setEditingId(subject.id);
    form.reset({
      name: subject.name,
      code: subject.code,
      curriculumId: subject.curriculumId,
      hoursPerWeek: subject.hoursPerWeek,
      requiresPractical: subject.requiresPractical,
      description: subject.description || "",
      preferredTimeSlots: subject.preferredTimeSlots || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus mata pelajaran ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: SubjectFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter and sort subjects
  const filteredSubjects = subjects 
    ? subjects
        .filter((subject: any) => {
          const matchesSearch = 
            subject.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            subject.code.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesCurriculum = 
            filterCurriculum === "all" || 
            subject.curriculumId === filterCurriculum;
          
          return matchesSearch && matchesCurriculum;
        })
        .sort((a: any, b: any) => {
          // Urutkan berdasarkan kurikulum dulu, kemudian nama
          if (a.curriculumId !== b.curriculumId) {
            return a.curriculumId - b.curriculumId;
          }
          return a.name.localeCompare(b.name);
        })
    : [];

  // Get curriculum name by id
  const getCurriculumName = (id: number) => {
    if (!curricula) return "-";
    const curriculum = curricula.find((c: any) => c.id === id);
    return curriculum ? curriculum.name : "-";
  };

  return (
    <Layout title="Mata Pelajaran">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Mata Pelajaran</CardTitle>
            <CardDescription>
              Kelola mata pelajaran beserta jam pelajaran per jenjang
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Mata Pelajaran
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <div className="relative w-full max-w-sm">
              <Input 
                placeholder="Cari berdasarkan nama atau kode..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
            
            <Select
              value={filterCurriculum.toString()}
              onValueChange={(value) => setFilterCurriculum(value === "all" ? "all" : parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filter Kurikulum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kurikulum</SelectItem>
                {curricula && curricula.map((curriculum: any) => (
                  <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                    {curriculum.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Mata Pelajaran</TableHead>
                <TableHead>Kurikulum</TableHead>
                <TableHead>Jam/Minggu</TableHead>
                <TableHead>Jenis</TableHead>
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
              ) : filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject: any) => (
                  <TableRow key={subject.id}>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{getCurriculumName(subject.curriculumId)}</TableCell>
                    <TableCell>{subject.hoursPerWeek}</TableCell>
                    <TableCell>
                      {subject.requiresPractical ? (
                        <Badge variant="secondary">Praktikum</Badge>
                      ) : (
                        <Badge variant="outline">Teori</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(subject)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
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
                    {searchQuery || filterCurriculum !== "all"
                      ? "Tidak ada mata pelajaran yang cocok dengan filter" 
                      : "Belum ada data mata pelajaran. Klik tombol \"Tambah Mata Pelajaran\" untuk menambahkan."}
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
            <DialogTitle>{editingId ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? "Perbarui informasi mata pelajaran yang sudah ada" 
                : "Tambahkan mata pelajaran baru ke dalam sistem"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                  <TabsTrigger value="additional">Informasi Tambahan</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Mata Pelajaran</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: Matematika" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kode Mata Pelajaran</FormLabel>
                          <FormControl>
                            <Input placeholder="Contoh: MTK" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="curriculumId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kurikulum</FormLabel>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kurikulum" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {curricula && curricula.map((curriculum: any) => (
                                <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                                  {curriculum.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hoursPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jam Per Minggu</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="40" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="requiresPractical"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Memerlukan Praktikum</FormLabel>
                          <p className="text-sm text-slate-500">
                            Centang jika mata pelajaran ini memerlukan sesi praktikum di laboratorium atau ruang khusus.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="additional" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Deskripsi singkat tentang mata pelajaran" 
                            className="resize-none min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <h3 className="text-sm font-medium mb-3">Slot Waktu yang Direkomendasikan</h3>
                    <FormField
                      control={form.control}
                      name="preferredTimeSlots"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-2 gap-2">
                            {timeSlots && timeSlots.map((slot: any) => (
                              <div key={slot.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`preferred-${slot.id}`}
                                  checked={field.value?.includes(slot.id.toString())}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), slot.id.toString()]
                                      : (field.value || []).filter((id) => id !== slot.id.toString());
                                    field.onChange(updatedValue);
                                  }}
                                />
                                <Label htmlFor={`preferred-${slot.id}`} className="text-sm">
                                  {slot.day}, {slot.startTime}-{slot.endTime}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      {editingId ? "Perbarui" : "Simpan"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}