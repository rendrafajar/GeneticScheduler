export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  iconBgColor: string;
  iconColor: string;
}

export interface ScheduleItem {
  id: number;
  jam: string;
  kelas: string;
  mataPelajaran: string;
  guru: string;
  ruangan: string;
}

export interface GeneticAlgorithmSettings {
  populationSize: number;
  maxGenerations: number;
  crossoverRate: number;
  mutationRate: number;
  selectionMethod: string;
}

export interface GenerationStats {
  totalGenerasi: number;
  nilaiFitness: number;
  bentrokJadwal: number;
  durasiProses: string;
  kualitasJadwal: number;
  catatan: string;
}

export interface ScheduleGeneration {
  id: number;
  name: string;
  academicYear: string;
  semester: string;
  populationSize: number;
  maxGenerations: number;
  crossoverRate: string;
  mutationRate: string;
  selectionMethod: string;
  fitnessValue: string | null;
  executionTime: number | null;
  conflictCount: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
}
