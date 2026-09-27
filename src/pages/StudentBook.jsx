import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, FileText, Download, User, Filter, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function StudentBook() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("accepted");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 500),
  });

  const { data: periodicData = [] } = useQuery({
    queryKey: ["periodicRecords"],
    queryFn: () => base44.entities.StudentPeriodic.list("-measurement_date", 1000),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => base44.entities.Payment.list("-payment_date", 1000),
  });

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.nisn?.includes(search) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || student.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getLatestPeriodic = (studentId) => {
    return periodicData.filter(p => p.student_id === studentId).sort((a, b) => 
      new Date(b.measurement_date) - new Date(a.measurement_date)
    )[0];
  };

  const getTotalPayment = (studentId) => {
    return payments
      .filter(p => p.student_id === studentId)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const exportToCSV = () => {
    const headers = [
      "No",
      "No. Pendaftaran",
      "Gelombang",
      "Tanggal Daftar",
      "Nama Petugas",
      "Status Pendaftaran",
      // Data Pribadi
      "Nama Lengkap",
      "Nama Panggilan",
      "NISN",
      "NIK",
      "Jenis Kelamin",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Agama",
      "Kewarganegaraan",
      "Anak Ke",
      "Jumlah Saudara",
      "Alamat",
      "RT",
      "RW",
      "Kelurahan",
      "Kecamatan",
      "Kota",
      "Provinsi",
      "Kode Pos",
      "Telepon",
      "KIP/KPS/PKH",
      "No. Kartu KIP/KPS/PKH",
      // Data Orang Tua
      "Nama Ayah",
      "NIK Ayah",
      "Tempat Lahir Ayah",
      "Tanggal Lahir Ayah",
      "Pendidikan Ayah",
      "Pekerjaan Ayah",
      "Penghasilan Ayah",
      "HP Ayah",
      "Nama Ibu",
      "NIK Ibu",
      "Tempat Lahir Ibu",
      "Tanggal Lahir Ibu",
      "Pendidikan Ibu",
      "Pekerjaan Ibu",
      "Penghasilan Ibu",
      "HP Ibu",
      "Nama Wali",
      "NIK Wali",
      "Hubungan Wali",
      "HP Wali",
      "Alamat Wali",
      // Sekolah Asal
      "Sekolah Asal",
      "Jenis Sekolah Asal",
      "Alamat Sekolah Asal",
      "NPSN",
      "Tahun Lulus",
      // Data Periodik (Terbaru)
      "Tinggi Badan (cm)",
      "Berat Badan (kg)",
      "Golongan Darah",
      "Lingkar Kepala (cm)",
      "Tanggal Ukur Periodik",
      // Wawancara
      "Status Wawancara",
      "Tanggal Wawancara",
      "Catatan Wawancara",
      // Tes Mengaji
      "Status Tes Mengaji",
      "Nilai Mengaji",
      "Level Mengaji",
      "Catatan Mengaji",
      // Ukur Baju
      "Ukuran Batik",
      "Ukuran Olahraga",
      "Ukuran Pangsi",
      "Ukuran Kebaya",
      // Pembayaran
      "Status Pembayaran",
      "Total Bayar",
      // Rapat Orang Tua
      "Kehadiran Rapat",
      "Alasan Tidak Hadir Rapat",
      // Dokumen
      "Akta Kelahiran",
      "KK",
      "KTP Ayah",
      "KTP Ibu",
      "Pas Foto 3x4",
      "Ijazah/SKL",
      "SKHUN",
      "Kartu NISN",
      "Kartu KIP",
    ];

    const rows = filteredStudents.map((s, i) => {
      const latestPeriodic = getLatestPeriodic(s.id);
      const totalPayment = getTotalPayment(s.id);
      
      return [
        i + 1,
        s.registration_number || "",
        s.wave || "",
        s.registration_date || "",
        s.registration_officer || "",
        s.status || "",
        // Data Pribadi
        s.full_name || "",
        s.nickname || "",
        s.nisn || "",
        s.nik || "",
        s.gender || "",
        s.birth_place || "",
        s.birth_date || "",
        s.religion || "",
        s.citizenship || "",
        s.child_order || "",
        s.siblings_count || "",
        s.address || "",
        s.rt || "",
        s.rw || "",
        s.village || "",
        s.district || "",
        s.city || "",
        s.province || "",
        s.postal_code || "",
        s.phone || "",
        s.kip_kps_pkh || "",
        s.kip_kps_pkh_number || "",
        // Data Orang Tua
        s.father_name || "",
        s.father_nik || "",
        s.father_birth_place || "",
        s.father_birth_date || "",
        s.father_education || "",
        s.father_job || "",
        s.father_income || "",
        s.father_phone || "",
        s.mother_name || "",
        s.mother_nik || "",
        s.mother_birth_place || "",
        s.mother_birth_date || "",
        s.mother_education || "",
        s.mother_job || "",
        s.mother_income || "",
        s.mother_phone || "",
        s.guardian_name || "",
        s.guardian_nik || "",
        s.guardian_relation || "",
        s.guardian_phone || "",
        s.guardian_address || "",
        // Sekolah Asal
        s.previous_school || "",
        s.previous_school_type || "",
        s.previous_school_address || "",
        s.previous_school_npsn || "",
        s.graduation_year || "",
        // Data Periodik
        latestPeriodic?.height || "",
        latestPeriodic?.weight || "",
        latestPeriodic?.blood_type || "",
        latestPeriodic?.head_circumference || "",
        latestPeriodic?.measurement_date || "",
        // Wawancara
        s.interview_status || "",
        s.interview_date || "",
        s.interview_notes || "",
        // Tes Mengaji
        s.quran_test_status || "",
        s.quran_test_score || "",
        s.quran_test_level || "",
        s.quran_test_notes || "",
        // Ukur Baju
        s.uniform_batik_size || "",
        s.uniform_sport_size || "",
        s.uniform_pangsi_size || "",
        s.uniform_kebaya_size || "",
        // Pembayaran
        s.payment_status || "",
        totalPayment || 0,
        // Rapat
        s.meeting_attendance || "",
        s.meeting_absent_reason || "",
        // Dokumen
        s.doc_birth_certificate ? "Ya" : "Tidak",
        s.doc_family_card ? "Ya" : "Tidak",
        s.doc_ktp_father ? "Ya" : "Tidak",
        s.doc_ktp_mother ? "Ya" : "Tidak",
        s.doc_photo_3x4 ? "Ya" : "Tidak",
        s.doc_ijazah ? "Ya" : "Tidak",
        s.doc_skhun ? "Ya" : "Tidak",
        s.doc_nisn_card ? "Ya" : "Tidak",
        s.doc_kip ? "Ya" : "Tidak",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell || ""}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `buku_induk_siswa_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buku Induk Siswa</h1>
          <p className="text-slate-500">Data lengkap siswa yang diterima</p>
        </div>
        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 gap-2">
          <Download size={16} />
          Export Excel/CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-slate-500">Total Diterima</p>
          <p className="text-2xl font-bold text-green-600">{students.filter(s => s.status === "accepted").length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-slate-500">♂ Laki-laki (Semua)</p>
          <p className="text-2xl font-bold text-blue-600">{students.filter(s => s.gender === "Laki-laki").length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-pink-50 to-pink-100">
          <p className="text-sm text-slate-500">♀ Perempuan (Semua)</p>
          <p className="text-2xl font-bold text-pink-600">{students.filter(s => s.gender === "Perempuan").length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Data Ditampilkan</p>
          <p className="text-2xl font-bold text-slate-800">{filteredStudents.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Cari nama, NISN, atau nomor pendaftaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="accepted">Diterima</SelectItem>
                <SelectItem value="verified">Terverifikasi</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12">No</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Orang Tua</TableHead>
                <TableHead>Sekolah Asal</TableHead>
                <TableHead>Data Periodik</TableHead>
                <TableHead>Status Proses</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                    Tidak ada data siswa
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => {
                  const latestPeriodic = getLatestPeriodic(student.id);
                  const totalPayment = getTotalPayment(student.id);
                  
                  return (
                    <TableRow key={student.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden">
                            {student.photo_url ? (
                              <img src={student.photo_url} alt="" className="w-10 h-10 object-cover" />
                            ) : (
                              <User size={18} className="text-[#1e3a5f]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{student.full_name}</p>
                            <p className="text-xs text-slate-400">{student.registration_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.nisn || "-"}</TableCell>
                      <TableCell>
                        <p className="text-sm">{student.birth_place}</p>
                        <p className="text-xs text-slate-400">
                          {student.birth_date && format(new Date(student.birth_date), "d MMM yyyy", { locale: id })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate">{student.address}</p>
                        <p className="text-xs text-slate-400">{student.city}, {student.province}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{student.father_name}</p>
                        <p className="text-xs text-slate-400">{student.mother_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate">{student.previous_school}</p>
                        <p className="text-xs text-slate-400">{student.previous_school_type}</p>
                      </TableCell>
                      <TableCell>
                        {latestPeriodic ? (
                          <div className="text-xs space-y-1">
                            <p>TB: {latestPeriodic.height} cm</p>
                            <p>BB: {latestPeriodic.weight} kg</p>
                            <p>GD: {latestPeriodic.blood_type}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">-</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={student.interview_status === "lulus" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}>
                            W: {student.interview_status === "lulus" ? "✓" : "-"}
                          </Badge>
                          <Badge className={student.quran_test_status === "lulus" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}>
                            M: {student.quran_test_status === "lulus" ? "✓" : "-"}
                          </Badge>
                          <Badge className={student.payment_status === "lunas" ? "bg-green-100 text-green-600" : student.payment_status === "dp" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-600"}>
                            {student.payment_status === "lunas" ? `Rp ${totalPayment.toLocaleString()}` : student.payment_status === "dp" ? `DP: Rp ${totalPayment.toLocaleString()}` : "Belum Bayar"}
                          </Badge>
                          <Badge className={student.meeting_attendance === "hadir_gel1" || student.meeting_attendance === "hadir_gel2" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}>
                            R: {student.meeting_attendance === "hadir_gel1" || student.meeting_attendance === "hadir_gel2" ? "✓" : "-"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(createPageUrl(`StudentDetail?id=${student.id}`))}
                          className="gap-2"
                        >
                          <Eye size={14} />
                          Lihat
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}