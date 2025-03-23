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
const timeSlotSchema = z.object({
  day: z.string().min(1, "Hari wajib diisi"),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format waktu tidak valid (HH:MM)"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format waktu tidak valid (HH:MM)"),
}).refine(data => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  
  // Convert to minutes for easier comparison
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes > startMinutes;
}, {
  message: "Waktu akhir harus setelah waktu mulai",
  path: ["endTime"]
});

type TimeSlotFormData = z.infer<typeof timeSlotSchema>;

export default function SlotWaktuPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterDay, setFilterDay] = useState("all");
  
  // Form setup
  const form = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      day: "Senin",
      startTime: "07:00",
      endTime: "08:30",
    },
  });

  // Fetch time slots
  const { data: timeSlots, isLoading } = useQuery({
    queryKey: ["/api/timeslots"],
  });

  // Create time slot mutation
  const createMutation = useMutation({
    mutationFn: async (data: TimeSlotFormData) => {
      const res = await apiRequest("POST", "/api/timeslots", data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeslots"] });
      toast({
        title: "Berhasil",
        description: "Slot waktu berhasil ditambahkan",
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

  // Update time slot mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: TimeSlotFormData }) => {
      const res = await apiRequest("PUT", `/api/timeslots/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/timeslots"] });
      toast({
        title: "Berhasil",
        description: "Slot waktu berhasil diperbarui",
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

  // Delete time slot mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/timeslots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeslots"] });
      toast({
        title: "Berhasil",
        description: "Slot waktu berhasil dihapus",
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
      day: "Senin",
      startTime: "07:00",
      endTime: "08:30",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (timeSlot: any) => {
    setEditingId(timeSlot.id);
    form.reset({
      day: timeSlot.day,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus slot waktu ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: TimeSlotFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  // Filter time slots by day
  const filteredTimeSlots = timeSlots 
    ? timeSlots.filter((timeSlot: any) => {
        return filterDay === "all" || timeSlot.day === filterDay;
      })
    : [];

  // Sort time slots by day and then by start time
  const sortedTimeSlots = [...(filteredTimeSlots || [])].sort((a, b) => {
    const dayOrder = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
    if (dayOrder !== 0) return dayOrder;
    
    // If same day, sort by start time
    const aStart = a.startTime.split(':').map(Number);
    const bStart = b.startTime.split(':').map(Number);
    
    // Convert to minutes for easier comparison
    const aStartMinutes = aStart[0] * 60 + aStart[1];
    const bStartMinutes = bStart[0] * 60 + bStart[1];
    
    return aStartMinutes - bStartMinutes;
  });

  // Format time to 24-hour format
  const formatTime = (time: string) => {
    return time;
  };

  return (
    <Layout title="Slot Waktu">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Slot Waktu</CardTitle>
            <CardDescription>
              Kelola slot waktu untuk penjadwalan
            </CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Tambah Slot Waktu
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex">
            <Select 
              value={filterDay}
              onValueChange={setFilterDay}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Hari" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Hari</SelectItem>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Waktu Mulai</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedTimeSlots.length > 0 ? (
                sortedTimeSlots.map((timeSlot: any) => {
                  // Calculate duration in minutes
                  const start = timeSlot.startTime.split(':').map(Number);
                  const end = timeSlot.endTime.split(':').map(Number);
                  const startMinutes = start[0] * 60 + start[1];
                  const endMinutes = end[0] * 60 + end[1];
                  const durationMinutes = endMinutes - startMinutes;
                  
                  // Format duration as hours and minutes
                  const hours = Math.floor(durationMinutes / 60);
                  const minutes = durationMinutes % 60;
                  const durationFormatted = 
                    (hours > 0 ? `${hours} jam ` : "") + 
                    (minutes > 0 ? `${minutes} menit` : "");
                  
                  return (
                    <TableRow key={timeSlot.id}>
                      <TableCell className="font-medium">{timeSlot.day}</TableCell>
                      <TableCell>{formatTime(timeSlot.startTime)}</TableCell>
                      <TableCell>{formatTime(timeSlot.endTime)}</TableCell>
                      <TableCell>{durationFormatted}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(timeSlot)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(timeSlot.id)}>
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
                  <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                    {filterDay !== "all" 
                      ? `Tidak ada slot waktu untuk hari ${filterDay}`
                      : "Belum ada data slot waktu. Klik tombol \"Tambah Slot Waktu\" untuk menambahkan."}
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
            <DialogTitle>{editingId ? "Edit Slot Waktu" : "Tambah Slot Waktu Baru"}</DialogTitle>
            <DialogDescription>
              {editingId 
                ? "Perbarui informasi slot waktu yang sudah ada" 
                : "Tambahkan slot waktu baru ke dalam sistem"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hari</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih hari" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Mulai</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Selesai</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
