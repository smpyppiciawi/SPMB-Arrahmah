import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, MessageSquare, User, Save, Loader2, Calendar,
  ChevronDown, ChevronUp, Edit3, Eye, Clock, ExternalLink, Copy, Check, Download, StickyNote
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import InterviewForm from "../components/interview/InterviewForm";

const statusColors = {
  belum: "bg-gray-100 text-gray-600 border-gray-200",
  lulus: "bg-green-100 text-green-600 border-green-200",
  tidak_lulus: "bg-red-100 text-red-600 border-red-200",
};

const statusLabels = {
  belum: "Belum",
  lulus: "Lulus",
  tidak_lulus: "Tidak Lulus",
};

// Label map untuk pertanyaan wawancara
const QUESTION_LABELS = {
  interview_q1: "Melalui siapa dan dari mana orangtua/wali mengetahui sekolah kami?",
  interview_q2: "Apa alasan utama memilih SMP YPPI Arrahmah?",
  interview_q3: "Apakah Bapak/Ibu dapat membaca Al-Quran?",
  interview_q4: "Apakah Bapak/Ibu merokok?",
  interview_q5: "Apakah siswa merokok/vape diketahui orangtua?",
  interview_q6: "Apakah siswa mengaji di rumah?",
  interview_q7: "Bagaimana kebiasaan siswa dalam belajar di rumah?",
  interview_q8: "Mata pelajaran yang disukai siswa",
  interview_q9: "Mata pelajaran yang tidak disukai siswa",
  interview_q10: "Apakah siswa memiliki prestasi akademik/non akademik?",
  interview_q11: "Apakah siswa memiliki alergi?",
  interview_q12: "Keinginan siswa apakah selalu dipenuhi?",
  interview_q13: "Reaksi anak jika tidak dituruti keinginannya?",
  interview_q14: "Tingkat kemandirian siswa dalam aktivitas harian?",
  interview_q15: "Sikap siswa bertemu orang/lingkungan baru?",
  interview_q16: "Uang saku/jajan siswa dalam sehari?",
  interview_q17: "Apakah siswa memiliki HP pribadi?",
  interview_q18: "Seberapa sering HP siswa diperiksa orangtua?",
  interview_q19: "Orangtua memantau pergaulan siswa di rumah & luar sekolah?",
  interview_q20: "Orangtua memiliki batasan waktu bermain?",
  interview_q21: "Orangtua mengizinkan siswa ikuti kegiatan keagamaan?",
  interview_q22: "Orangtua bersedia siswa mengikuti tata tertib sekolah?",
  interview_q23: "Orangtua bersedia memenuhi panggilan sekolah?",
  interview_q24: "Orangtua menerima jika siswa mendapat improvement/point?",
  interview_q11_detail: "Detail alergi",
  interview_q25: "Tinggal dengan siapa?",
  interview_q26: "Pengasuh utama siswa?",
  interview_q27: "Riwayat penyakit?",
  interview_q27_detail: "Detail riwayat penyakit",
};

const Q_SECTIONS = [
  { title: "📋 Latar Belakang", fields: ["interview_q25","interview_q26","interview_q1","interview_q2","interview_q10"] },
  { title: "🕌 Kebiasaan & Agama", fields: ["interview_q3","interview_q6","interview_q7","interview_q8","interview_q9","interview_q27","interview_q27_detail","interview_q11","interview_q11_detail"] },
  { title: "📱 Perilaku & Gawai", fields: ["interview_q12","interview_q13","interview_q14","interview_q15","interview_q16","interview_q17","interview_q18","interview_q19","interview_q20"] },
  { title: "🤝 Komitmen", fields: ["interview_q4","interview_q5","interview_q21","interview_q21_reason","interview_q22","interview_q23","interview_q24"] },
];

const BOOL_FIELDS = ["interview_q21","interview_q22","interview_q23","interview_q24"];

function formatAnswer(field, value) {
  if (value === undefined || value === null || value === "") return <span className="text-slate-300 italic">belum diisi</span>;
  if (typeof value === "boolean") return value ? <span className="text-green-600 font-medium">✓ Ya</span> : <span className="text-red-500 font-medium">✗ Tidak</span>;
  return <span className="text-slate-800">{String(value)}</span>;
}

function hasInterviewData(student) {
  const fields = Object.keys(QUESTION_LABELS);
  return fields.some(f => {
    const v = student[f];
    if (BOOL_FIELDS.includes(f)) return v !== undefined && v !== null;
    return v !== undefined && v !== null && v !== "";
  });
}

