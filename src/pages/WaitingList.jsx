import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Search, UserPlus, ArrowRight, Save, Loader2, Trash2, Clock, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function WaitingList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: waitingList = [], isLoading } = useQuery({
    queryKey: ["waitingList"],
    queryFn: () => base44.entities.WaitingList.filter({ converted_to_student: false }, "-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WaitingList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      setIsOpen(false);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WaitingList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (wl) => {
      await base44.entities.WaitingList.update(wl.id, { converted_to_student: true });
      return wl;
    },
    onSuccess: (wl) => {
      queryClient.invalidateQueries({ queryKey: ["waitingList"] });
      navigate(createPageUrl(`Registration?wl_name=${encodeURIComponent(wl.full_name)}`));
    },
  });

  const formatWaNumber = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("62")) return cleaned;
    if (cleaned.startsWith("0")) return "62" + cleaned.slice(1);
    if (cleaned.startsWith("8")) return "62" + cleaned;
    return cleaned;
  };

  const handleWaClick = (wl) => {
    const waNumber = formatWaNumber(wl.phone);
    if (!waNumber) return;
    const message = `Halo Bapak/Ibu dari ${wl.full_name}, kami dari Panitia PPDB SMP YPPI Arrahmah ingin menginformasikan bahwa ada slot tersedia untuk pendaftaran. Mohon segera menghubungi kami untuk proses lanjutan. Terima kasih.`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const filteredList = waitingList.filter((wl) =>
    wl.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    wl.phone?.includes(search) ||
    wl.previous_school?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      converted_to_student: false,
      waiting_date: formData.waiting_date || new Date().toISOString().split("T")[0],
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Waiting List</h1>
          <p className="text-slate-500">{waitingList.length} calon siswa dalam daftar tunggu</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
          <UserPlus size={16} />
          Tambah ke WL
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 border-0 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Cari nama, nomor HP, atau sekolah asal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>No</TableHead>
                <TableHead>Tanggal WL</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Asal Sekolah</TableHead>
                <TableHead>No. WA/HP</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <Clock size={48} className="mx-auto mb-2 opacity-50" />
                    Tidak ada data waiting list
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((wl, index) => (
                  <TableRow key={wl.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      {wl.waiting_date && format(new Date(wl.waiting_date), "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="font-medium">{wl.full_name}</TableCell>
                    <TableCell>{wl.previous_school || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{wl.phone}</TableCell>
                    <TableCell className="max-w-xs truncate">{wl.notes || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWaClick(wl)}
                          disabled={!wl.phone}
                          className="gap-1 border-green-300 text-green-700 hover:bg-green-50"
                          title="Kirim WhatsApp"
                        >
                          <MessageCircle size={14} />
                          WA
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => convertMutation.mutate(wl)}
                          disabled={convertMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 gap-1"
                        >
                          {convertMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ArrowRight size={14} />
                          )}
                          Pindah ke Pendaftaran
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(wl.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah ke Waiting List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal WL</Label>
              <Input
                type="date"
                value={formData.waiting_date || new Date().toISOString().split("T")[0]}
                onChange={(e) => setFormData({ ...formData, waiting_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={formData.full_name || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nama lengkap calon siswa"
              />
            </div>

            <div className="space-y-2">
              <Label>Asal Sekolah</Label>
              <Input
                value={formData.previous_school || ""}
                onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                placeholder="Nama sekolah asal"
              />
            </div>

            <div className="space-y-2">
              <Label>No. WA/Handphone *</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !formData.full_name || !formData.phone}
              className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}