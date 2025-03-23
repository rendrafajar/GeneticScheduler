import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScheduleItem } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function RecentSchedule() {
  const [filter, setFilter] = useState("today");
  const [selectedClass, setSelectedClass] = useState("all");

  // Fetch schedules from the latest generation
  const { data: scheduleGenerations } = useQuery({
    queryKey: ["/api/schedule-generations"],
    enabled: false // Disabled for now, will be enabled when we have the schedules API
  });

  // Mock data for development - in production this would be fetched from the API
  const scheduleItems: ScheduleItem[] = [
    { id: 1, jam: "07:00 - 08:30", kelas: "X RPL 1", mataPelajaran: "Pemrograman Dasar", guru: "Budi Santoso, S.Kom", ruangan: "Lab Komputer 1" },
    { id: 2, jam: "08:30 - 10:00", kelas: "XI MM 2", mataPelajaran: "Desain Grafis", guru: "Dewi Anggraini, S.Ds", ruangan: "Lab Multimedia" },
    { id: 3, jam: "10:15 - 11:45", kelas: "XII TKJ 1", mataPelajaran: "Administrasi Server", guru: "Hendro Wicaksono, S.T", ruangan: "Lab Jaringan" },
    { id: 4, jam: "12:30 - 14:00", kelas: "X AKL 1", mataPelajaran: "Akuntansi Dasar", guru: "Sri Wahyuni, S.E", ruangan: "Ruang Teori 5" },
    { id: 5, jam: "14:00 - 15:30", kelas: "XI RPL 2", mataPelajaran: "Basis Data", guru: "Agus Priyanto, M.Kom", ruangan: "Lab Komputer 2" },
  ];

  // Filter items based on selected class
  const filteredItems = selectedClass === "all" 
    ? scheduleItems 
    : scheduleItems.filter(item => item.kelas === selectedClass);

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 col-span-1 lg:col-span-2">
      <div className="border-b border-slate-200 p-4 flex justify-between items-center">
        <h3 className="font-semibold">Jadwal Terbaru</h3>
        <div className="space-x-2">
          <span className="text-sm text-slate-500">Diperbarui: 24 Mei 2023</span>
          <Link href="/lihat-jadwal">
            <a className="text-sm text-primary-600 hover:text-primary-800">Lihat Semua</a>
          </Link>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-1">
            <Button 
              variant={filter === "today" ? "default" : "ghost"} 
              className={filter !== "today" ? "text-slate-600" : ""} 
              size="sm" 
              onClick={() => setFilter("today")}
            >
              Hari Ini
            </Button>
            <Button 
              variant={filter === "week" ? "default" : "ghost"} 
              className={filter !== "week" ? "text-slate-600" : ""} 
              size="sm" 
              onClick={() => setFilter("week")}
            >
              Minggu Ini
            </Button>
          </div>
          <div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="text-sm w-[180px] h-8">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                <SelectItem value="X RPL 1">X RPL 1</SelectItem>
                <SelectItem value="X RPL 2">X RPL 2</SelectItem>
                <SelectItem value="X MM 1">X MM 1</SelectItem>
                <SelectItem value="X MM 2">X MM 2</SelectItem>
                <SelectItem value="XI RPL 2">XI RPL 2</SelectItem>
                <SelectItem value="XI MM 2">XI MM 2</SelectItem>
                <SelectItem value="XII TKJ 1">XII TKJ 1</SelectItem>
                <SelectItem value="X AKL 1">X AKL 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="py-2 px-3 text-left font-medium text-slate-600">Jam</TableHead>
                <TableHead className="py-2 px-3 text-left font-medium text-slate-600">Kelas</TableHead>
                <TableHead className="py-2 px-3 text-left font-medium text-slate-600">Mata Pelajaran</TableHead>
                <TableHead className="py-2 px-3 text-left font-medium text-slate-600">Guru</TableHead>
                <TableHead className="py-2 px-3 text-left font-medium text-slate-600">Ruangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <TableCell className="py-2 px-3">{item.jam}</TableCell>
                  <TableCell className="py-2 px-3 font-medium">{item.kelas}</TableCell>
                  <TableCell className="py-2 px-3">{item.mataPelajaran}</TableCell>
                  <TableCell className="py-2 px-3">{item.guru}</TableCell>
                  <TableCell className="py-2 px-3">{item.ruangan}</TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    Tidak ada jadwal yang tersedia
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