export default function Interview() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [showEditForm, setShowEditForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = `${window.location.origin}/pewawancara`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Nama", "No. Pendaftaran", "Status Wawancara", "Tanggal", "Pewawancara", "Catatan",
      ...Object.values(QUESTION_LABELS)
    ];
    const escapeCSV = (val) => {
      if (val === undefined || val === null) return "";
      const str = typeof val === "boolean" ? (val ? "Ya" : "Tidak") : String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = students.map((s) => {
      return [
        s.full_name || "",
        s.registration_number || "",
        statusLabels[s.interview_status] || "Belum",
        s.interview_date ? format(new Date(s.interview_date), "dd/MM/yyyy") : "",
        s.interview_officer || "",
        s.interview_notes || "",
        ...Object.keys(QUESTION_LABELS).map((key) => {
          const val = s[key];
          if (BOOL_FIELDS.includes(key)) {
            if (val === undefined || val === null) return "";
            return val ? "Ya" : "Tidak";
          }
          return val ?? "";
        })
      ].map(escapeCSV).join(",");
    });
    const csv = [headers.map(escapeCSV).join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Hasil_Wawancara_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 200),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(["students"], (old) =>
        old.map(s => s.id === updatedData.id ? updatedData : s)
      );
      setSelectedStudent(prev => prev ? { ...prev, ...updatedData } : prev);
      setShowEditForm(false);
    },
  });

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || student.interview_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openModal = (student) => {
    setSelectedStudent(student);
    setShowEditForm(false);
    setFormData({
      interview_status: student.interview_status || "belum",
      interview_date: student.interview_date || "",
      interview_notes: student.interview_notes || "",
      interview_q1: student.interview_q1 || "",
      interview_q2: student.interview_q2 || "",
      interview_q3: student.interview_q3 || "",
      interview_q4: student.interview_q4 || "",
      interview_q5: student.interview_q5 || "",
      interview_q6: student.interview_q6 || "",
      interview_q7: student.interview_q7 || "",
      interview_q8: student.interview_q8 || "",
      interview_q9: student.interview_q9 || "",
      interview_q10: student.interview_q10 || "",
      interview_q11: student.interview_q11 || "",
      interview_q12: student.interview_q12 || "",
      interview_q13: student.interview_q13 || "",
      interview_q14: student.interview_q14 || "",
      interview_q15: student.interview_q15 || "",
      interview_q16: student.interview_q16 || "",
      interview_q17: student.interview_q17 || "",
      interview_q18: student.interview_q18 || "",
      interview_q19: student.interview_q19 || "",
      interview_q20: student.interview_q20 || "",
      interview_q21: student.interview_q21,
      interview_q21_reason: student.interview_q21_reason || "",
      interview_q22: student.interview_q22,
      interview_q23: student.interview_q23,
      interview_q24: student.interview_q24,
      interview_q11_detail: student.interview_q11_detail || "",
      interview_q25: student.interview_q25 || "",
      interview_q26: student.interview_q26 || "",
      interview_q27: student.interview_q27 || "",
      interview_q27_detail: student.interview_q27_detail || "",
    });
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setShowEditForm(false);
  };

  const handleSave = () => {
    updateMutation.mutate({ id: selectedStudent.id, data: formData });
  };

  const handleAutoSave = (data) => {
    setFormData(data);
    base44.entities.Student.update(selectedStudent.id, data).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const stats = {
    total: students.length,
    belum: students.filter(s => s.interview_status === "belum" || !s.interview_status).length,
    lulus: students.filter(s => s.interview_status === "lulus").length,
    tidak_lulus: students.filter(s => s.interview_status === "tidak_lulus").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Wawancara</h1>
          <p className="text-slate-500">Monitoring hasil wawancara siswa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
            onClick={() => window.open(portalUrl, "_blank")}
          >
            <ExternalLink size={16} />
            Buka Portal
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleCopyLink}
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            {copied ? "Tersalin" : "Copy Link"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
            onClick={handleDownloadCSV}
          >
            <Download size={16} />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Total Siswa</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Belum Wawancara</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.belum}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Lulus</p>
          <p className="text-2xl font-bold text-green-600">{stats.lulus}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Tidak Lulus</p>
          <p className="text-2xl font-bold text-red-600">{stats.tidak_lulus}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Cari nama atau nomor pendaftaran..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="belum">Belum</SelectItem>
              <SelectItem value="lulus">Lulus</SelectItem>
              <SelectItem value="tidak_lulus">Tidak Lulus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card
            key={student.id}
            className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openModal(student)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden">
                  {student.photo_url ? (
                    <img src={student.photo_url} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <User size={24} className="text-[#1e3a5f]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{student.full_name}</p>
                  <p className="text-xs text-slate-400">{student.registration_number}</p>
                  <p className="text-xs text-slate-500 mt-1">{student.previous_school}</p>
                </div>
                <Badge className={`${statusColors[student.interview_status || "belum"]} border`}>
                  {statusLabels[student.interview_status || "belum"]}
                </Badge>
              </div>
              {student.interview_date && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={14} />
                  {format(new Date(student.interview_date), "d MMM yyyy", { locale: id })}
                  {student.interview_officer && (
                    <span className="ml-2">• {student.interview_officer}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal — Hasil Wawancara Lengkap */}
      <Dialog open={!!selectedStudent} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare size={20} />
              Hasil Wawancara
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Info Siswa + Pewawancara */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedStudent.photo_url ? (
                    <img src={selectedStudent.photo_url} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <User size={24} className="text-[#1e3a5f]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{selectedStudent.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedStudent.registration_number} · {selectedStudent.previous_school}</p>
                </div>
                <Badge className={`${statusColors[selectedStudent.interview_status || "belum"]} border text-sm px-3 py-1`}>
                  {statusLabels[selectedStudent.interview_status || "belum"]}
                </Badge>
              </div>

              {/* Meta: Tanggal + Pewawancara */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Tanggal Wawancara</p>
                    <p className="font-medium text-sm">
                      {selectedStudent.interview_date
                        ? format(new Date(selectedStudent.interview_date), "d MMMM yyyy", { locale: id })
                        : <span className="text-slate-300 italic">belum</span>}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Pewawancara</p>
                    <p className="font-medium text-sm">
                      {selectedStudent.interview_officer || <span className="text-slate-300 italic">belum</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Catatan — selalu tampil */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <StickyNote size={14} className="text-yellow-700" />
                  <p className="text-xs text-yellow-700 font-medium">Catatan Wawancara</p>
                </div>
                {selectedStudent.interview_notes ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedStudent.interview_notes}</p>
                ) : (
                  <p className="text-sm text-slate-300 italic">Belum ada catatan</p>
                )}
              </div>

              {/* Hasil Pertanyaan — Read-only View */}
              {!showEditForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm">Detail Jawaban Wawancara</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditForm(true)}
                      className="gap-2"
                    >
                      <Edit3 size={14} />
                      Edit
                    </Button>
                  </div>

                  {!hasInterviewData(selectedStudent) ? (
                    <div className="text-center py-8 text-slate-400">
                      <Clock size={32} className="mx-auto mb-2" />
                      <p className="text-sm">Siswa ini belum diwawancara</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditForm(true)}
                        className="mt-3 gap-2"
                      >
                        <Edit3 size={14} /> Mulai Wawancara
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Q_SECTIONS.map((section) => {
                        const hasAnyFilled = section.fields.some(f => {
                          const v = selectedStudent[f];
                          if (BOOL_FIELDS.includes(f)) return v !== undefined && v !== null;
                          return v !== undefined && v !== null && v !== "";
                        });
                        if (!hasAnyFilled) return null;
                        return (
                          <div key={section.title} className="border rounded-lg overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 font-medium text-sm text-slate-700">
                              {section.title}
                            </div>
                            <div className="divide-y">
                              {section.fields.map((field) => {
                                if (field === "interview_q21_reason" && selectedStudent.interview_q21 !== false) return null;
                                const val = selectedStudent[field];
                                const isFilled = BOOL_FIELDS.includes(field)
                                  ? (val !== undefined && val !== null)
                                  : (val !== undefined && val !== null && val !== "");
                                if (!isFilled) return null;
                                return (
                                  <div key={field} className="px-4 py-2.5 flex gap-3">
                                    <span className="text-xs text-slate-400 shrink-0 w-5 pt-0.5">•</span>
                                    <div className="min-w-0">
                                      <p className="text-xs text-slate-500">{QUESTION_LABELS[field]}</p>
                                      <p className="text-sm mt-0.5">{formatAnswer(field, val)}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Edit Form */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm">Edit Wawancara</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowEditForm(false)}>Batal</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Tanggal</label>
                      <Input
                        type="date"
                        value={formData.interview_date || ""}
                        onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Status</label>
                      <Select value={formData.interview_status} onValueChange={(v) => setFormData({ ...formData, interview_status: v })}>
                        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="belum">Belum</SelectItem>
                          <SelectItem value="lulus">Lulus</SelectItem>
                          <SelectItem value="tidak_lulus">Tidak Lulus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Catatan</label>
                    <Textarea
                      value={formData.interview_notes || ""}
                      onChange={(e) => setFormData({ ...formData, interview_notes: e.target.value })}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <InterviewForm formData={formData} setFormData={handleAutoSave} />
                </div>
              )}

              {/* Tombol Simpan — hanya saat edit */}
              {showEditForm && (
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2 sticky bottom-0"
                >
                  {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Simpan Perubahan
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}