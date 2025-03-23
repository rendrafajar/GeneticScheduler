import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { GenerationStats } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function GenerationResult() {
  // Fetch the latest generation result
  const { data: generations } = useQuery({
    queryKey: ["/api/schedule-generations"],
    enabled: false // Will be enabled when we have the API
  });

  // Mock data - in production this would come from the API
  const stats: GenerationStats = {
    totalGenerasi: 120,
    nilaiFitness: 0.96,
    bentrokJadwal: 0,
    durasiProses: "4m 12s",
    kualitasJadwal: 96,
    catatan: "Jadwal telah berhasil digenerate dengan memenuhi 48 dari 50 preferensi. Terdapat 2 preferensi guru yang tidak dapat dipenuhi karena keterbatasan slot waktu."
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">Hasil Generate Terakhir</CardTitle>
          <span className="text-sm text-slate-500">24 Mei 2023, 14:32</span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Total Generasi</div>
            <div className="text-lg font-semibold">{stats.totalGenerasi}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Nilai Fitness</div>
            <div className="text-lg font-semibold">{stats.nilaiFitness}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Bentrok Jadwal</div>
            <div className="text-lg font-semibold text-green-600">{stats.bentrokJadwal}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Durasi Proses</div>
            <div className="text-lg font-semibold">{stats.durasiProses}</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Kualitas Jadwal</span>
            <span>{stats.kualitasJadwal}%</span>
          </div>
          <Progress value={stats.kualitasJadwal} className="h-2" />
        </div>
        
        <div className="text-sm text-slate-600 mb-4">
          {stats.catatan}
        </div>
        
        <div className="flex justify-end">
          <Link href="/laporan">
            <a className="text-primary-600 hover:text-primary-800 text-sm font-medium">
              Lihat Detail Laporan
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
