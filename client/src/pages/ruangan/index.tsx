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
import { Badge } from "@/components/ui/badge";
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
const roomSchema = z.object({
  name: z.string().min(3, "Nama ruangan wajib diisi"),
  code: z.string().min(1, "Kode ruangan wajib diisi"),
  type: z.enum(["teori", "praktikum"]),
  capacity: z.coerce.number().min(1, "Kapasitas minimal 1"),
  allowedDepartments: z.array(z.string()).optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function RuanganPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Form setup
  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "teori",
      capacity: 30,
      allowedDepartments: [],
    },
  });

  // Fetch rooms
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      const res = await apiRequest("POST", "/api/rooms", data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Berhasil",
        description: "Ruangan berhasil ditambahkan",
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

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: RoomFormData }) => {
      const res = await apiRequest("PUT", `/api/rooms/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Berhasil",
        description: "Ruangan berhasil diperbarui",
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

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Berhasil",
        description: "Ruangan berhasil dihapus",
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

  // Fetch classes to get available departments
  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
  });
  
  // Extract unique departments from classes
  const departments = classes 
    ? Array.from(new Set(classes.map((cls: any) => cls.department)))
    : [];

  const openAddDialog = () => {
    setEditingId(null);
    form.reset({
      name: "",
      code: "",
      type: "teori",
      capacity: 30,
      allowedDepartments: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (room: any) => {
    setEditingId(room.id);
    form.reset({
      name: room.name,
      code: room.code,
      type: room.type,
      capacity: room.capacity,
      allowedDepartments: room.allowedDepartments || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus ruangan ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: RoomFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Filter rooms by search query and type
  const filteredRooms = rooms 
    ? rooms.filter((room: any) => {
        const matchesSearch = 
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          room.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || room.type === filterType;
        return matchesSearch && matchesType;
      })
    : [];

  return (
    <Layout title="Ruangan">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Ruangan</CardTitle>
            <CardDescription>
              Kelola data ruangan teori dan praktikum
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Ruangan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="relative md:w-1/2">
              <Input 
                placeholder="Cari berdasarkan nama atau kode..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
            <div className="flex gap-2">
              <Select 
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipe Ruangan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="teori">Ruang Teori</SelectItem>
                  <SelectItem value="praktikum">Ruang Praktikum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Ruangan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Jurusan yang Diizinkan</TableHead>
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
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map((room: any) => (
                  <TableRow key={room.id}>
                    <TableCell>{room.code}</TableCell>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <Badge variant={room.type === "teori" ? "outline" : "secondary"}>
                        {room.type === "teori" ? "Teori" : "Praktikum"}
                      </Badge>
                    </TableCell>
                    <TableCell>{room.capacity} orang</TableCell>
                    <TableCell>
                      {room.allowedDepartments && room.allowedDepartments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {room.allowedDepartments.map((dept: string, idx: number) => (
                            <Badge key={idx} variant="outline">{dept}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">Semua Jurusan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(room)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)}>
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
                    {searchQuery || filterType !== "all" 
                      ? "Tidak ada ruangan yang cocok dengan filter" 
                      : "Belum ada data ruangan. Klik tombol \"Tambah Ruangan\" untuk menambahkan."}
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
            <DialogTitle>{editingId ? "Edit Ruangan" : "Tambah Ruangan Baru"}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? "Perbarui informasi ruangan yang sudah ada" 
                : "Tambahkan ruangan baru ke dalam sistem"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Ruangan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Lab Komputer 1" {...field} />
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
                      <FormLabel>Kode Ruangan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: LAB-KOM-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Ruangan</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe ruangan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="teori">Ruang Teori</SelectItem>
                          <SelectItem value="praktikum">Ruang Praktikum</SelectItem>
                        </SelectContent>
                      </Select>
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
                name="allowedDepartments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurusan yang Diizinkan</FormLabel>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">
                        Kosongkan untuk mengizinkan semua jurusan menggunakan ruangan ini
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {departments.map((dept: string) => (
                          <div key={dept} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`dept-${dept}`} 
                              checked={field.value?.includes(dept)}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...(field.value || []), dept]
                                  : (field.value || []).filter((d) => d !== dept);
                                field.onChange(updatedValue);
                              }}
                            />
                            <Label htmlFor={`dept-${dept}`}>{dept}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
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
