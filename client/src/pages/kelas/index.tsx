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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusIcon, Pencil, Trash2, Filter } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const classSchema = z.object({
  name: z.string().min(3, "Nama kelas wajib diisi"),
  grade: z.coerce.number().min(10, "Kelas minimal 10").max(12, "Kelas maksimal 12"),
  department: z.string().min(1, "Jurusan wajib diisi"),
  academicYear: z.string().min(1, "Tahun ajaran wajib diisi"),
  capacity: z.coerce.number().min(1, "Kapasitas minimal 1"),
  curriculumId: z.coerce.number().min(1, "Kurikulum wajib dipilih"),
});

type ClassFormData = z.infer<typeof classSchema>;

export default function KelasPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  
  // Form setup
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      grade: 10,
      department: "",
      academicYear: "",
      capacity: 30,
      curriculumId: 0,
    },
  });

  // Fetch classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  // Fetch curricula for the select input
  const { data: curricula } = useQuery({
    queryKey: ["/api/curricula"],
  });

  // Create class mutation
  const createMutation = useMutation({
    mutationFn: async (data: ClassFormData) => {
      const res = await apiRequest("POST", "/api/classes", data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Berhasil",
        description: "Kelas berhasil ditambahkan",
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

  // Update class mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ClassFormData }) => {
      const res = await apiRequest("PUT", `/api/classes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Berhasil",
        description: "Kelas berhasil diperbarui",
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

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Berhasil",
        description: "Kelas berhasil dihapus",
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
      grade: 10,
      department: "",
      academicYear: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      capacity: 30,
      curriculumId: curricula && curricula.length > 0 ? curricula[0].id : 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cls: any) => {
    setEditingId(cls.id);
    form.reset({
      name: cls.name,
      grade: cls.grade,
      department: cls.department,
      academicYear: cls.academicYear,
      capacity: cls.capacity,
      curriculumId: cls.curriculumId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus kelas ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ClassFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Extract unique departments and grades from classes for filters
  const departments = classes 
    ? Array.from(new Set(classes.map((cls: any) => cls.department)))
    : [];
  
  const grades = classes 
    ? Array.from(new Set(classes.map((cls: any) => cls.grade)))
    : [];

  // Filter classes by search query, department, and grade
  const filteredClasses = classes 
    ? classes.filter((cls: any) => {
        const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDepartment = filterDepartment === "all" || cls.department === filterDepartment;
        const matchesGrade = filterGrade === "all" || cls.grade === parseInt(filterGrade);
        return matchesSearch && matchesDepartment && matchesGrade;
      })
    : [];

  return (
    <Layout title="Kelas">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Kelas</CardTitle>
            <CardDescription>
              Kelola data kelas dan penetapan ke kurikulum
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Kelas
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="relative md:w-1/2">
              <Input 
                placeholder="Cari berdasarkan nama kelas..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
            <div className="flex gap-2">
              <Select 
                value={filterDepartment}
                onValueChange={setFilterDepartment}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jurusan</SelectItem>
                  {departments.map((dept: string) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filterGrade}
                onValueChange={setFilterGrade}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  {grades.map((grade: number) => (
                    <SelectItem key={grade} value={grade.toString()}>Kelas {grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Kurikulum</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((cls: any) => {
                  const curriculum = curricula?.find((c: any) => c.id === cls.curriculumId);
                  return (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>Kelas {cls.grade}</TableCell>
                      <TableCell>{cls.department}</TableCell>
                      <TableCell>{cls.academicYear}</TableCell>
                      <TableCell>{cls.capacity} siswa</TableCell>
                      <TableCell>{curriculum?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(cls)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(cls.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                    {searchQuery || filterDepartment !== "all" || filterGrade !== "all" 
                      ? "Tidak ada kelas yang cocok dengan filter" 
                      : "Belum ada data kelas. Klik tombol \"Tambah Kelas\" untuk menambahkan."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Kelas" : "Tambah Kelas Baru"}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? "Perbarui informasi kelas yang sudah ada" 
                : "Tambahkan kelas baru ke dalam sistem"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kelas</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: X RPL 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tingkat Kelas</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tingkat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="10">Kelas 10</SelectItem>
                          <SelectItem value="11">Kelas 11</SelectItem>
                          <SelectItem value="12">Kelas 12</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurusan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: RPL, TKJ, MM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kapasitas</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        {curricula?.map((curriculum: any) => (
                          <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                            {curriculum.name} ({curriculum.academicYear})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
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
