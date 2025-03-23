import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Settings2Icon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CogIcon } from "lucide-react";

interface GenerateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateScheduleModal({ isOpen, onClose }: GenerateScheduleModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "Jadwal Semester Ganjil 2023/2024",
    academicYear: "2023/2024",
    semester: "ganjil",
    priority: "balanced",
    populationSize: 200,
    maxGenerations: 150,
    crossoverRate: "0.85",
    mutationRate: "0.15",
    selectionMethod: "tournament"
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/schedule-generations", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Proses generate jadwal telah dimulai dan akan berjalan di background.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-generations"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    const data = {
      ...formData,
      createdBy: user?.id
    };
    generateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Generate Jadwal Baru</DialogTitle>
          <DialogDescription>
            Anda akan membuat jadwal baru untuk semester ini. Pastikan semua data guru, kelas, ruangan dan mata pelajaran sudah 
            diperbarui sebelum memulai proses generate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="academic-year">Tahun Ajaran</Label>
            <Select 
              value={formData.academicYear} 
              onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
            >
              <SelectTrigger id="academic-year">
                <SelectValue placeholder="Pilih tahun ajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023/2024">2023/2024</SelectItem>
                <SelectItem value="2022/2023">2022/2023</SelectItem>
                <SelectItem value="2021/2022">2021/2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Semester</Label>
            <RadioGroup
              value={formData.semester}
              onValueChange={(value) => setFormData({ ...formData, semester: value })}
              className="flex space-x-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ganjil" id="ganjil" />
                <Label htmlFor="ganjil" className="cursor-pointer">Ganjil</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="genap" id="genap" />
                <Label htmlFor="genap" className="cursor-pointer">Genap</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div>
            <Label htmlFor="priority">Prioritas Optimasi</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Pilih prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Preferensi Guru</SelectItem>
                <SelectItem value="room">Efisiensi Ruangan</SelectItem>
                <SelectItem value="distribution">Distribusi Mata Pelajaran</SelectItem>
                <SelectItem value="balanced">Seimbang (Default)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-blue-50 p-3 rounded text-blue-700 text-sm">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>
                Dengan pengaturan saat ini, proses generate akan membutuhkan waktu sekitar 3-5 menit.
              </span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <CogIcon className="mr-2 h-4 w-4" />
                Mulai Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
