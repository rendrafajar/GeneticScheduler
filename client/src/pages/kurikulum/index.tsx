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
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const curriculumSchema = z.object({
  name: z.string().min(3, "Nama kurikulum minimal 3 karakter"),
  academicYear: z.string().min(3, "Tahun ajaran wajib diisi"),
  description: z.string().optional(),
});

type CurriculumFormData = z.infer<typeof curriculumSchema>;

export default function KurikulumPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form setup
  const form = useForm<CurriculumFormData>({
    resolver: zodResolver(curriculumSchema),
    defaultValues: {
      name: "",
      academicYear: "",
      description: "",
    },
  });

  // Fetch curricula
  const { data: curricula, isLoading } = useQuery({
    queryKey: ["/api/curricula"],
  });

  // Create curriculum mutation
  const createMutation = useMutation({
    mutationFn: async (data: CurriculumFormData) => {
      const res = await apiRequest("POST", "/api/curricula", data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/curricula"] });
      toast({
        title: "Berhasil",
        description: "Kurikulum berhasil ditambahkan",
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

  // Update curriculum mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CurriculumFormData }) => {
      const res = await apiRequest("PUT", `/api/curricula/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/curricula"] });
      toast({
        title: "Berhasil",
        description: "Kurikulum berhasil diperbarui",
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

  // Delete curriculum mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/curricula/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curricula"] });
      toast({
        title: "Berhasil",
        description: "Kurikulum berhasil dihapus",
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
      academicYear: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (curriculum: any) => {
    setEditingId(curriculum.id);
    form.reset({
      name: curriculum.name,
      academicYear: curriculum.academicYear,
      description: curriculum.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus kurikulum ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: CurriculumFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Layout title="Kurikulum">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Kurikulum</CardTitle>
            <CardDescription>
              Kelola kurikulum dan mata pelajaran untuk setiap jenjang
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Kurikulum
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kurikulum</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </TableCell>
                </TableRow>
              ) : curricula && curricula.length > 0 ? (
                curricula.map((curriculum: any) => (
                  <TableRow key={curriculum.id}>
                    <TableCell className="font-medium">{curriculum.name}</TableCell>
                    <TableCell>{curriculum.academicYear}</TableCell>
                    <TableCell className="max-w-md truncate">{curriculum.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(curriculum)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(curriculum.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                    Belum ada data kurikulum. Klik tombol "Tambah Kurikulum" untuk menambahkan.
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
            <DialogTitle>{editingId ? "Edit Kurikulum" : "Tambah Kurikulum Baru"}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? "Perbarui informasi kurikulum yang sudah ada" 
                : "Tambahkan kurikulum baru ke dalam sistem"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kurikulum</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Kurikulum Merdeka 2022" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Deskripsi singkat tentang kurikulum" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
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
