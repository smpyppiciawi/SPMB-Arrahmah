import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Shirt, User, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export default function UniformMeasurement() {
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

  const hasUniform = (student) => student.uniform_batik_size || student.uniform_sport_size;

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "done" && hasUniform(student)) ||
      (statusFilter === "pending" && !hasUniform(student));
    return matchSearch && matchStatus;
  });

  const openModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      uniform_batik_size: student.uniform_batik_size || "",
      uniform_sport_size: student.uniform_sport_size || "",
      uniform_pangsi_size: student.uniform_pangsi_size || "",
      uniform_kebaya_size: student.uniform_kebaya_size || "",
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: selectedStudent.id,
      data: formData,
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
    done: students.filter(s => hasUniform(s)).length,
    pending: students.filter(s => !hasUniform(s)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ukur Baju</h1>
        <p className="text-slate-500">Input ukuran seragam siswa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Total Siswa</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Sudah Diukur</p>
          <p className="text-2xl font-bold text-green-600">{stats.done}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Belum Diukur</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="done">Sudah Diukur</SelectItem>
              <SelectItem value="pending">Belum Diukur</SelectItem>
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
                  <p className="text-xs text-slate-500 mt-1">{student.gender}</p>
                </div>
                <Badge className={hasUniform(student) ? "bg-green-100 text-green-600 border-green-200 border" : "bg-gray-100 text-gray-600 border-gray-200 border"}>
                  {hasUniform(student) ? "Sudah" : "Belum"}
                </Badge>
              </div>
              {hasUniform(student) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {student.uniform_batik_size && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      Batik: {student.uniform_batik_size}
                    </span>
                  )}
                  {student.uniform_sport_size && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
                      Olahraga: {student.uniform_sport_size}
                    </span>
                  )}
                  {student.gender === "Laki-laki" && student.uniform_pangsi_size && (
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">
                      Pangsi: {student.uniform_pangsi_size}
                    </span>
                  )}
                  {student.gender === "Perempuan" && student.uniform_kebaya_size && (
                    <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded">
                      Kebaya: {student.uniform_kebaya_size}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shirt size={20} />
              Input Ukuran Seragam
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
                  <p className="text-sm text-slate-500">{selectedStudent.gender}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ukuran Seragam Batik</label>
                <Select
                  value={formData.uniform_batik_size}
                  onValueChange={(value) => setFormData({ ...formData, uniform_batik_size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ukuran" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ukuran Seragam Olahraga</label>
                <Select
                  value={formData.uniform_sport_size}
                  onValueChange={(value) => setFormData({ ...formData, uniform_sport_size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ukuran" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudent.gender === "Laki-laki" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ukuran Pangsi (Nomor)</label>
                  <Input
                    value={formData.uniform_pangsi_size || ""}
                    onChange={(e) => setFormData({ ...formData, uniform_pangsi_size: e.target.value })}
                    placeholder="Contoh: 38, 40, 42"
                  />
                </div>
              )}

              {selectedStudent.gender === "Perempuan" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ukuran Kebaya (Nomor)</label>
                  <Input
                    value={formData.uniform_kebaya_size || ""}
                    onChange={(e) => setFormData({ ...formData, uniform_kebaya_size: e.target.value })}
                    placeholder="Contoh: 38, 40, 42"
                  />
                </div>
              )}

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