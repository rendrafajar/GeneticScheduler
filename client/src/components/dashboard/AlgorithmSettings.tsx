import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GeneticAlgorithmSettings } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AlgorithmSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<GeneticAlgorithmSettings>({
    populationSize: 200,
    maxGenerations: 150,
    crossoverRate: 0.85,
    mutationRate: 0.15,
    selectionMethod: "tournament",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GeneticAlgorithmSettings) => {
      // This would typically be an API call to save the settings
      // For now we just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Pengaturan berhasil disimpan",
        description: "Pengaturan algoritma genetika telah diperbarui",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan pengaturan",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-slate-200">
        <CardTitle className="text-base font-semibold">Pengaturan Algoritma Genetika</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Ukuran Populasi
          </Label>
          <div className="flex items-center">
            <Slider
              value={[settings.populationSize]}
              min={50}
              max={500}
              step={10}
              onValueChange={(value) => setSettings({ ...settings, populationSize: value[0] })}
              className="w-full"
            />
            <span className="ml-2 text-sm font-medium min-w-[40px] text-center">
              {settings.populationSize}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Jumlah Generasi Maksimum
          </Label>
          <div className="flex items-center">
            <Slider
              value={[settings.maxGenerations]}
              min={50}
              max={1000}
              step={10}
              onValueChange={(value) => setSettings({ ...settings, maxGenerations: value[0] })}
              className="w-full"
            />
            <span className="ml-2 text-sm font-medium min-w-[40px] text-center">
              {settings.maxGenerations}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Probabilitas Crossover
          </Label>
          <div className="flex items-center">
            <Slider
              value={[settings.crossoverRate * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setSettings({ ...settings, crossoverRate: value[0] / 100 })}
              className="w-full"
            />
            <span className="ml-2 text-sm font-medium min-w-[40px] text-center">
              {settings.crossoverRate.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Probabilitas Mutasi
          </Label>
          <div className="flex items-center">
            <Slider
              value={[settings.mutationRate * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setSettings({ ...settings, mutationRate: value[0] / 100 })}
              className="w-full"
            />
            <span className="ml-2 text-sm font-medium min-w-[40px] text-center">
              {settings.mutationRate.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Metode Seleksi
          </Label>
          <Select 
            value={settings.selectionMethod}
            onValueChange={(value) => setSettings({ ...settings, selectionMethod: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih metode seleksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tournament">Tournament Selection</SelectItem>
              <SelectItem value="roulette">Roulette Wheel</SelectItem>
              <SelectItem value="rank">Rank Selection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
