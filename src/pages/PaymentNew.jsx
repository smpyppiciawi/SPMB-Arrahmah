import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, CreditCard, User, Save, Loader2, Banknote, Plus, Trash2, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import TransactionHistory from "../components/payment/TransactionHistory";

const SPECIAL_COST = 610000;
const WAVE1_COST = 1815000;
const WAVE2_COST = 2265000;

const statusColors = {
  belum_bayar: "bg-gray-100 text-gray-600 border-gray-200",
  dp: "bg-yellow-100 text-yellow-600 border-yellow-200",
  lunas: "bg-green-100 text-green-600 border-green-200",
  yatim: "bg-purple-100 text-purple-600 border-purple-200",
  beasiswa: "bg-blue-100 text-blue-600 border-blue-200",
};

const statusLabels = {
  belum_bayar: "Belum Bayar",
  dp: "DP",
  lunas: "Lunas",
  yatim: "Yatim",
  beasiswa: "Beasiswa",
};

export default function Payment() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({});

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 200),
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => base44.entities.Payment.list("-payment_date", 500),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setShowAddPayment(false);
      setPaymentForm({});
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || student.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStudentPayments = (studentId) => {
    return allPayments
      .filter(p => p.student_id === studentId)
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  };

  const getTotalPaid = (studentId) => {
    return getStudentPayments(studentId).reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const getPaymentTarget = (student) => {
    if (!student) return 0;

    // Prioritaskan override manual (beasiswa/keringanan khusus)
    if (student.total_cost_override > 0) return student.total_cost_override;

    // Yatim & Beasiswa → biaya khusus
    if (student.payment_status === "yatim" || student.payment_status === "beasiswa") return SPECIAL_COST;

    // Ikuti gelombang siswa, tanpa mempertimbangkan bulan saat ini
    if (student.wave === "Gelombang 1") return WAVE1_COST;
    if (student.wave === "Gelombang 2") return WAVE2_COST;

    return 0;
  };

  const calculatePaymentStatus = (totalPaid, student) => {
    if (!student) return "belum_bayar";
    // Jangan override status yatim/beasiswa
    if (student.payment_status === "yatim" || student.payment_status === "beasiswa") return student.payment_status;
    if (totalPaid === 0) return "belum_bayar";
    const target = getPaymentTarget(student);
    if (totalPaid >= target) return "lunas";
    return "dp";
  };

  const openModal = async (student) => {
    // Auto-set yatim status if orphan and not yet set
    const orphan = getOrphanStatus(student);
    let resolvedStudent = student;
    if ((orphan === "yatim" || orphan === "yatim_piatu") && (!student.payment_status || student.payment_status === "belum_bayar")) {
      await updateStudentMutation.mutateAsync({ id: student.id, data: { payment_status: "yatim" } });
      resolvedStudent = { ...student, payment_status: "yatim" };
    }
    setSelectedStudent(resolvedStudent);
    setShowAddPayment(false);
    setPaymentForm({
      payment_date: new Date().toISOString().split("T")[0],
      amount: "",
      notes: "",
    });
  };

  // Determine if student is yatim/yatim-piatu based on parent job
  const getOrphanStatus = (student) => {
    const fatherDead = student.father_job === "Sudah Meninggal";
    const motherDead = student.mother_job === "Sudah Meninggal";
    if (fatherDead && motherDead) return "yatim_piatu";
    if (fatherDead) return "yatim";
    if (motherDead) return "piatu";
    return null;
  };

  // If student is yatim or yatim_piatu, they get yatim payment category
  const resolveInitialPaymentStatus = (student) => {
    const orphan = getOrphanStatus(student);
    if ((orphan === "yatim" || orphan === "yatim_piatu") && (!student.payment_status || student.payment_status === "belum_bayar")) {
      return "yatim";
    }
    return student.payment_status || "belum_bayar";
  };

  const handleAddPayment = async () => {
    if (!paymentForm.payment_date || !paymentForm.amount) {
      alert("Tanggal dan nominal pembayaran wajib diisi");
      return;
    }

    const currentTotal = getTotalPaid(selectedStudent.id);
    const newTotal = currentTotal + Number(paymentForm.amount);
    const newPaymentStatus = calculatePaymentStatus(newTotal, selectedStudent);
    
    // If lunas, also set student registration status to "accepted"
    const updateData = { payment_status: newPaymentStatus };
    if (newPaymentStatus === "lunas") {
      updateData.status = "accepted";
    }

    await createPaymentMutation.mutateAsync({
      student_id: selectedStudent.id,
      payment_date: paymentForm.payment_date,
      amount: Number(paymentForm.amount),
      notes: paymentForm.notes,
    });
    
    await updateStudentMutation.mutateAsync({
      id: selectedStudent.id,
      data: updateData,
    });
    
    // Reload selected student data
    const updatedStudents = await base44.entities.Student.filter({ id: selectedStudent.id });
    if (updatedStudents[0]) {
      setSelectedStudent(updatedStudents[0]);
    }
  };

  const handleUpdateStatus = async (status) => {
    await updateStudentMutation.mutateAsync({
      id: selectedStudent.id,
      data: { payment_status: status },
    });
    const updatedStudents = await base44.entities.Student.filter({ id: selectedStudent.id });
    if (updatedStudents[0]) setSelectedStudent(updatedStudents[0]);
  };

  const handleUpdateWave = async (wave) => {
    if (!window.confirm(`Ubah gelombang siswa ini ke "${wave}"? Ini juga akan memperbarui data gelombang siswa.`)) return;
    await updateStudentMutation.mutateAsync({
      id: selectedStudent.id,
      data: { wave },
    });
    const updatedStudents = await base44.entities.Student.filter({ id: selectedStudent.id });
    if (updatedStudents[0]) setSelectedStudent(updatedStudents[0]);
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm("Yakin ingin menghapus data pembayaran ini?")) {
      const paymentToDelete = allPayments.find(p => p.id === paymentId);
      const currentTotal = getTotalPaid(selectedStudent.id);
      const newTotal = currentTotal - (paymentToDelete?.amount || 0);
      const newStatus = calculatePaymentStatus(newTotal, selectedStudent);
      
      await deletePaymentMutation.mutateAsync(paymentId);
      
      await updateStudentMutation.mutateAsync({
        id: selectedStudent.id,
        data: { payment_status: newStatus },
      });
      
      const updatedStudents = await base44.entities.Student.filter({ id: selectedStudent.id });
      if (updatedStudents[0]) {
        setSelectedStudent(updatedStudents[0]);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const studentIds = students.map(s => s.id);
  const validPayments = allPayments.filter(p => studentIds.includes(p.student_id));
  
  const stats = {
    total: students.length,
    belum_bayar: students.filter(s => s.payment_status === "belum_bayar" || !s.payment_status).length,
    dp: students.filter(s => s.payment_status === "dp").length,
    lunas: students.filter(s => s.payment_status === "lunas").length,
    yatim: students.filter(s => s.payment_status === "yatim").length,
    beasiswa: students.filter(s => s.payment_status === "beasiswa").length,
    totalCollected: validPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pembiayaan</h1>
        <p className="text-slate-500">Kelola status pembayaran siswa</p>
      </div>

      {/* Stats - always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-xs text-slate-600">Total</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-xs text-slate-600">Lunas</p>
          <p className="text-2xl font-bold text-green-600">{stats.lunas}</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-xs text-slate-600">DP</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.dp}</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
          <p className="text-xs text-slate-600">Belum Bayar</p>
          <p className="text-2xl font-bold text-gray-600">{stats.belum_bayar}</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-xs text-slate-600">Yatim</p>
          <p className="text-2xl font-bold text-purple-600">{stats.yatim}</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-sky-50 to-sky-100">
          <p className="text-xs text-slate-600">Beasiswa</p>
          <p className="text-2xl font-bold text-sky-600">{stats.beasiswa}</p>
        </Card>
        <Card className="p-3 border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 lg:col-span-1">
          <p className="text-xs text-slate-600">Terkumpul</p>
          <p className="text-sm font-bold text-emerald-600">
            Rp {stats.totalCollected.toLocaleString("id-ID")}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="pembayaran">
        <TabsList className="mb-2">
          <TabsTrigger value="pembayaran" className="gap-2">
            <CreditCard size={16} />
            Pembayaran Siswa
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="gap-2">
            <List size={16} />
            Riwayat Transaksi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="riwayat">
          <TransactionHistory payments={allPayments} students={students} />
        </TabsContent>

        <TabsContent value="pembayaran">
      {/* Filters */}
      <Card className="p-4 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Cari nama atau nomor pendaftaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
              <SelectItem value="dp">DP</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
              <SelectItem value="yatim">Yatim</SelectItem>
              <SelectItem value="beasiswa">Beasiswa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const totalPaid = getTotalPaid(student.id);
          return (
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
                    {totalPaid > 0 && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Rp {totalPaid.toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                  <Badge className={`${statusColors[student.payment_status || "belum_bayar"]} border`}>
                    {statusLabels[student.payment_status || "belum_bayar"]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Pembayaran
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (() => {
            const totalPaid = getTotalPaid(selectedStudent.id);
            const target = getPaymentTarget(selectedStudent);
            const remaining = Math.max(0, target - totalPaid);
            const isSpecial = selectedStudent.payment_status === "yatim" || selectedStudent.payment_status === "beasiswa";
            
            return (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedStudent.photo_url ? (
                      <img src={selectedStudent.photo_url} alt="" className="w-12 h-12 object-cover" />
                    ) : (
                      <User size={24} className="text-[#1e3a5f]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{selectedStudent.full_name}</p>
                    <p className="text-sm text-slate-500">{selectedStudent.registration_number}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Ubah Gelombang */}
                      <Select value={selectedStudent.wave || ""} onValueChange={handleUpdateWave}>
                        <SelectTrigger className="w-36 h-7 text-xs">
                          <SelectValue placeholder="Gelombang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Gelombang 1">Gelombang 1</SelectItem>
                          <SelectItem value="Gelombang 2">Gelombang 2</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Status Pembayaran */}
                      <Select
                        value={selectedStudent.payment_status || "belum_bayar"}
                        onValueChange={handleUpdateStatus}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                          <SelectItem value="dp">DP</SelectItem>
                          <SelectItem value="lunas">Lunas</SelectItem>
                          <SelectItem value="yatim">Yatim</SelectItem>
                          <SelectItem value="beasiswa">Beasiswa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isSpecial && (
                      <p className="text-xs text-purple-600 mt-1">
                        ✓ Total biaya Rp {SPECIAL_COST.toLocaleString("id-ID")} · Tidak terpengaruh perubahan gelombang
                      </p>
                    )}
                  </div>
                </div>

                {target > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Biaya:</span>
                      <span className="font-semibold text-slate-800">
                        Rp {target.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Sudah Dibayar:</span>
                      <span className="font-semibold text-green-600">
                        Rp {totalPaid.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Sisa:</span>
                      <span className="font-semibold text-red-600">
                        Rp {remaining.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalPaid / target) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Riwayat Pembayaran */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Riwayat Pembayaran</h3>
                  <Button
                    size="sm"
                    onClick={() => setShowAddPayment(!showAddPayment)}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <Plus size={16} />
                    Tambah Biaya
                  </Button>
                </div>

                {showAddPayment && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label className="text-sm">Tanggal Pembayaran</Label>
                        <Input
                          type="date"
                          value={paymentForm.payment_date || ""}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Nominal (Rp)</Label>
                        <Input
                          type="number"
                          value={paymentForm.amount || ""}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Catatan</Label>
                        <Textarea
                          value={paymentForm.notes || ""}
                          onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                          placeholder="Catatan pembayaran..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddPayment(false)}
                          className="flex-1"
                        >
                          Batal
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddPayment}
                          disabled={createPaymentMutation.isPending || !paymentForm.amount}
                          className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                        >
                          {createPaymentMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          Simpan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>No</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getStudentPayments(selectedStudent.id).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                            Belum ada pembayaran
                          </TableCell>
                        </TableRow>
                      ) : (
                        getStudentPayments(selectedStudent.id).map((payment, index) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              {format(new Date(payment.payment_date), "d MMM yyyy", { locale: id })}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              Rp {payment.amount?.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {payment.notes || "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePayment(payment.id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                  <span className="font-semibold text-slate-800">Total Pembayaran:</span>
                  <span className="text-xl font-bold text-green-600">
                    Rp {totalPaid.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}