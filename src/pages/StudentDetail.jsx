import React, { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Printer,
  Edit,
  User,
  Users,
  School,
  FileText,
  Loader2,
  Save,
  Trash2,
  CheckSquare,
  FileCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import PersonalDataForm from "../components/registration/PersonalDataForm";
import ParentDataForm from "../components/registration/ParentDataForm";
import SchoolHistoryForm from "../components/registration/SchoolHistoryForm";
import RegistrationInfoForm from "../components/registration/RegistrationInfoForm";
import DocumentChecklistForm from "../components/registration/DocumentChecklistForm";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  verified: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  tarik_berkas: "bg-orange-100 text-orange-700 border-orange-200",
  undur_diri: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  pending: "Pending",
  verified: "Terverifikasi",
  accepted: "Diterima",
  tarik_berkas: "Tarik Berkas",
  undur_diri: "Undur Diri",
};

export default function StudentDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("id");
  const printRef = useRef();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const { data: student, isLoading, error, refetch } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const students = await base44.entities.Student.filter({ id: studentId });
      return students[0];
    },
    enabled: !!studentId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 2,
  });

  React.useEffect(() => {
    if (student) {
      setFormData(student);
    }
  }, [student]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.update(studentId, data),
    onSuccess: (updatedData) => {
      // Update cache directly instead of invalidating
      queryClient.setQueryData(["student", studentId], updatedData);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete related periodic data
      const periodicRecords = await base44.entities.StudentPeriodic.filter({ student_id: studentId });
      await Promise.all(periodicRecords.map(record => 
        base44.entities.StudentPeriodic.delete(record.id)
      ));
      
      // Delete student
      await base44.entities.Student.delete(studentId);
    },
    onSuccess: () => {
      // Update cache
      queryClient.setQueryData(["students"], (old) => 
        old?.filter(s => s.id !== studentId) || []
      );
      navigate(createPageUrl("StudentList"));
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa ${student.full_name}? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteMutation.mutate();
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Formulir Pendaftaran - ${student?.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; }
            .header h1 { color: #1e3a5f; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .section { margin-bottom: 20px; }
            .section-title { background: #1e3a5f; color: white; padding: 8px 15px; font-weight: bold; margin-bottom: 10px; }
            .field { display: flex; padding: 5px 0; border-bottom: 1px solid #eee; }
            .label { width: 200px; font-weight: 500; color: #333; }
            .value { flex: 1; color: #666; }
            .photo { float: right; width: 120px; height: 150px; border: 1px solid #ccc; margin-left: 20px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FORMULIR PENDAFTARAN PPDB</h1>
            <p>Tahun Pelajaran 2026-2027</p>
            <p>No. Pendaftaran: <strong>${student?.registration_number}</strong></p>
          </div>
          ${student?.photo_url ? `<img src="${student.photo_url}" class="photo" />` : ""}
          
          <div class="section">
            <div class="section-title">DATA PRIBADI SISWA</div>
            <div class="field"><span class="label">Nama Lengkap</span><span class="value">${student?.full_name || "-"}</span></div>
            <div class="field"><span class="label">Nama Panggilan</span><span class="value">${student?.nickname || "-"}</span></div>
            <div class="field"><span class="label">NISN</span><span class="value">${student?.nisn || "-"}</span></div>
            <div class="field"><span class="label">NIK</span><span class="value">${student?.nik || "-"}</span></div>
            <div class="field"><span class="label">Jenis Kelamin</span><span class="value">${student?.gender || "-"}</span></div>
            <div class="field"><span class="label">Tempat, Tanggal Lahir</span><span class="value">${student?.birth_place || "-"}, ${student?.birth_date ? format(new Date(student.birth_date), "d MMMM yyyy", { locale: id }) : "-"}</span></div>
            <div class="field"><span class="label">Agama</span><span class="value">${student?.religion || "-"}</span></div>
            <div class="field"><span class="label">Golongan Darah</span><span class="value">${student?.blood_type || "-"}</span></div>
            <div class="field"><span class="label">Anak Ke-</span><span class="value">${student?.child_order || "-"} dari ${student?.siblings_count || "-"} bersaudara</span></div>
            <div class="field"><span class="label">Alamat</span><span class="value">${student?.address || "-"} RT ${student?.rt || "-"} RW ${student?.rw || "-"}</span></div>
            <div class="field"><span class="label">Kelurahan/Desa</span><span class="value">${student?.village || "-"}</span></div>
            <div class="field"><span class="label">Kecamatan</span><span class="value">${student?.district || "-"}</span></div>
            <div class="field"><span class="label">Kota/Kabupaten</span><span class="value">${student?.city || "-"}</span></div>
            <div class="field"><span class="label">Provinsi</span><span class="value">${student?.province || "-"}</span></div>
            <div class="field"><span class="label">Kode Pos</span><span class="value">${student?.postal_code || "-"}</span></div>
            <div class="field"><span class="label">No. Telepon</span><span class="value">${student?.phone || "-"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">DATA AYAH</div>
            <div class="field"><span class="label">Nama</span><span class="value">${student?.father_name || "-"}</span></div>
            <div class="field"><span class="label">NIK</span><span class="value">${student?.father_nik || "-"}</span></div>
            <div class="field"><span class="label">Tempat, Tanggal Lahir</span><span class="value">${student?.father_birth_place || "-"}, ${student?.father_birth_date ? format(new Date(student.father_birth_date), "d MMMM yyyy", { locale: id }) : "-"}</span></div>
            <div class="field"><span class="label">Pendidikan</span><span class="value">${student?.father_education || "-"}</span></div>
            <div class="field"><span class="label">Pekerjaan</span><span class="value">${student?.father_job || "-"}</span></div>
            <div class="field"><span class="label">Penghasilan</span><span class="value">${student?.father_income || "-"}</span></div>
            <div class="field"><span class="label">No. HP</span><span class="value">${student?.father_phone || "-"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">DATA IBU</div>
            <div class="field"><span class="label">Nama</span><span class="value">${student?.mother_name || "-"}</span></div>
            <div class="field"><span class="label">NIK</span><span class="value">${student?.mother_nik || "-"}</span></div>
            <div class="field"><span class="label">Tempat, Tanggal Lahir</span><span class="value">${student?.mother_birth_place || "-"}, ${student?.mother_birth_date ? format(new Date(student.mother_birth_date), "d MMMM yyyy", { locale: id }) : "-"}</span></div>
            <div class="field"><span class="label">Pendidikan</span><span class="value">${student?.mother_education || "-"}</span></div>
            <div class="field"><span class="label">Pekerjaan</span><span class="value">${student?.mother_job || "-"}</span></div>
            <div class="field"><span class="label">Penghasilan</span><span class="value">${student?.mother_income || "-"}</span></div>
            <div class="field"><span class="label">No. HP</span><span class="value">${student?.mother_phone || "-"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">RIWAYAT PENDIDIKAN</div>
            <div class="field"><span class="label">Sekolah Asal</span><span class="value">${student?.previous_school || "-"}</span></div>
            <div class="field"><span class="label">Alamat Sekolah</span><span class="value">${student?.previous_school_address || "-"}</span></div>
            <div class="field"><span class="label">NPSN</span><span class="value">${student?.previous_school_npsn || "-"}</span></div>
            <div class="field"><span class="label">Tahun Lulus</span><span class="value">${student?.graduation_year || "-"}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Terjadi kesalahan saat memuat data</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Coba Lagi
          </Button>
          <Button variant="outline" onClick={() => navigate(createPageUrl("StudentList"))}>
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  if (!student && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Data siswa tidak ditemukan</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Coba Lagi
          </Button>
          <Button variant="outline" onClick={() => navigate(createPageUrl("StudentList"))}>
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("StudentList"))}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{student.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500 font-mono">{student.registration_number}</span>
              <Badge className={`${statusColors[student.status]} border`}>
                {statusLabels[student.status]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl(`RegistrationReceipt?id=${studentId}`))}
            className="gap-2 text-slate-900"
          >
            <Printer size={16} />
            Cetak Bukti Pendaftaran
          </Button>
          <Button variant="outline" onClick={() => navigate(createPageUrl(`RegistrationForm?id=${studentId}`))} className="gap-2 text-slate-900">
            <Printer size={16} />
            Cetak Formulir
          </Button>
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)} className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
                <Edit size={16} />
                Edit Data
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Hapus
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Simpan
            </Button>
          )}
        </div>
      </div>

      {/* Status Update */}
      <Card className="p-4 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="font-medium text-slate-700">Ubah Status:</span>
          <Select
            value={formData.status || student.status}
            onValueChange={(value) => {
              const newData = { ...formData, status: value };
              setFormData(newData);
              updateMutation.mutate(newData);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Terverifikasi</SelectItem>
              <SelectItem value="accepted">Diterima</SelectItem>
              <SelectItem value="tarik_berkas">Tarik Berkas</SelectItem>
              <SelectItem value="undur_diri">Undur Diri</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Content */}
      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RegistrationInfoForm formData={formData} setFormData={setFormData} errors={errors} />
            <PersonalDataForm formData={formData} setFormData={setFormData} errors={errors} />
            <ParentDataForm formData={formData} setFormData={setFormData} errors={errors} />
            <SchoolHistoryForm formData={formData} setFormData={setFormData} errors={errors} />
          </div>
          <div>
            <DocumentChecklistForm formData={formData} setFormData={setFormData} errors={errors} />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="personal" className="gap-2">
              <User size={16} className="hidden sm:block" />
              Pribadi
            </TabsTrigger>
            <TabsTrigger value="parents" className="gap-2">
              <Users size={16} className="hidden sm:block" />
              Orang Tua
            </TabsTrigger>
            <TabsTrigger value="school" className="gap-2">
              <School size={16} className="hidden sm:block" />
              Pendidikan
            </TabsTrigger>
            <TabsTrigger value="process" className="gap-2">
              <FileText size={16} className="hidden sm:block" />
              Proses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {student.photo_url && (
                    <img
                      src={student.photo_url}
                      alt=""
                      className="w-32 h-40 object-cover rounded-xl shadow-md"
                    />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <DataField label="Nama Lengkap" value={student.full_name} />
                    <DataField label="Nama Panggilan" value={student.nickname} />
                    <DataField label="NISN" value={student.nisn} />
                    <DataField label="NIK" value={student.nik} />
                    <DataField label="Jenis Kelamin" value={student.gender} />
                    <DataField
                      label="Tempat, Tanggal Lahir"
                      value={`${student.birth_place || "-"}, ${student.birth_date ? format(new Date(student.birth_date), "d MMMM yyyy", { locale: id }) : "-"}`}
                    />
                    <DataField label="Agama" value={student.religion} />
                    <DataField label="Golongan Darah" value={student.blood_type} />
                    <DataField label="Anak Ke-" value={`${student.child_order || "-"} dari ${student.siblings_count || "-"} bersaudara`} />
                    <DataField label="No. Telepon" value={student.phone} />
                    <div className="md:col-span-2">
                      <DataField
                        label="Alamat"
                        value={`${student.address || "-"}, RT ${student.rt || "-"} RW ${student.rw || "-"}, ${student.village || ""}, ${student.district || ""}, ${student.city || ""}, ${student.province || ""} ${student.postal_code || ""}`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
                  <CardTitle className="text-lg">Data Ayah</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <DataField label="Nama" value={student.father_name} />
                  <DataField label="NIK" value={student.father_nik} />
                  <DataField
                    label="TTL"
                    value={`${student.father_birth_place || "-"}, ${student.father_birth_date ? format(new Date(student.father_birth_date), "d MMM yyyy", { locale: id }) : "-"}`}
                  />
                  <DataField label="Pendidikan" value={student.father_education} />
                  <DataField label="Pekerjaan" value={student.father_job} />
                  <DataField label="Penghasilan" value={student.father_income} />
                  <DataField label="No. HP" value={student.father_phone} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
                  <CardTitle className="text-lg">Data Ibu</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <DataField label="Nama" value={student.mother_name} />
                  <DataField label="NIK" value={student.mother_nik} />
                  <DataField
                    label="TTL"
                    value={`${student.mother_birth_place || "-"}, ${student.mother_birth_date ? format(new Date(student.mother_birth_date), "d MMM yyyy", { locale: id }) : "-"}`}
                  />
                  <DataField label="Pendidikan" value={student.mother_education} />
                  <DataField label="Pekerjaan" value={student.mother_job} />
                  <DataField label="Penghasilan" value={student.mother_income} />
                  <DataField label="No. HP" value={student.mother_phone} />
                </CardContent>
              </Card>

              {student.guardian_name && (
                <Card className="border-0 shadow-md md:col-span-2">
                  <CardHeader className="bg-slate-600 text-white rounded-t-xl">
                    <CardTitle className="text-lg">Data Wali</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DataField label="Nama" value={student.guardian_name} />
                    <DataField label="NIK" value={student.guardian_nik} />
                    <DataField label="Hubungan" value={student.guardian_relation} />
                    <DataField label="No. HP" value={student.guardian_phone} />
                    <div className="md:col-span-2">
                      <DataField label="Alamat" value={student.guardian_address} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="school">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
                <CardTitle className="text-lg">Riwayat Pendidikan</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataField label="Sekolah Asal" value={student.previous_school} />
                <DataField label="NPSN" value={student.previous_school_npsn} />
                <DataField label="Tahun Lulus" value={student.graduation_year} />
                <div className="md:col-span-2">
                  <DataField label="Alamat Sekolah" value={student.previous_school_address} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="process">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Status Proses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ProcessItem
                      label="Wawancara"
                      status={student.interview_status}
                      notes={student.interview_notes}
                    />
                    <ProcessItem
                      label="Tes Mengaji"
                      status={student.quran_test_status}
                      score={student.quran_test_score}
                    />
                    <ProcessItem
                      label="Pembayaran"
                      status={student.payment_status}
                      amount={student.payment_amount}
                    />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Ukuran Seragam</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DataField label="Batik" value={student.uniform_batik_size} />
                    <DataField label="Olahraga" value={student.uniform_sport_size} />
                    {student.gender === "Laki-laki" ? (
                      <DataField label="Pangsi" value={student.uniform_pangsi_size} />
                    ) : (
                      <DataField label="Kebaya" value={student.uniform_kebaya_size} />
                    )}
                  </CardContent>
                </Card>
              </div>

              <DocChecklistEditor student={student} studentId={studentId} queryClient={queryClient} />
            </div>
          </TabsContent>
        </Tabs>
      )}

      <div ref={printRef} className="hidden" />
    </div>
  );
}

function DataField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value || "-"}</p>
    </div>
  );
}

const docFields = [
  { key: "doc_birth_certificate", label: "Akta Kelahiran" },
  { key: "doc_family_card", label: "Kartu Keluarga" },
  { key: "doc_ktp_father", label: "KTP Ayah" },
  { key: "doc_ktp_mother", label: "KTP Ibu" },
  { key: "doc_photo_3x4", label: "Pas Foto 3x4" },
  { key: "doc_ijazah", label: "Ijazah/SKL" },
  { key: "doc_skhun", label: "SKHUN" },
  { key: "doc_nisn_card", label: "Kartu NISN/NISN via Website" },
  { key: "doc_kip", label: "Kartu KIP/KPS/PKH (Jika ada)" },
];

function DocChecklistEditor({ student, studentId, queryClient }) {
  const [docs, setDocs] = React.useState(() => {
    const d = {};
    docFields.forEach((f) => { d[f.key] = student[f.key] || false; });
    return d;
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.update(studentId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["student", studentId], updated);
    },
  });

  const checkedCount = docFields.filter((f) => docs[f.key]).length;

  const handleToggle = (key, checked) => {
    setDocs((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = () => {
    updateMutation.mutate(docs);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckSquare size={20} />
          Ceklis Berkas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {docFields.map((doc) => (
          <div
            key={doc.key}
            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
              docs[doc.key] ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
            onClick={() => handleToggle(doc.key, !docs[doc.key])}
          >
            <Checkbox
              id={`view-${doc.key}`}
              checked={docs[doc.key] || false}
              onCheckedChange={(checked) => handleToggle(doc.key, checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <label htmlFor={`view-${doc.key}`} className="flex-1 text-sm cursor-pointer select-none">
              {doc.label}
            </label>
            {docs[doc.key] && <FileCheck size={16} className="text-green-500 shrink-0" />}
          </div>
        ))}
        <p className="text-xs text-slate-500 text-center pt-1">
          {checkedCount} dari {docFields.length} berkas terkumpul
        </p>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2 mt-2"
        >
          {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Simpan Berkas
        </Button>
      </CardContent>
    </Card>
  );
}

function ProcessItem({ label, status, notes, score, amount }) {
  const statusMap = {
    belum: { label: "Belum", color: "bg-gray-100 text-gray-600" },
    lulus: { label: "Lulus", color: "bg-green-100 text-green-600" },
    tidak_lulus: { label: "Tidak Lulus", color: "bg-red-100 text-red-600" },
    belum_bayar: { label: "Belum Bayar", color: "bg-gray-100 text-gray-600" },
    dp: { label: "DP", color: "bg-yellow-100 text-yellow-600" },
    lunas: { label: "Lunas", color: "bg-green-100 text-green-600" },
  };

  const statusInfo = statusMap[status] || statusMap.belum;

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div>
        <p className="font-medium text-slate-800">{label}</p>
        {notes && <p className="text-xs text-slate-500">{notes}</p>}
        {score !== undefined && score !== null && (
          <p className="text-xs text-slate-500">Nilai: {score}</p>
        )}
        {amount !== undefined && amount !== null && (
          <p className="text-xs text-slate-500">Rp {amount?.toLocaleString("id-ID")}</p>
        )}
      </div>
      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
    </div>
  );
}