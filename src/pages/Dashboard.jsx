import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const COLORS = ["#1e3a5f", "#2d5a8a", "#d4af37", "#e8c75a", "#4ade80", "#f87171", "#a78bfa", "#fb923c"];

export default function Dashboard() {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 200),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Statistik Atas
  const topStats = React.useMemo(() => ({
    total: students.length,
    pending: students.filter(s => s.status === "pending").length,
    accepted: students.filter(s => s.status === "accepted").length,
    undur_diri: students.filter(s => s.status === "undur_diri" || s.status === "tarik_berkas").length,
    laki: students.filter(s => s.gender === "Laki-laki").length,
    perempuan: students.filter(s => s.gender === "Perempuan").length,
  }), [students]);

  // 5 Pendaftar Terbaru
  const recentRegistrations = React.useMemo(() => 
    students.slice(0, 5),
    [students]
  );

  // Asal Sekolah (Tengah Kanan)
  const schoolTypeData = React.useMemo(() => {
    const types = { Negeri: 0, Swasta: 0, "MI/Pesantren": 0 };
    students.forEach(s => {
      if (s.previous_school_type && types[s.previous_school_type] !== undefined) {
        types[s.previous_school_type]++;
      }
    });
    return [
      { name: "Negeri", value: types.Negeri, color: "#1e3a5f" },
      { name: "Swasta", value: types.Swasta, color: "#2d5a8a" },
      { name: "MI/Pesantren", value: types["MI/Pesantren"], color: "#d4af37" },
    ];
  }, [students]);

  // Per-school breakdown
  const schoolListData = React.useMemo(() => {
    const schoolCount = {};
    students.forEach(s => {
      if (s.previous_school) {
        const key = `${s.previous_school}||${s.previous_school_type || ""}`;
        if (!schoolCount[key]) schoolCount[key] = { name: s.previous_school, type: s.previous_school_type || "-", count: 0 };
        schoolCount[key].count++;
      }
    });
    return Object.values(schoolCount).sort((a, b) => b.count - a.count);
  }, [students]);

  // Tab Data: Gelombang
  const waveData = React.useMemo(() => {
    const waves = { "Gelombang 1": 0, "Gelombang 2": 0 };
    students.forEach(s => {
      if (s.wave && waves[s.wave] !== undefined) {
        waves[s.wave]++;
      }
    });
    return [
      { name: "Gel. 1", value: waves["Gelombang 1"] },
      { name: "Gel. 2", value: waves["Gelombang 2"] },
    ];
  }, [students]);

  // Tab Data: Usia & Gender
  const ageGenderData = React.useMemo(() => {
    const ageGroups = {
      "11-12": { male: 0, female: 0 },
      "13-14": { male: 0, female: 0 },
      "15-16": { male: 0, female: 0 },
    };
    
    students.forEach(s => {
      if (s.birth_date && s.gender) {
        const age = new Date().getFullYear() - new Date(s.birth_date).getFullYear();
        const gender = s.gender === "Laki-laki" ? "male" : "female";
        
        if (age >= 11 && age <= 12) ageGroups["11-12"][gender]++;
        else if (age >= 13 && age <= 14) ageGroups["13-14"][gender]++;
        else if (age >= 15 && age <= 16) ageGroups["15-16"][gender]++;
      }
    });

    return Object.entries(ageGroups).map(([age, counts]) => ({
      age,
      "Laki-laki": counts.male,
      "Perempuan": counts.female,
    }));
  }, [students]);

  // Tab Data: Tes
  const testData = React.useMemo(() => {
    return {
      interview: [
        { name: "Belum", value: students.filter(s => s.interview_status === "belum" || !s.interview_status).length },
        { name: "Lulus", value: students.filter(s => s.interview_status === "lulus").length },
        { name: "Tidak Lulus", value: students.filter(s => s.interview_status === "tidak_lulus").length },
      ],
      quran: [
        { name: "Belum", value: students.filter(s => s.quran_test_status === "belum" || !s.quran_test_status).length },
        { name: "Lulus", value: students.filter(s => s.quran_test_status === "lulus").length },
        { name: "Tidak Lulus", value: students.filter(s => s.quran_test_status === "tidak_lulus").length },
      ],
    };
  }, [students]);

  // Tab Data: Wilayah
  const cityData = React.useMemo(() => {
    const cityCount = {};
    students.forEach(s => {
      if (s.city) {
        cityCount[s.city] = (cityCount[s.city] || 0) + 1;
      }
    });

    return Object.entries(cityCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [students]);

  // Ringkasan Data Bawah
  const summaryData = React.useMemo(() => ({
    statusPendaftaran: {
      gel1: students.filter(s => s.wave === "Gelombang 1").length,
      gel2: students.filter(s => s.wave === "Gelombang 2").length,
      diterima: students.filter(s => s.status === "accepted").length,
      undur_diri: students.filter(s => s.status === "undur_diri" || s.status === "tarik_berkas").length,
    },
    prosesTes: {
      sudah_wawancara: students.filter(s => s.interview_status === "lulus" || s.interview_status === "tidak_lulus").length,
      belum_wawancara: students.filter(s => s.interview_status === "belum" || !s.interview_status).length,
    },
    kehadiranRapat: {
      gel1: students.filter(s => s.meeting_attendance === "hadir_gel1").length,
      gel2: students.filter(s => s.meeting_attendance === "hadir_gel2").length,
    },
  }), [students]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard PPDB</h1>
        <p className="text-slate-500">Ringkasan data pendaftaran siswa baru</p>
      </div>

      {/* Stats Atas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Siswa</p>
                <p className="text-3xl font-bold text-[#1e3a5f]">{topStats.total}</p>
              </div>
              <Users size={40} className="text-[#1e3a5f] opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Menunggu Verifikasi</p>
                <p className="text-3xl font-bold text-yellow-600">{topStats.pending}</p>
              </div>
              <TrendingUp size={40} className="text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Diterima</p>
                <p className="text-3xl font-bold text-green-600">{topStats.accepted}</p>
              </div>
              <UserCheck size={40} className="text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Undur Diri</p>
                <p className="text-3xl font-bold text-red-600">{topStats.undur_diri}</p>
              </div>
              <UserX size={40} className="text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gender Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Laki-laki</p>
                <p className="text-3xl font-bold text-blue-600">{topStats.laki}</p>
                <p className="text-xs text-slate-500 mt-1">dari {topStats.total} siswa</p>
              </div>
              <span className="text-4xl opacity-60">♂</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-pink-50 to-pink-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Perempuan</p>
                <p className="text-3xl font-bold text-pink-600">{topStats.perempuan}</p>
                <p className="text-xs text-slate-500 mt-1">dari {topStats.total} siswa</p>
              </div>
              <span className="text-4xl opacity-60">♀</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tengah: Pendaftar Terbaru & Asal Sekolah */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendaftar Terbaru */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>5 Pendaftar Terbaru</CardTitle>
            <Link to={createPageUrl("StudentList")} className="text-sm text-[#1e3a5f] hover:underline">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <p className="text-center py-8 text-slate-400">Belum ada pendaftar</p>
            ) : (
              <div className="space-y-3">
                {recentRegistrations.map((student) => (
                  <Link
                    key={student.id}
                    to={createPageUrl(`StudentDetail?id=${student.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                        <Users size={20} className="text-[#1e3a5f]" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{student.full_name}</p>
                      <p className="text-xs text-slate-400">{student.registration_number}</p>
                      <p className="text-xs text-slate-500">
                        {student.registration_date && format(new Date(student.registration_date), "d MMM yyyy", { locale: id })}
                      </p>
                    </div>
                    {student.wave && (
                      <span className="text-xs px-2 py-1 bg-[#d4af37]/20 text-[#1e3a5f] rounded-full">
                        {student.wave}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asal Sekolah */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Asal Sekolah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Per jenis sekolah */}
            <div className="space-y-2">
              {schoolTypeData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: item.color + "15" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
            {/* Per nama sekolah */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Per Nama Sekolah</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {schoolListData.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-2">Belum ada data</p>
                ) : schoolListData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.type}</p>
                    </div>
                    <span className="ml-2 text-sm font-semibold text-slate-800 shrink-0">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Detail Tabs */}
      <Tabs defaultValue="wave" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="wave">Gelombang</TabsTrigger>
          <TabsTrigger value="school">Asal Sekolah</TabsTrigger>
          <TabsTrigger value="age">Usia & Gender</TabsTrigger>
          <TabsTrigger value="test">Tes</TabsTrigger>
          <TabsTrigger value="location">Wilayah</TabsTrigger>
        </TabsList>

        {/* Gelombang Tab */}
        <TabsContent value="wave" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Distribusi Gelombang Pendaftaran</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={waveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1e3a5f" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asal Sekolah Tab */}
        <TabsContent value="school" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Berdasarkan Jenis Sekolah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {schoolTypeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: item.color + "18" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="font-bold text-slate-800">{schoolTypeData.reduce((s, i) => s + i.value, 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Berdasarkan Nama Sekolah</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {schoolListData.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Belum ada data</p>
                  ) : schoolListData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.type}</p>
                      </div>
                      <span className="ml-3 font-bold text-slate-800 shrink-0">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usia & Gender Tab */}
        <TabsContent value="age" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Distribusi Usia & Jenis Kelamin</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageGenderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Laki-laki" fill="#1e3a5f" />
                  <Bar dataKey="Perempuan" fill="#d4af37" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tes Tab */}
        <TabsContent value="test" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Status Wawancara</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={testData.interview}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ""
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {testData.interview.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Status Tes Mengaji</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={testData.quran}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ""
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {testData.quran.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Wilayah Tab */}
        <TabsContent value="location" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Distribusi Wilayah (Kota/Kabupaten)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={cityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2d5a8a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ringkasan Data Bawah */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Ringkasan Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Pendaftaran */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Status Pendaftaran</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Gelombang 1</span>
                  <span className="font-medium text-slate-800">{summaryData.statusPendaftaran.gel1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Gelombang 2</span>
                  <span className="font-medium text-slate-800">{summaryData.statusPendaftaran.gel2}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Diterima</span>
                  <span className="font-medium text-slate-800">{summaryData.statusPendaftaran.diterima}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Undur Diri</span>
                  <span className="font-medium text-slate-800">{summaryData.statusPendaftaran.undur_diri}</span>
                </div>
              </div>
            </div>

            {/* Proses Tes */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Proses Tes</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Sudah Wawancara</span>
                  <span className="font-medium text-slate-800">{summaryData.prosesTes.sudah_wawancara}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Belum Wawancara</span>
                  <span className="font-medium text-slate-800">{summaryData.prosesTes.belum_wawancara}</span>
                </div>
              </div>
            </div>

            {/* Kehadiran Rapat */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Kehadiran Rapat</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Gelombang 1</span>
                  <span className="font-medium text-slate-800">{summaryData.kehadiranRapat.gel1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Gelombang 2</span>
                  <span className="font-medium text-slate-800">{summaryData.kehadiranRapat.gel2}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}