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
import { Search, BookOpen, User, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function QuranTest() {
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
    const matchStatus = statusFilter === "all" || student.quran_test_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      quran_test_status: student.quran_test_status || "belum",
      quran_test_level: student.quran_test_level || "",
      quran_test_score: student.quran_test_score || "",
      quran_test_notes: student.quran_test_notes || "",
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: selectedStudent.id,
      data: {
        ...formData,
        quran_test_score: formData.quran_test_score ? Number(formData.quran_test_score) : null,
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
    sudah_tes: students.filter(s => s.quran_test_status && s.quran_test_status !== "belum").length,
    belum: students.filter(s => s.quran_test_status === "belum" || !s.quran_test_status).length,
    lulus: students.filter(s => s.quran_test_status === "lulus").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tes Mengaji</h1>
        <p className="text-slate-500">Input hasil tes mengaji siswa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-slate-600">Total Siswa</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-slate-600">Sudah Tes</p>
          <p className="text-2xl font-bold text-purple-600">{stats.sudah_tes}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-slate-600">Belum Tes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.belum}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-slate-600">Lulus</p>
          <p className="text-2xl font-bold text-green-600">{stats.lulus}</p>
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
                  {student.quran_test_score !== undefined && student.quran_test_score !== null && (
                    <p className="text-sm font-medium text-[#1e3a5f] mt-1">
                      Nilai: {student.quran_test_score}
                    </p>
                  )}
                </div>
                <Badge className={`${statusColors[student.quran_test_status || "belum"]} border`}>
                  {statusLabels[student.quran_test_status || "belum"]}
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
              <BookOpen size={20} />
              Input Hasil Tes Mengaji
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
                <label className="text-sm font-medium">Level Mengaji</label>
                <Select
                  value={formData.quran_test_level || ""}
                  onValueChange={(value) => setFormData({ ...formData, quran_test_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iqro 1">Iqro 1</SelectItem>
                    <SelectItem value="Iqro 2">Iqro 2</SelectItem>
                    <SelectItem value="Iqro 3">Iqro 3</SelectItem>
                    <SelectItem value="Iqro 4">Iqro 4</SelectItem>
                    <SelectItem value="Iqro 5">Iqro 5</SelectItem>
                    <SelectItem value="Iqro 6">Iqro 6</SelectItem>
                    <SelectItem value="Al Qur'an">Al Qur'an</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nilai Tes (0-100)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.quran_test_score || ""}
                  onChange={(e) => setFormData({ ...formData, quran_test_score: e.target.value })}
                  placeholder="Masukkan nilai"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status Tes</label>
                <Select
                  value={formData.quran_test_status}
                  onValueChange={(value) => setFormData({ ...formData, quran_test_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum">Belum</SelectItem>
                    <SelectItem value="lulus">Lulus</SelectItem>
                    <SelectItem value="tidak_lulus">Tidak Lulus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan</label>
                <Textarea
                  value={formData.quran_test_notes || ""}
                  onChange={(e) => setFormData({ ...formData, quran_test_notes: e.target.value })}
                  placeholder="Catatan hasil tes mengaji..."
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