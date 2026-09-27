import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckSquare, User, Save, Loader2, FileCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const documentFields = [
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

export default function DocumentChecklist() {
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

  const countDocuments = (student) => {
    return documentFields.filter(doc => student[doc.key]).length;
  };

  const isComplete = (student) => countDocuments(student) === documentFields.length;

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "complete" && isComplete(student)) ||
      (statusFilter === "incomplete" && !isComplete(student));
    return matchSearch && matchStatus;
  });

  const openModal = (student) => {
    setSelectedStudent(student);
    const docs = {};
    documentFields.forEach(doc => {
      docs[doc.key] = student[doc.key] || false;
    });
    setFormData(docs);
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
    complete: students.filter(s => isComplete(s)).length,
    incomplete: students.filter(s => !isComplete(s)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ceklis Berkas</h1>
        <p className="text-slate-500">Ceklis kelengkapan berkas siswa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Total Siswa</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Berkas Lengkap</p>
          <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <p className="text-sm text-slate-500">Belum Lengkap</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.incomplete}</p>
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
              <SelectItem value="complete">Lengkap</SelectItem>
              <SelectItem value="incomplete">Belum Lengkap</SelectItem>
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
                </div>
                <Badge className={isComplete(student) ? "bg-green-100 text-green-600 border-green-200 border" : "bg-yellow-100 text-yellow-600 border-yellow-200 border"}>
                  {countDocuments(student)}/{documentFields.length}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(countDocuments(student) / documentFields.length) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare size={20} />
              Ceklis Berkas
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

              <div className="space-y-3">
                {documentFields.map((doc) => (
                  <div
                    key={doc.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${formData[doc.key] ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}
                  >
                    <Checkbox
                      id={doc.key}
                      checked={formData[doc.key] || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, [doc.key]: checked })
                      }
                    />
                    <label htmlFor={doc.key} className="flex-1 cursor-pointer">
                      {doc.label}
                    </label>
                    {formData[doc.key] && (
                      <FileCheck size={18} className="text-green-500" />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-sm text-slate-500 text-center">
                  {Object.values(formData).filter(Boolean).length} dari {documentFields.length} berkas terkumpul
                </p>
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