import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users, UserCheck, UserX, Plus, Calendar, Clock,
  ChevronRight, Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function ParentMeeting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    meeting_date: new Date().toISOString().split("T")[0],
    meeting_name: "",
    meeting_time: "",
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 500),
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => base44.entities.MeetingSchedule.list("-meeting_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MeetingSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setIsOpen(false);
      setFormData({ meeting_date: new Date().toISOString().split("T")[0], meeting_name: "", meeting_time: "" });
    },
  });

  const isPresent = (s) => s.meeting_attendance === "hadir_gel1" || s.meeting_attendance === "hadir_gel2";
  const hadirCount = students.filter(isPresent).length;
  const tidakHadirCount = students.length - hadirCount;

  const handleSubmit = () => {
    if (!formData.meeting_name || !formData.meeting_date || !formData.meeting_time) return;
    createMutation.mutate(formData);
  };

  if (studentsLoading || meetingsLoading) {
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
          <h1 className="text-2xl font-bold text-slate-800">Rapat Orang Tua</h1>
          <p className="text-slate-500">Kelola jadwal rapat orang tua</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
          <Plus size={16} /> Tambah Jadwal Rapat
        </Button>
      </div>

      {/* Recap Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Siswa</p>
              <p className="text-2xl font-bold text-blue-600">{students.length}</p>
            </div>
            <Users size={40} className="text-blue-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Hadir</p>
              <p className="text-2xl font-bold text-green-600">{hadirCount}</p>
            </div>
            <UserCheck size={40} className="text-green-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tidak Hadir</p>
              <p className="text-2xl font-bold text-red-600">{tidakHadirCount}</p>
            </div>
            <UserX size={40} className="text-red-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Meeting Schedule List */}
      {meetings.length === 0 ? (
        <Card className="p-12 border-0 shadow-md text-center">
          <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">Belum ada jadwal rapat. Klik "Tambah Jadwal Rapat" untuk membuat baru.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Card
              key={meeting.id}
              className="p-4 border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(createPageUrl(`MeetingDetail?id=${meeting.id}`))}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1e3a5f]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={22} className="text-[#1e3a5f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{meeting.meeting_name}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {meeting.meeting_date && format(new Date(meeting.meeting_date), "d MMM yyyy", { locale: id })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {meeting.meeting_time}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Meeting Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal Rapat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tanggal Rapat</Label>
              <Input
                type="date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nama Rapat</Label>
              <Input
                value={formData.meeting_name}
                onChange={(e) => setFormData({ ...formData, meeting_name: e.target.value })}
                placeholder="Contoh: Rapat Gelombang 1"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Jam Pelaksanaan</Label>
              <Input
                type="time"
                value={formData.meeting_time}
                onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !formData.meeting_name || !formData.meeting_time}
              className="w-full bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
            >
              {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}