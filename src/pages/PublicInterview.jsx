import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, User, ArrowLeft, Loader2, CheckCircle, GraduationCap, ClipboardList, AlertCircle, LogOut, WifiOff, Clock } from "lucide-react";
import InterviewForm from "../components/interview/InterviewForm";

const LOCK_KEY_PREFIX = "interview_lock_";
const OFFLINE_QUEUE_KEY = "interview_offline_queue";

const ALL_QUESTION_FIELDS = [
  "interview_q1","interview_q2","interview_q3","interview_q4","interview_q5",
  "interview_q6","interview_q7","interview_q8","interview_q9","interview_q10",
  "interview_q11","interview_q11_detail","interview_q12","interview_q13","interview_q14",
  "interview_q15","interview_q16","interview_q17","interview_q18","interview_q19",
  "interview_q20","interview_q21","interview_q22","interview_q23","interview_q24",
  "interview_q25","interview_q26","interview_q27","interview_q27_detail",
];

// --- Offline Queue Manager ---
function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]"); }
  catch { return []; }
}
function addToOfflineQueue(entry) {
  const q = getOfflineQueue();
  // Replace existing entry for same student
  const idx = q.findIndex(e => e.studentId === entry.studentId);
  if (idx >= 0) q[idx] = entry;
  else q.push(entry);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
}
function removeFromOfflineQueue(studentId) {
  const q = getOfflineQueue().filter(e => e.studentId !== studentId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
}
function getOfflineQueueCount() {
  return getOfflineQueue().length;
}

// Process offline queue
async function processOfflineQueue() {
  const q = getOfflineQueue();
  if (q.length === 0) return;
  for (const entry of q) {
    try {
      await base44.entities.Student.update(entry.studentId, entry.data);
      removeFromOfflineQueue(entry.studentId);
    } catch (e) {
      // Keep in queue, try again later
      break;
    }
  }
}

// --- Student List Screen ---
function StudentListScreen({ onSelectStudent, currentUser }) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(getOfflineQueueCount());
  const [showLockedPopup, setShowLockedPopup] = useState(null);

  const fetchStudents = () => {
    base44.entities.Student.list("-created_date", 300)
      .then((data) => { setStudents(data || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); processOfflineQueue(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Process queue on mount if online
    if (navigator.onLine) processOfflineQueue();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(() => {
      fetchStudents();
      setQueueCount(getOfflineQueueCount());
      if (navigator.onLine) processOfflineQueue();
    }, 15000);

    let unsubscribe;
    try {
      unsubscribe = base44.entities.Student.subscribe((event) => {
        if (event.type === 'create') setStudents(prev => [event.data, ...prev]);
        else if (event.type === 'update') setStudents(prev => prev.map(s => s.id === event.id ? event.data : s));
        else if (event.type === 'delete') setStudents(prev => prev.filter(s => s.id !== event.id));
      });
    } catch (e) {}

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const total = students.length;
  const sudah = students.filter(s => s.interview_status === "lulus" || s.interview_status === "tidak_lulus").length;
  const belum = students.filter(s => !s.interview_status || s.interview_status === "belum").length;

  const filtered = students.filter((s) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.previous_school?.toLowerCase().includes(search.toLowerCase())
  );

  const getLockStatus = (id) => {
    try {
      const raw = localStorage.getItem(LOCK_KEY_PREFIX + id);
      if (!raw) return null;
      const { officer, ts } = JSON.parse(raw);
      if (Date.now() - ts > 30 * 60 * 1000) { localStorage.removeItem(LOCK_KEY_PREFIX + id); return null; }
      return officer;
    } catch { return null; }
  };

  const officerName = currentUser?.full_name || currentUser?.email || "Pewawancara";

  const handleStudentClick = (student) => {
    const lockBy = getLockStatus(student.id);
    const sudahWawancara = student.interview_status === "lulus" || student.interview_status === "tidak_lulus";

    if (sudahWawancara) {
      onSelectStudent(student);
      return;
    }

    if (lockBy && lockBy !== officerName) {
      // Locked by another interviewer
      setShowLockedPopup({ studentName: student.full_name, officer: lockBy });
      return;
    }

    onSelectStudent(student);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#d4af37] rounded-full flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-[#1e3a5f]" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Portal Pewawancara</h1>
              <p className="text-white/70 text-xs">Halo, {officerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-xs flex items-center gap-1">
                <WifiOff size={10} /> Offline
              </Badge>
            )}
            {queueCount > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs flex items-center gap-1">
                <Clock size={10} /> {queueCount} pending
              </Badge>
            )}
            <button
              onClick={() => base44.auth.logout()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-xl font-bold">{total}</p>
            <p className="text-white/70 text-xs">Total</p>
          </div>
          <div className="bg-yellow-400/20 rounded-xl p-2 text-center">
            <p className="text-xl font-bold text-yellow-300">{belum}</p>
            <p className="text-yellow-200 text-xs">Belum</p>
          </div>
          <div className="bg-green-400/20 rounded-xl p-2 text-center">
            <p className="text-xl font-bold text-green-300">{sudah}</p>
            <p className="text-green-200 text-xs">Sudah</p>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto pb-24">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#1e3a5f]" size={32} />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle size={48} className="mx-auto mb-2 text-green-400" />
            <p className="font-medium">Tidak ada siswa ditemukan</p>
          </div>
        )}
        {filtered.map((student) => {
          const lockBy = getLockStatus(student.id);
          const sudahWawancara = student.interview_status === "lulus" || student.interview_status === "tidak_lulus";
          const isLockedByOther = lockBy && lockBy !== officerName;
          return (
            <button
              key={student.id}
              onClick={() => handleStudentClick(student)}
              className={`w-full bg-white rounded-xl shadow-sm border p-4 text-left transition-all active:scale-[0.98] ${
                sudahWawancara
                  ? "border-green-200 opacity-70 hover:shadow-md"
                  : isLockedByOther
                  ? "border-yellow-300 bg-yellow-50/50"
                  : "border-slate-200 hover:border-[#1e3a5f]/30 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden shrink-0">
                  {student.photo_url ? (
                    <img src={student.photo_url} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <User size={22} className="text-[#1e3a5f]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{student.full_name}</p>
                  <p className="text-xs text-slate-500">{student.registration_number}</p>
                  <p className="text-xs text-slate-400 truncate">{student.previous_school}</p>
                  {/* Live indicator */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {sudahWawancara ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                        Sudah diwawancara
                      </span>
                    ) : isLockedByOther ? (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block animate-pulse"></span>
                        Sedang diwawancara oleh {lockBy}
                      </span>
                    ) : lockBy ? (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                        Sedang Anda proses
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                        Belum diwawancara
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {sudahWawancara ? (
                    <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">✓ Sudah</Badge>
                  ) : isLockedByOther ? (
                    <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs">🔒 {lockBy}</Badge>
                  ) : lockBy ? (
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">📝 Proses</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-xs">Belum</Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search - di bawah */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 sticky bottom-0 z-10 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, no. pendaftaran, sekolah asal..."
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Locked by Another Popup */}
      {showLockedPopup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <h3 className="font-bold text-slate-800">Siswa Sedang Diproses</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              <strong>{showLockedPopup.studentName}</strong> sedang dalam proses wawancara oleh <strong>{showLockedPopup.officer}</strong>. Silakan pilih siswa lain.
            </p>
            <button
              onClick={() => setShowLockedPopup(null)}
              className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl text-sm font-semibold"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Notes Popup Modal ---
function NotesPopup({ onConfirm, onCancel, isPending }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5">
          <h3 className="font-bold text-slate-800 text-lg mb-1">Catatan Singkat</h3>
          <p className="text-sm text-slate-500 mb-4">Opsional — tambahkan catatan wawancara jika diperlukan.</p>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan hasil wawancara... (opsional)" rows={4} className="mb-4" autoFocus />
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-600">Batal</button>
            <button type="button" onClick={() => onConfirm(notes)} disabled={isPending} className="flex-1 py-3 bg-[#1e3a5f] hover:bg-[#2d5a8a] disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : null} Simpan Wawancara
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Warning Popup (pertanyaan belum terisi) ---
function WarningPopup({ missingCount, missingTabs, onContinue, onCancel, onGoToTab }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <h3 className="font-bold text-slate-800">Pertanyaan Belum Lengkap</h3>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Masih ada <strong>{missingCount} pertanyaan</strong> yang belum diisi pada bagian:
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {missingTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onGoToTab(tab.idx)}
                className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 hover:bg-yellow-100"
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-600">Kembali Isi</button>
            <button type="button" onClick={onContinue} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Tetap Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Exit Confirm Popup ---
function ExitConfirmPopup({ onConfirm, onCancel, isSaving }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800">Yakin Akan Keluar?</h3>
          </div>
          <p className="text-sm text-slate-600 mb-5">
            Data yang sudah diinput akan disimpan sebagai draft. Anda dapat melanjutkan kembali nanti.
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-600">Tidak, Lanjut Isi</button>
            <button onClick={onConfirm} disabled={isSaving} className="flex-1 py-3 bg-[#1e3a5f] hover:bg-[#2d5a8a] disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null} Ya, Simpan Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Interview Form Screen ---
function InterviewScreen({ student, currentUser, onBack, onDone }) {
  const officerName = currentUser?.full_name || currentUser?.email || "Pewawancara";
  const [interviewDate, setInterviewDate] = useState(
    student.interview_date || new Date().toISOString().split("T")[0]
  );
  const [formData, setFormData] = useState({
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

  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [warningInfo, setWarningInfo] = useState({ missingCount: 0, missingTabs: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const activeTabRef = useRef(0);

  useEffect(() => {
    localStorage.setItem(LOCK_KEY_PREFIX + student.id, JSON.stringify({ officer: officerName, ts: Date.now() }));
    return () => { localStorage.removeItem(LOCK_KEY_PREFIX + student.id); };
  }, [student.id, officerName]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const BOOL_FIELDS = ["interview_q21","interview_q22","interview_q23","interview_q24"];
  const isFieldFilled = (f) => {
    const v = formData[f];
    if (BOOL_FIELDS.includes(f)) return v !== undefined && v !== null;
    return v !== undefined && v !== null && v !== "";
  };

  const TAB_FIELDS = [
    { id: "tab1", label: "Latar Belakang", emoji: "📋", fields: ["interview_q25","interview_q26","interview_q1","interview_q2","interview_q10"] },
    { id: "tab2", label: "Kebiasaan & Agama", emoji: "🕌", fields: ["interview_q3","interview_q6","interview_q7","interview_q8","interview_q9","interview_q27","interview_q27_detail","interview_q11","interview_q11_detail"] },
    { id: "tab3", label: "Perilaku & Gawai", emoji: "📱", fields: ["interview_q12","interview_q13","interview_q14","interview_q15","interview_q16","interview_q17","interview_q18","interview_q19","interview_q20"] },
    { id: "tab4", label: "Komitmen", emoji: "🤝", fields: ["interview_q4","interview_q5","interview_q21","interview_q21_reason","interview_q22","interview_q23","interview_q24"] },
  ];

  const doSave = async (data) => {
    setIsSaving(true);
    try {
      if (navigator.onLine) {
        await base44.entities.Student.update(student.id, data);
      } else {
        // Offline — queue
        addToOfflineQueue({ studentId: student.id, data });
      }
      localStorage.removeItem(LOCK_KEY_PREFIX + student.id);
      setIsSaving(false);
      onDone();
    } catch (e) {
      // Fallback to offline queue
      addToOfflineQueue({ studentId: student.id, data });
      localStorage.removeItem(LOCK_KEY_PREFIX + student.id);
      setIsSaving(false);
      onDone();
    }
  };

  const handleAutoSave = (data) => {
    if (navigator.onLine) {
      base44.entities.Student.update(student.id, data).catch(() => {});
    } else {
      addToOfflineQueue({ studentId: student.id, data });
    }
  };

  const handleFinishClick = () => {
    // Check all fields
    const missingTabs = [];
    let totalMissing = 0;
    for (let i = 0; i < TAB_FIELDS.length; i++) {
      const tab = TAB_FIELDS[i];
      let tabMissing = 0;
      for (const f of tab.fields) {
        if (f === "interview_q21_reason" && formData.interview_q21 !== false) continue;
        if (f === "interview_q11_detail" && formData.interview_q11 !== "Ada") continue;
        if (f === "interview_q27_detail" && formData.interview_q27 !== "Ada") continue;
        if (!isFieldFilled(f)) tabMissing++;
      }
      if (tabMissing > 0) {
        missingTabs.push({ ...tab, idx: i, missing: tabMissing });
        totalMissing += tabMissing;
      }
    }

    if (totalMissing > 0) {
      setWarningInfo({ missingCount: totalMissing, missingTabs });
      setShowWarning(true);
    } else {
      setShowNotesPopup(true);
    }
  };

  const handleSaveWithNotes = (notes) => {
    doSave({
      ...formData,
      interview_status: "lulus",
      interview_date: interviewDate,
      interview_notes: notes,
      interview_officer: officerName,
    });
  };

  const handleBack = () => {
    // Check if form has unsaved data
    const hasData = ALL_QUESTION_FIELDS.some((f) => {
      const v = formData[f];
      const orig = student[f];
      if (BOOL_FIELDS.includes(f)) return v !== undefined && v !== null && v !== orig;
      return v !== undefined && v !== null && v !== "" && v !== (orig || "");
    });

    if (hasData) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  const handleExitSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (navigator.onLine) {
        await base44.entities.Student.update(student.id, formData);
      } else {
        addToOfflineQueue({ studentId: student.id, data: formData });
      }
    } catch (e) {
      addToOfflineQueue({ studentId: student.id, data: formData });
    }
    localStorage.removeItem(LOCK_KEY_PREFIX + student.id);
    setIsSaving(false);
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center overflow-hidden shrink-0">
            {student.photo_url ? (
              <img src={student.photo_url} alt="" className="w-10 h-10 object-cover" />
            ) : (
              <User size={20} className="text-[#d4af37]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{student.full_name}</p>
            <p className="text-xs text-white/60">{student.registration_number} · {student.previous_school}</p>
          </div>
          {!isOnline && (
            <Badge className="bg-red-500/30 text-red-200 border-red-400/40 text-xs">
              <WifiOff size={10} className="mr-1" /> Offline
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* Info Pewawancara */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[#1e3a5f]/5 rounded-lg">
            <div className="w-9 h-9 bg-[#1e3a5f] rounded-full flex items-center justify-center shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pewawancara</p>
              <p className="font-semibold text-slate-800">{officerName}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Tanggal Wawancara</label>
            <Input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="mt-1" />
          </div>
        </div>

        {/* Form Detail Pertanyaan */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Detail Pertanyaan Wawancara</p>
          <InterviewForm
            formData={formData}
            setFormData={setFormData}
            onAutoSave={handleAutoSave}
            onFinish={handleFinishClick}
            onNavigateToTab={(idx) => { activeTabRef.current = idx; }}
          />
        </div>
      </div>

      {/* Exit Confirm Popup */}
      {showExitConfirm && (
        <ExitConfirmPopup
          onConfirm={handleExitSaveDraft}
          onCancel={() => setShowExitConfirm(false)}
          isSaving={isSaving}
        />
      )}

      {/* Warning Popup */}
      {showWarning && (
        <WarningPopup
          missingCount={warningInfo.missingCount}
          missingTabs={warningInfo.missingTabs}
          onContinue={() => { setShowWarning(false); setShowNotesPopup(true); }}
          onCancel={() => setShowWarning(false)}
          onGoToTab={(idx) => {
            setShowWarning(false);
            // We can't directly change InterviewForm's tab, so just close the warning
            // The user will see which tabs to fill in the warning
          }}
        />
      )}

      {/* Notes Popup */}
      {showNotesPopup && (
        <NotesPopup
          onConfirm={handleSaveWithNotes}
          onCancel={() => setShowNotesPopup(false)}
          isPending={isSaving}
        />
      )}
    </div>
  );
}

// --- Done Screen ---
function DoneScreen({ studentName, onBack, onlineSaved }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className={`w-20 h-20 ${onlineSaved ? "bg-green-100" : "bg-yellow-100"} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {onlineSaved ? (
            <CheckCircle size={40} className="text-green-500" />
          ) : (
            <Clock size={40} className="text-yellow-500" />
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {onlineSaved ? "Wawancara Tersimpan!" : "Tersimpan (Offline)"}
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          {onlineSaved
            ? `Data wawancara ${studentName} berhasil disimpan ke server.`
            : `Data wawancara ${studentName} disimpan sementara. Akan otomatis terkirim saat koneksi tersedia.`}
        </p>
        <button onClick={onBack} className="w-full h-12 bg-[#1e3a5f] text-white rounded-xl font-semibold">
          ← Kembali ke Daftar
        </button>
      </div>
    </div>
  );
}

// --- Loading Screen ---
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 bg-[#d4af37] rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={32} className="text-[#1e3a5f]" />
        </div>
        <Loader2 size={28} className="animate-spin mx-auto mt-4" />
      </div>
    </div>
  );
}

// --- Access Denied Screen ---
function AccessDeniedScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 text-sm mb-6">Akun Anda tidak memiliki akses ke Portal Pewawancara. Hubungi admin untuk mendapatkan role <strong>interviewer</strong>.</p>
        <button onClick={() => base44.auth.logout()} className="w-full h-12 bg-[#1e3a5f] text-white rounded-xl font-semibold">Keluar</button>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function PublicInterview() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [done, setDone] = useState(false);
  const [lastStudentName, setLastStudentName] = useState("");
  const [onlineSaved, setOnlineSaved] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((user) => { setCurrentUser(user); setIsLoading(false); })
      .catch(() => { base44.auth.redirectToLogin(window.location.href); });
  }, []);

  if (isLoading) return <LoadingScreen />;

  const allowedRoles = ["admin", "user", "interviewer"];
  if (currentUser && !allowedRoles.includes(currentUser.role)) {
    return <AccessDeniedScreen />;
  }

  if (done) return <DoneScreen studentName={lastStudentName} onBack={() => { setSelectedStudent(null); setDone(false); }} onlineSaved={onlineSaved} />;

  if (selectedStudent) return (
    <InterviewScreen
      student={selectedStudent}
      currentUser={currentUser}
      onBack={() => setSelectedStudent(null)}
      onDone={() => {
        setLastStudentName(selectedStudent?.full_name || "");
        setOnlineSaved(navigator.onLine);
        setSelectedStudent(null);
        setDone(true);
      }}
    />
  );

  return <StudentListScreen onSelectStudent={(s) => { setSelectedStudent(s); setDone(false); }} currentUser={currentUser} />;
}