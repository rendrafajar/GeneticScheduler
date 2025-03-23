import { useState, useRef, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Settings2Icon, 
  SaveIcon, 
  UploadIcon, 
  RotateCcwIcon, 
  UserIcon, 
  ImageIcon 
} from "lucide-react";

// Form schema untuk pengaturan aplikasi
const appSettingsSchema = z.object({
  appName: z.string().min(1, "Nama aplikasi wajib diisi"),
  footerText: z.string().min(1, "Teks footer wajib diisi"),
  appLogo: z.string().optional(),
});

type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

// Form schema untuk pengaturan pengguna
const userSettingsSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok dengan password baru",
  path: ["confirmPassword"]
});

type UserSettingsFormData = z.infer<typeof userSettingsSchema>;

export default function PengaturanPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState("app");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch pengaturan aplikasi
  const { data: appSettings, isLoading } = useQuery({
    queryKey: ["/api/app-settings"],
  });
  
  // Form untuk pengaturan aplikasi
  const appSettingsForm = useForm<AppSettingsFormData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      appName: "",
      footerText: "",
      appLogo: "",
    },
  });
  
  // Form untuk pengaturan pengguna (ganti password)
  const userSettingsForm = useForm<UserSettingsFormData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Set nilai form ketika data appSettings tersedia
  useEffect(() => {
    if (appSettings) {
      appSettingsForm.reset({
        appName: appSettings?.appName || "",
        footerText: appSettings?.footerText || "",
        appLogo: appSettings?.appLogo || "",
      });
    }
  }, [appSettings, appSettingsForm]);
  
  // Mutasi untuk update pengaturan aplikasi
  const updateAppSettingsMutation = useMutation({
    mutationFn: async (data: AppSettingsFormData) => {
      const res = await apiRequest("PUT", "/api/app-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings"] });
      toast({
        title: "Berhasil",
        description: "Pengaturan aplikasi berhasil diperbarui",
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
  
  // Mutasi untuk update password
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: UserSettingsFormData) => {
      const res = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      userSettingsForm.reset();
      toast({
        title: "Berhasil",
        description: "Password berhasil diperbarui",
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
  
  // Handle submit pengaturan aplikasi
  const onSubmitAppSettings = (data: AppSettingsFormData) => {
    updateAppSettingsMutation.mutate(data);
  };
  
  // Handle submit ganti password
  const onSubmitUserSettings = (data: UserSettingsFormData) => {
    updatePasswordMutation.mutate(data);
  };
  
  // Handle klik tombol upload logo
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle saat file logo dipilih
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dalam implementasi nyata, ini akan mengunggah file ke server
      // Untuk sekarang, anggap saja kita mendapatkan URL
      const mockLogoUrl = "logo_url_here";
      appSettingsForm.setValue("appLogo", mockLogoUrl);
      toast({
        title: "Berhasil",
        description: "Logo berhasil diunggah",
      });
    }
  };
  
  // Reset formulir ke nilai asli
  const handleReset = () => {
    if (appSettings) {
      appSettingsForm.reset({
        appName: appSettings?.appName || "",
        footerText: appSettings?.footerText || "",
        appLogo: appSettings?.appLogo || "",
      });
      toast({
        title: "Formulir direset",
        description: "Pengaturan telah dikembalikan ke nilai awal",
      });
    }
  };
  
  return (
    <Layout title="Pengaturan Aplikasi">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
          <TabsTrigger value="app">
            <Settings2Icon className="h-4 w-4 mr-2" />
            Aplikasi
          </TabsTrigger>
          <TabsTrigger value="user">
            <UserIcon className="h-4 w-4 mr-2" />
            Akun Saya
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Pengaturan Aplikasi */}
        <TabsContent value="app">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Aplikasi</CardTitle>
              <CardDescription>
                Konfigurasi tampilan dan informasi umum aplikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Form {...appSettingsForm}>
                  <form onSubmit={appSettingsForm.handleSubmit(onSubmitAppSettings)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={appSettingsForm.control}
                          name="appName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Aplikasi</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={appSettingsForm.control}
                          name="footerText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teks Footer</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Teks yang muncul di footer aplikasi" 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={appSettingsForm.control}
                          name="appLogo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logo Aplikasi</FormLabel>
                              <div className="border rounded-md p-4 flex flex-col items-center justify-center">
                                {field.value ? (
                                  <div className="mb-4">
                                    <div className="w-24 h-24 bg-slate-100 rounded flex items-center justify-center">
                                      <ImageIcon className="h-12 w-12 text-slate-400" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-4 text-center">
                                    <div className="w-24 h-24 bg-slate-100 rounded mx-auto flex items-center justify-center">
                                      <ImageIcon className="h-12 w-12 text-slate-400" />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-2">
                                      Tidak ada logo
                                    </p>
                                  </div>
                                )}
                                
                                <Input 
                                  type="file" 
                                  className="hidden" 
                                  ref={fileInputRef} 
                                  onChange={handleFileChange}
                                  accept="image/*"
                                />
                                
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleUploadClick}
                                >
                                  <UploadIcon className="h-4 w-4 mr-2" />
                                  {field.value ? "Ganti Logo" : "Upload Logo"}
                                </Button>
                                <FormControl>
                                  <input type="hidden" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleReset}
                      >
                        <RotateCcwIcon className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateAppSettingsMutation.isPending}
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        Simpan Perubahan
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Pengaturan Akun Saya */}
        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>
                Kelola informasi akun dan ubah password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-medium">Detail Akun</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Username</Label>
                      <Input value={user?.username || ""} readOnly className="bg-slate-50" />
                      <p className="text-sm text-slate-500 mt-1">Username tidak dapat diubah</p>
                    </div>
                    <div>
                      <Label>Peran</Label>
                      <Input value={user?.role === "admin" ? "Administrator" : user?.role === "user" ? "Pengguna" : "Pengamat"} readOnly className="bg-slate-50" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-base font-medium">Ubah Password</h3>
                  <Form {...userSettingsForm}>
                    <form onSubmit={userSettingsForm.handleSubmit(onSubmitUserSettings)} className="space-y-4">
                      <FormField
                        control={userSettingsForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password Saat Ini</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={userSettingsForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password Baru</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userSettingsForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Konfirmasi Password Baru</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? "Memproses..." : "Perbarui Password"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
