import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import KurikulumPage from "@/pages/kurikulum";
import GuruPage from "@/pages/guru";
import KelasPage from "@/pages/kelas";
import RuanganPage from "@/pages/ruangan";
import SlotWaktuPage from "@/pages/slot-waktu";
import GenerateJadwalPage from "@/pages/generate-jadwal";
import LihatJadwalPage from "@/pages/lihat-jadwal";
import LaporanPage from "@/pages/laporan";
import PengaturanPage from "@/pages/pengaturan";
import PenggunaPage from "@/pages/pengguna";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/kurikulum" component={KurikulumPage} />
      <ProtectedRoute path="/guru" component={GuruPage} />
      <ProtectedRoute path="/kelas" component={KelasPage} />
      <ProtectedRoute path="/ruangan" component={RuanganPage} />
      <ProtectedRoute path="/slot-waktu" component={SlotWaktuPage} />
      <ProtectedRoute path="/generate-jadwal" component={GenerateJadwalPage} />
      <ProtectedRoute path="/lihat-jadwal" component={LihatJadwalPage} />
      <ProtectedRoute path="/laporan" component={LaporanPage} />
      <ProtectedRoute path="/pengaturan" component={PengaturanPage} roles={["admin"]} />
      <ProtectedRoute path="/pengguna" component={PenggunaPage} roles={["admin"]} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
