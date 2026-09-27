import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, UserPlus, Eye, User, Filter, Banknote, Loader2, Save, Users, BarChart3 } from "lucide-react";
import CekRekapDialog from "@/components/student/CekRekapDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

const paymentStatusColors = {
  belum_bayar: "bg-gray-100 text-gray-600 border-gray-200",
  dp: "bg-yellow-100 text-yellow-600 border-yellow-200",
  lunas: "bg-green-100 text-green-600 border-green-200",
  yatim: "bg-purple-100 text-purple-600 border-purple-200",
  beasiswa: "bg-blue-100 text-blue-600 border-blue-200",
};
const paymentStatusLabels = {
  belum_bayar: "Belum Bayar", dp: "DP", lunas: "Lunas", yatim: "Yatim", beasiswa: "Beasiswa",
};

const getOrphanStatus = (student) => {
  const fatherDead = student.father_job === "Sudah Meninggal";
  const motherDead = student.mother_job === "Sudah Meninggal";
  if (fatherDead && motherDead) return "yatim_piatu";
  if (fatherDead) return "yatim";
  if (motherDead) return "piatu";
  return "none";
};

const isWithdrawn = (s) => s.status === "undur_diri" || s.status === "tarik_berkas";

const WAVE1_COST = 1815000;
const WAVE2_COST = 2265000;
const SPECIAL_COST = 610000;

const QUOTA_SETTING_KEY = "enrollment_quota";
const DEFAULT_QUOTA = 170;

