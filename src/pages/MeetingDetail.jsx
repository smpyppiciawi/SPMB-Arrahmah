import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Users, Plus, Trash2, CheckCheck, Loader2,
  Calendar, Clock, Search, UserCheck, UserX
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function MeetingDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get("id");
  const [search, setSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");

  const wasPresentBefore = (student) =>
    student.meeting_attendance === "hadir_gel1" || student.meeting_attendance === "hadir_gel2";

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: async () => {
      const meetings = await base44.entities.MeetingSchedule.filter({ id: meetingId });
      return meetings[0];
    },
    enabled: !!meetingId,
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ["meeting-participants", meetingId],
    queryFn: () => base44.entities.MeetingParticipant.filter({ meeting_id: meetingId }, "-created_date", 500),
    enabled: !!meetingId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("-created_date", 500),
  });

  const addParticipantMutation = useMutation({
    mutationFn: (data) => base44.entities.MeetingParticipant.create(data),
  });

  const removeParticipantMutation = useMutation({
    mutationFn: (id) => base44.entities.MeetingParticipant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-participants", meetingId] });
    },
  });

  const toggleAttendanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MeetingParticipant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-participants", meetingId] });
    },
  });

  const participantStudentIds = new Set(participants.map(p => p.student_id));
  const availableStudents = students.filter(s => !participantStudentIds.has(s.id));

  const filteredAvailable = availableStudents.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.registration_number?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (studentId) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedStudents(new Set(filteredAvailable.map(s => s.id)));
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  const parseRegNum = (s) => {
    const match = s.match(/(\d+)$/);
    return match ? parseInt(match[1]) : parseInt(s);
  };

  const addByRange = async () => {
    if (!rangeStart || !rangeEnd) return;
    const startNum = parseRegNum(rangeStart);
    const endNum = parseRegNum(rangeEnd);
    if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
      alert("Nomor tidak valid. Pastikan format benar (contoh: 169 atau P262707-169)");
      return;
    }
    const matching = availableStudents.filter(s => {
      const num = parseRegNum(s.registration_number || "");
      return !isNaN(num) && num >= startNum && num <= endNum;
    });
    if (matching.length === 0) {
      alert("Tidak ditemukan siswa pada rentang nomor tersebut.");
      return;
    }
    for (const s of matching) {
      await addParticipantMutation.mutateAsync({
        meeting_id: meetingId,
        student_id: s.id,
        student_name: s.full_name,
        registration_number: s.registration_number,
        wave: s.wave,
        attended: wasPresentBefore(s),
      });
    }
    queryClient.invalidateQueries({ queryKey: ["meeting-participants", meetingId] });
    setRangeStart("");
    setRangeEnd("");
  };

  const addSelected = async () => {
    for (const studentId of selectedStudents) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        await addParticipantMutation.mutateAsync({
          meeting_id: meetingId,
          student_id: student.id,
          student_name: student.full_name,
          registration_number: student.registration_number,
          wave: student.wave,
          attended: wasPresentBefore(student),
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["meeting-participants", meetingId] });
    setSelectedStudents(new Set());
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    const numA = parseRegNum(a.registration_number || "");
    const numB = parseRegNum(b.registration_number || "");
    return numA - numB;
  });

  const filteredParticipants = sortedParticipants.filter(p =>
    p.student_name?.toLowerCase().includes(participantSearch.toLowerCase()) ||
    p.registration_number?.toLowerCase().includes(participantSearch.toLowerCase())
  );
  const hadirCount = participants.filter(p => p.attended).length;

  if (isLoading || participantsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!meeting) {
    return <div className="p-8 text-center text-slate-400">Rapat tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate(createPageUrl("ParentMeeting"))} className="gap-2">
          <ArrowLeft size={16} /> Kembali
        </Button>
      </div>

      {/* Meeting Info */}
      <Card className="p-5 border-0 shadow-md">
        <h1 className="text-2xl font-bold text-slate-800">{meeting.meeting_name}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar size={16} />
            {meeting.meeting_date && format(new Date(meeting.meeting_date), "d MMMM yyyy", { locale: id })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {meeting.meeting_time}
          </span>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Peserta</p>
              <p className="text-2xl font-bold text-blue-600">{participants.length}</p>
            </div>
            <Users size={32} className="text-blue-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Hadir</p>
              <p className="text-2xl font-bold text-green-600">{hadirCount}</p>
            </div>
            <UserCheck size={32} className="text-green-600 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Belum Hadir</p>
              <p className="text-2xl font-bold text-red-600">{participants.length - hadirCount}</p>
            </div>
            <UserX size={32} className="text-red-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Add Participants Panel */}
      {!showAddPanel ? (
        <Button onClick={() => setShowAddPanel(true)} className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
          <Plus size={16} /> Tambah Peserta
        </Button>
      ) : (
        <Card className="p-4 border-0 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Tambah Peserta Rapat</h3>
            <Button variant="ghost" size="sm" onClick={() => { setShowAddPanel(false); setSelectedStudents(new Set()); }}>Tutup</Button>
          </div>

          {/* Add by Range */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <p className="text-sm font-medium text-slate-700">Tambah berdasarkan Nomor Pendaftaran</p>
            <div className="flex items-center gap-2">
              <Input placeholder="Dari (contoh: 169)" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="flex-1" />
              <span className="text-slate-400">—</span>
              <Input placeholder="Sampai (contoh: 175)" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="flex-1" />
              <Button
                onClick={addByRange}
                disabled={!rangeStart || !rangeEnd || addParticipantMutation.isPending}
                className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-1 shrink-0"
              >
                {addParticipantMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah
              </Button>
            </div>
          </div>

          {/* Add by Checkbox */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Pilih Peserta ({selectedStudents.size} dipilih)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} className="gap-1">
                  <CheckCheck size={14} /> Pilih Semua
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>Kosongkan</Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Cari nama atau nomor pendaftaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-72 overflow-y-auto border rounded-xl divide-y">
              {filteredAvailable.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Semua siswa sudah menjadi peserta</div>
              ) : (
                filteredAvailable.map(student => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleSelect(student.id)}
                  >
                    <Checkbox checked={selectedStudents.has(student.id)} onCheckedChange={() => toggleSelect(student.id)} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-800">{student.full_name}</p>
                      <p className="text-xs text-slate-400">{student.registration_number} · {student.previous_school}</p>
                    </div>
                    {student.wave && <Badge className="bg-[#d4af37]/20 text-[#1e3a5f] border-0 text-xs">{student.wave}</Badge>}
                  </div>
                ))
              )}
            </div>
            {selectedStudents.size > 0 && (
              <Button
                onClick={addSelected}
                disabled={addParticipantMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 gap-2"
              >
                {addParticipantMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Tambahkan {selectedStudents.size} Peserta
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Participant List */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800">Daftar Peserta ({participants.length})</h3>
        </div>
        <div className="p-3 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Cari peserta..."
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {sortedParticipants.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users size={40} className="mx-auto mb-2 opacity-50" />
              Belum ada peserta. Klik "Tambah Peserta" untuk menambahkan.
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Tidak ada peserta ditemukan</div>
          ) : (
            filteredParticipants.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                <span className="text-sm text-slate-400 font-mono w-8 shrink-0">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800">{p.student_name}</p>
                  <p className="text-xs text-slate-400">{p.registration_number}</p>
                </div>
                {p.wave && <Badge className="bg-[#d4af37]/20 text-[#1e3a5f] border-0 text-xs">{p.wave}</Badge>}
                <button
                  onClick={() => toggleAttendanceMutation.mutate({ id: p.id, data: { attended: !p.attended } })}
                  disabled={toggleAttendanceMutation.isPending}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                    p.attended
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-500 border-gray-200 hover:border-green-300"
                  }`}
                >
                  {p.attended ? "✓ Hadir" : "Belum Hadir"}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParticipantMutation.mutate(p.id)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}