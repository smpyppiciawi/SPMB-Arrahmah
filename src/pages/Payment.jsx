import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, CreditCard, User, Save, Loader2, Banknote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  belum_bayar: "bg-gray-100 text-gray-600 border-gray-200",
  dp: "bg-yellow-100 text-yellow-600 border-yellow-200",
  lunas: "bg-green-100 text-green-600 border-green-200",
};

const statusLabels = {
  belum_bayar: "Belum Bayar",
  dp: "DP",
  lunas: "Lunas",
};

export default function Payment() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({});

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setSelectedStudent(null);
    },
  });

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || student.payment_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      payment_status: student.payment_status || "belum_bayar",
      payment_amount: student.payment_amount || "",
      payment_notes: student.payment_notes || "",
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: selectedStudent.id,
      data: {
        ...formData,
        payment_amount: formData.payment_amount ? Number(formData.payment_amount) : null,
      },
    });
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
    belum_bayar: students.filter(s => s.payment_status === "belum_bayar" || !s.payment_status).length,
    dp: students.filter(s => s.payment_status === "dp").length,
    lunas: students.filter(s => s.payment_status === "lunas").length,
    totalAmount: students.reduce((sum, s) => sum + (s.payment_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pembiayaan</h1>
        <p className="text-slate-500">Kelola status pembayaran siswa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Total Siswa</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Belum Bayar</p>
          <p className="text-2xl font-bold text-gray-600">{stats.belum_bayar}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">DP</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.dp}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Lunas</p>
          <p className="text-2xl font-bold text-green-600">{stats.lunas}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm md:col-span-1 col-span-2">
          <p className="text-sm text-slate-500">Total Terkumpul</p>
          <p className="text-xl font-bold text-[#1e3a5f]">
            Rp {stats.totalAmount.toLocaleString("id-ID")}
          </p>
        </Card>
      </div>

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
                  {student.payment_amount > 0 && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Rp {student.payment_amount?.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <Badge className={`${statusColors[student.payment_status || "belum_bayar"]} border`}>
                  {statusLabels[student.payment_status || "belum_bayar"]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Input Pembayaran
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden">
                  {selectedStudent.photo_url ? (
                    <img src={selectedStudent.photo_url} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <User size={24} className="text-[#1e3a5f]" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selectedStudent.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedStudent.registration_number}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status Pembayaran</label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
                    <SelectItem value="dp">DP</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Jumlah Pembayaran (Rp)</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    type="number"
                    min="0"
                    value={formData.payment_amount || ""}
                    onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                    placeholder="Masukkan jumlah"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea
                  value={formData.payment_notes || ""}
                  onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
                  placeholder="Catatan pembayaran..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Simpan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}