export default function StudentList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orphanFilter, setOrphanFilter] = useState("all");
  const [payStudent, setPayStudent] = useState(null);
  const [payForm, setPayForm] = useState({ payment_date: new Date().toISOString().split("T")[0], amount: "", notes: "" });
  const [quotaInput, setQuotaInput] = useState(String(DEFAULT_QUOTA));
  const [editingQuota, setEditingQuota] = useState(false);
  const [cekRekapOpen, setCekRekapOpen] = useState(false);

  const { data: quotaSetting } = useQuery({
    queryKey: ["setting", QUOTA_SETTING_KEY],
    queryFn: async () => {
      const results = await base44.entities.Setting.filter({ key: QUOTA_SETTING_KEY });
      return results[0];
    },
  });

  const quota = quotaSetting ? parseInt(quotaSetting.value) : DEFAULT_QUOTA;
  const saveQuotaMutation = useMutation({
    mutationFn: async (newVal) => {
      if (quotaSetting?.id) {
        return base44.entities.Setting.update(quotaSetting.id, { value: String(newVal) });
      } else {
        return base44.entities.Setting.create({ key: QUOTA_SETTING_KEY, value: String(newVal) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setting", QUOTA_SETTING_KEY] });
    },
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 200),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
  });

  const filteredStudents = students.filter((student) => {
    const matchSearch =
      student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.nisn?.includes(search) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || student.status === statusFilter;
    const orphanStatus = getOrphanStatus(student);
    const matchOrphan = orphanFilter === "all" || orphanStatus === orphanFilter;
    return matchSearch && matchStatus && matchOrphan;
  });

  // Stats
  const activeStudents = students.filter(s => !isWithdrawn(s));
  const withdrawnCount = students.filter(isWithdrawn).length;
  const lakiCount = activeStudents.filter(s => s.gender === "Laki-laki").length;
  const perempuanCount = activeStudents.filter(s => s.gender === "Perempuan").length;
  const slotTersedia = Math.max(0, quota - activeStudents.length);

  const getTarget = (student) => {
    if (student.total_cost_override > 0) return student.total_cost_override;
    if (student.payment_status === "yatim" || student.payment_status === "beasiswa") return SPECIAL_COST;
    if (student.wave === "Gelombang 1") return WAVE1_COST;
    if (student.wave === "Gelombang 2") return WAVE2_COST;
    return 0;
  };

  const handleSaveQuota = () => {
    const val = parseInt(quotaInput) || 0;
    saveQuotaMutation.mutate(val);
    setEditingQuota(false);
  };

  const openPayModal = (student) => {
    const orphan = getOrphanStatus(student);
    if ((orphan === "yatim" || orphan === "yatim_piatu") && (!student.payment_status || student.payment_status === "belum_bayar")) {
      updateStudentMutation.mutate({ id: student.id, data: { payment_status: "yatim" } });
      student = { ...student, payment_status: "yatim" };
    }
    setPayStudent(student);
    setPayForm({ payment_date: new Date().toISOString().split("T")[0], amount: "", notes: "" });
  };

  const handlePay = async () => {
    if (!payForm.payment_date || !payForm.amount) {
      alert("Tanggal dan nominal wajib diisi");
      return;
    }

    const amount = Number(payForm.amount);
    await createPaymentMutation.mutateAsync({
      student_id: payStudent.id,
      payment_date: payForm.payment_date,
      amount,
      notes: payForm.notes,
    });

    const payments = await base44.entities.Payment.filter({ student_id: payStudent.id });
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const target = getTarget(payStudent);
    let newStatus = "belum_bayar";
    if (payStudent.payment_status === "yatim" || payStudent.payment_status === "beasiswa") {
      newStatus = payStudent.payment_status;
    } else if (totalPaid === 0) {
      newStatus = "belum_bayar";
    } else if (totalPaid >= target) {
      newStatus = "lunas";
    } else {
      newStatus = "dp";
    }

    const updateData = { payment_status: newStatus };
    if (newStatus === "lunas") updateData.status = "accepted";

    await updateStudentMutation.mutateAsync({ id: payStudent.id, data: updateData });

    await queryClient.invalidateQueries({ queryKey: ["students"] });
    await queryClient.invalidateQueries({ queryKey: ["payments"] });
    setPayStudent(null);
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
          <h1 className="text-2xl font-bold text-slate-800">Data Siswa</h1>
          <p className="text-slate-500">
            {activeStudents.length} pendaftar aktif &nbsp;·&nbsp;
            <span className="text-blue-600 font-medium">♂ {lakiCount} L</span>
            &nbsp;&nbsp;
            <span className="text-pink-600 font-medium">♀ {perempuanCount} P</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setCekRekapOpen(true)} className="gap-2">
            <BarChart3 size={16} /> Cek Rekap
          </Button>
          <Link to={createPageUrl("WaitingList")}>
            <Button variant="outline" className="gap-2"><Search size={16} /> Waiting List</Button>
          </Link>
          <Link to={createPageUrl("Registration")}>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"><UserPlus size={16} /> Tambah Siswa</Button>
          </Link>
        </div>
      </div>

      {/* Stats — Sederhana: Total Terdaftar, Jenis Kelamin, Undur Diri, Slot Tersedia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Terdaftar</p>
              <p className="text-3xl font-bold text-[#1e3a5f]">{activeStudents.length}</p>
            </div>
            <Users size={32} className="text-[#1e3a5f] opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-slate-600">Jenis Kelamin</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl font-bold text-blue-600">♂ {lakiCount}</span>
            <span className="text-xl font-bold text-pink-600">♀ {perempuanCount}</span>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Undur Diri</p>
              <p className="text-3xl font-bold text-red-600">{withdrawnCount}</p>
            </div>
            <User size={32} className="text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className={`p-4 border-0 shadow-sm bg-gradient-to-br ${slotTersedia > 0 ? "from-green-50 to-green-100" : "from-red-50 to-red-100"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Slot Tersedia</p>
              <p className={`text-3xl font-bold ${slotTersedia > 0 ? "text-green-600" : "text-red-600"}`}>
                {slotTersedia}
              </p>
              <p className="text-xs text-slate-500">dari kuota {quota}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Kuota Setting */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">Kuota Pendaftar</Label>
            <p className="text-xs text-slate-500 mt-0.5">Menentukan total slot penerimaan siswa baru (tidak mempengaruhi penomoran)</p>
          </div>
          {editingQuota ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={quotaInput}
                onChange={(e) => setQuotaInput(e.target.value)}
                className="w-24 text-center font-bold"
              />
              <Button size="sm" onClick={handleSaveQuota} disabled={saveQuotaMutation.isPending} className="bg-green-600 hover:bg-green-700 gap-1">
                {saveQuotaMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditingQuota(false); setQuotaInput(String(quota)); }}>
                Batal
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-[#1e3a5f]">{quota}</p>
                <p className="text-xs text-slate-500">siswa · tersinkron ke seluruh akun</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setEditingQuota(true); setQuotaInput(String(quota)); }}>Ubah</Button>
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Terisi: {activeStudents.length}</span>
            <span>{Math.round((activeStudents.length / quota) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${slotTersedia > 0 ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(100, (activeStudents.length / quota) * 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Cari nama, NISN, atau nomor pendaftaran..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Terverifikasi</SelectItem>
                <SelectItem value="accepted">Diterima</SelectItem>
                <SelectItem value="tarik_berkas">Tarik Berkas</SelectItem>
                <SelectItem value="undur_diri">Undur Diri</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <Select value={orphanFilter} onValueChange={setOrphanFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Yatim/Piatu" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="yatim">Yatim (Ayah Meninggal)</SelectItem>
                <SelectItem value="piatu">Piatu (Ibu Meninggal)</SelectItem>
                <SelectItem value="yatim_piatu">Yatim Piatu (Keduanya)</SelectItem>
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
                <TableHead>Siswa</TableHead>
                <TableHead>No. Pendaftaran</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">Tidak ada data siswa</TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden">
                          {student.photo_url ? (
                            <img src={student.photo_url} alt="" className="w-10 h-10 object-cover" />
                          ) : (
                            <User size={20} className="text-[#1e3a5f]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{student.full_name}</p>
                          <p className="text-xs text-slate-400">{student.gender} • {student.previous_school}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.registration_number}</TableCell>
                    <TableCell>{student.nisn}</TableCell>
                    <TableCell>
                      {student.registration_date && format(new Date(student.registration_date), "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={`${statusColors[student.status] || statusColors.pending} border`}>
                          {statusLabels[student.status] || "Pending"}
                        </Badge>
                        {getOrphanStatus(student) === "yatim" && (
                          <Badge className="bg-purple-100 text-purple-700 border border-purple-200">Yatim</Badge>
                        )}
                        {getOrphanStatus(student) === "piatu" && (
                          <Badge className="bg-pink-100 text-pink-700 border border-pink-200">Piatu</Badge>
                        )}
                        {getOrphanStatus(student) === "yatim_piatu" && (
                          <Badge className="bg-red-100 text-red-700 border border-red-200">Yatim Piatu</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPayModal(student)}
                          className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Banknote size={16} /> Bayar
                        </Button>
                        <Link to={createPageUrl(`StudentDetail?id=${student.id}`)}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye size={16} /> Detail
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Cek Rekap Dialog */}
      <CekRekapDialog open={cekRekapOpen} onOpenChange={setCekRekapOpen} students={students} />

      {/* Payment Modal */}
      <Dialog open={!!payStudent} onOpenChange={() => setPayStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote size={20} /> Input Pembayaran
            </DialogTitle>
          </DialogHeader>
          {payStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden shrink-0">
                  {payStudent.photo_url ? (
                    <img src={payStudent.photo_url} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <User size={24} className="text-[#1e3a5f]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{payStudent.full_name}</p>
                  <p className="text-sm text-slate-500">{payStudent.registration_number}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${paymentStatusColors[payStudent.payment_status || "belum_bayar"]} border text-xs`}>
                      {paymentStatusLabels[payStudent.payment_status || "belum_bayar"]}
                    </Badge>
                    <span className="text-xs text-slate-500">{payStudent.wave}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Target Pembayaran</p>
                  <p className="font-semibold">Rp {getTarget(payStudent).toLocaleString("id-ID")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Tanggal Pembayaran</Label>
                  <Input type="date" value={payForm.payment_date} onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Nominal (Rp)</Label>
                  <Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Catatan</Label>
                  <Textarea value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} rows={2} className="mt-1" />
                </div>
              </div>

              <Button
                onClick={handlePay}
                disabled={createPaymentMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 gap-2"
              >
                {createPaymentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Pembayaran
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}