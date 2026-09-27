import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

// Quick selection button group
function QuickSelect({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
            value === opt
              ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
              : "bg-white text-slate-600 border-slate-300 hover:border-[#1e3a5f]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function BoolToggle({ value, onChange }) {
  return (
    <div className="flex gap-2 mt-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
          value === true
            ? "bg-green-500 text-white border-green-500"
            : "bg-white text-slate-600 border-slate-300 hover:border-green-400"
        }`}
      >
        ✓ Ya
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
          value === false
            ? "bg-red-500 text-white border-red-500"
            : "bg-white text-slate-600 border-slate-300 hover:border-red-400"
        }`}
      >
        ✗ Tidak
      </button>
    </div>
  );
}

function QField({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-slate-700 leading-snug">{label}</Label>
      {children}
    </div>
  );
}

const TABS = [
  { id: "tab1", label: "Latar Belakang", emoji: "📋", fields: ["interview_q25","interview_q26","interview_q1","interview_q2","interview_q10"] },
  { id: "tab2", label: "Kebiasaan & Agama", emoji: "🕌", fields: ["interview_q3","interview_q6","interview_q7","interview_q8","interview_q9","interview_q27","interview_q27_detail","interview_q11","interview_q11_detail"] },
  { id: "tab3", label: "Perilaku & Gawai", emoji: "📱", fields: ["interview_q12","interview_q13","interview_q14","interview_q15","interview_q16","interview_q17","interview_q18","interview_q19","interview_q20"] },
  { id: "tab4", label: "Komitmen", emoji: "🤝", fields: ["interview_q4","interview_q5","interview_q21","interview_q21_reason","interview_q22","interview_q23","interview_q24"] },
];

const BOOL_FIELDS = ["interview_q21","interview_q22","interview_q23","interview_q24"];

const CONDITIONAL_FIELDS = {
  interview_q21_reason: (fd) => fd.interview_q21 === false,
  interview_q11_detail: (fd) => fd.interview_q11 === "Ada",
  interview_q27_detail: (fd) => fd.interview_q27 === "Ada",
};

function isFieldFilled(field, formData) {
  if (CONDITIONAL_FIELDS[field] && !CONDITIONAL_FIELDS[field](formData)) return true;
  const v = formData[field];
  if (BOOL_FIELDS.includes(field)) return v !== undefined && v !== null;
  return v !== undefined && v !== null && v !== "";
}

function getTabFilledCount(tabIdx, formData) {
  const fields = TABS[tabIdx].fields;
  let filled = 0;
  for (const f of fields) {
    if (isFieldFilled(f, formData)) filled++;
  }
  return { filled, total: fields.length };
}

export default function InterviewForm({ formData, setFormData, onAutoSave, onFinish, onNavigateToTab }) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const debounceRef = useRef(null);
  const pendingFinishRef = useRef(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!onAutoSave) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onAutoSave(formData);
    }, 1500);
    return () => clearTimeout(debounceRef.current);
  }, [formData]);

  const allFields = TABS.flatMap(t => t.fields);
  const filled = allFields.filter((f) => isFieldFilled(f, formData)).length;
  const pct = Math.round((filled / allFields.length) * 100);
  const isLastTab = activeTabIdx === TABS.length - 1;

  // Expose navigateToTab for parent
  useEffect(() => {
    if (onNavigateToTab) onNavigateToTab(activeTabIdx);
  }, [activeTabIdx]);

  // When finish is triggered, find first tab with missing
  const handleFinishClick = () => {
    for (let i = 0; i < TABS.length; i++) {
      const { filled: f } = getTabFilledCount(i, formData);
      if (f < TABS[i].fields.length) {
        setActiveTabIdx(i);
        return;
      }
    }
    onFinish();
  };

  const YA_TIDAK_KADANG = ["Ya", "Tidak", "Kadang-kadang"];
  const YA_TIDAK = ["Ya", "Tidak"];
  const PEMERIKSAAN_HP = ["Setiap hari", "Seminggu sekali", "Jarang", "Tidak pernah"];
  const KEINGINAN_OPTS = ["Selalu dipenuhi", "Kadang dipenuhi", "Jarang dipenuhi", "Tidak dipenuhi"];
  const TINGGAL_OPTS = ["Orang Tua Kandung", "Orang Tua Sambung", "Kakek/Nenek/Kerabat Dekat", "Orang Tua Asuh/Angkat"];

  const renderTabContent = () => {
    switch (activeTabIdx) {
      case 0:
        return (
          <div className="space-y-4">
            <QField label="Tinggal dengan siapa?">
              <QuickSelect value={formData.interview_q25 || ""} onChange={(v) => handleChange("interview_q25", v)} options={TINGGAL_OPTS} />
            </QField>
            <QField label="Pengasuh utama siswa?">
              <QuickSelect value={formData.interview_q26 || ""} onChange={(v) => handleChange("interview_q26", v)} options={TINGGAL_OPTS} />
            </QField>
            <QField label="Melalui siapa dan dari mana orangtua/wali mengetahui sekolah kami?">
              <Textarea value={formData.interview_q1 || ""} onChange={(e) => handleChange("interview_q1", e.target.value)} rows={2} placeholder="Contoh: Dari tetangga, brosur, media sosial..." />
            </QField>
            <QField label="Apa alasan utama memilih SMP YPPI Arrahmah?">
              <Textarea value={formData.interview_q2 || ""} onChange={(e) => handleChange("interview_q2", e.target.value)} rows={3} placeholder="Jelaskan alasan memilih sekolah ini..." />
            </QField>
            <QField label="Apakah siswa memiliki prestasi akademik/non akademik?">
              <Textarea value={formData.interview_q10 || ""} onChange={(e) => handleChange("interview_q10", e.target.value)} rows={2} placeholder="Contoh: Juara kelas, lomba sains, dsb..." />
            </QField>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <QField label="Apakah Bapak/Ibu dapat membaca Al-Quran?">
              <QuickSelect value={formData.interview_q3 || ""} onChange={(v) => handleChange("interview_q3", v)} options={YA_TIDAK_KADANG} />
            </QField>
            <QField label="Apakah siswa mengaji di rumah?">
              <QuickSelect value={formData.interview_q6 || ""} onChange={(v) => handleChange("interview_q6", v)} options={YA_TIDAK_KADANG} />
            </QField>
            <QField label="Bagaimana kebiasaan siswa dalam belajar di rumah?">
              <Textarea value={formData.interview_q7 || ""} onChange={(e) => handleChange("interview_q7", e.target.value)} rows={2} placeholder="Contoh: Belajar rutin, perlu diingatkan, dsb..." />
            </QField>
            <QField label="Mata pelajaran yang disukai siswa">
              <Input value={formData.interview_q8 || ""} onChange={(e) => handleChange("interview_q8", e.target.value)} placeholder="Contoh: Matematika, IPA..." />
            </QField>
            <QField label="Mata pelajaran yang tidak disukai siswa">
              <Input value={formData.interview_q9 || ""} onChange={(e) => handleChange("interview_q9", e.target.value)} placeholder="Contoh: Bahasa Inggris..." />
            </QField>
            <QField label="Riwayat penyakit siswa?">
              <QuickSelect
                value={formData.interview_q27 || ""}
                onChange={(v) => handleChange("interview_q27", v)}
                options={["Tidak", "Ada"]}
              />
              {formData.interview_q27 === "Ada" && (
                <Input className="mt-2" value={formData.interview_q27_detail || ""} onChange={(e) => handleChange("interview_q27_detail", e.target.value)} placeholder="Sebutkan riwayat penyakitnya..." />
              )}
            </QField>
            <QField label="Apakah siswa memiliki alergi?">
              <QuickSelect
                value={formData.interview_q11 || ""}
                onChange={(v) => handleChange("interview_q11", v)}
                options={["Tidak ada", "Ada"]}
              />
              {formData.interview_q11 === "Ada" && (
                <Input className="mt-2" value={formData.interview_q11_detail || ""} onChange={(e) => handleChange("interview_q11_detail", e.target.value)} placeholder="Sebutkan jenis alerginya..." />
              )}
            </QField>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <QField label="Keinginan siswa apakah selalu dipenuhi?">
              <QuickSelect value={formData.interview_q12 || ""} onChange={(v) => handleChange("interview_q12", v)} options={KEINGINAN_OPTS} />
            </QField>
            <QField label="Reaksi anak jika tidak dituruti keinginannya?">
              <Textarea value={formData.interview_q13 || ""} onChange={(e) => handleChange("interview_q13", e.target.value)} rows={2} placeholder="Contoh: Diam, menangis, marah, menerima..." />
            </QField>
            <QField label="Tingkat kemandirian siswa dalam aktivitas harian?">
              <Textarea value={formData.interview_q14 || ""} onChange={(e) => handleChange("interview_q14", e.target.value)} rows={2} placeholder="Contoh: Mandiri, perlu bantuan, dsb..." />
            </QField>
            <QField label="Sikap siswa bertemu orang/lingkungan baru?">
              <Textarea value={formData.interview_q15 || ""} onChange={(e) => handleChange("interview_q15", e.target.value)} rows={2} placeholder="Contoh: Mudah bergaul, pemalu, dsb..." />
            </QField>
            <QField label="Uang saku/jajan siswa dalam sehari?">
              <Input value={formData.interview_q16 || ""} onChange={(e) => handleChange("interview_q16", e.target.value)} placeholder="Contoh: Rp 10.000 / Rp 20.000..." />
            </QField>
            <QField label="Apakah siswa memiliki HP pribadi?">
              <QuickSelect value={formData.interview_q17 || ""} onChange={(v) => handleChange("interview_q17", v)} options={YA_TIDAK} />
            </QField>
            <QField label="Seberapa sering HP siswa diperiksa orangtua?">
              <QuickSelect value={formData.interview_q18 || ""} onChange={(v) => handleChange("interview_q18", v)} options={PEMERIKSAAN_HP} />
            </QField>
            <QField label="Orangtua memantau pergaulan siswa di rumah & luar sekolah?">
              <QuickSelect value={formData.interview_q19 || ""} onChange={(v) => handleChange("interview_q19", v)} options={YA_TIDAK_KADANG} />
            </QField>
            <QField label="Orangtua memiliki batasan waktu bermain?">
              <QuickSelect value={formData.interview_q20 || ""} onChange={(v) => handleChange("interview_q20", v)} options={YA_TIDAK_KADANG} />
            </QField>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <QField label="Apakah Bapak/Ibu merokok?">
              <QuickSelect value={formData.interview_q4 || ""} onChange={(v) => handleChange("interview_q4", v)} options={YA_TIDAK} />
            </QField>
            <QField label="Apakah siswa merokok/vape diketahui orangtua?">
              <QuickSelect value={formData.interview_q5 || ""} onChange={(v) => handleChange("interview_q5", v)} options={YA_TIDAK} />
            </QField>
            <QField label="Orangtua mengizinkan siswa ikuti kegiatan keagamaan (Duha, Tahajud, Bukber, Sahur, Giat Sosial)?">
              <BoolToggle value={formData.interview_q21} onChange={(v) => handleChange("interview_q21", v)} />
              {formData.interview_q21 === false && (
                <Textarea className="mt-2" placeholder="Alasan tidak mengizinkan..." value={formData.interview_q21_reason || ""} onChange={(e) => handleChange("interview_q21_reason", e.target.value)} rows={2} />
              )}
            </QField>
            <QField label="Orangtua bersedia siswa mengikuti tata tertib sekolah?">
              <BoolToggle value={formData.interview_q22} onChange={(v) => handleChange("interview_q22", v)} />
            </QField>
            <QField label="Orangtua bersedia memenuhi panggilan sekolah jika ada masalah?">
              <BoolToggle value={formData.interview_q23} onChange={(v) => handleChange("interview_q23", v)} />
            </QField>
            <QField label="Orangtua menerima jika siswa mendapat improvement/point perbaikan sikap?">
              <BoolToggle value={formData.interview_q24} onChange={(v) => handleChange("interview_q24", v)} />
            </QField>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Kelengkapan Pertanyaan</span>
          <span className={`font-semibold ${pct === 100 ? "text-green-600" : "text-[#1e3a5f]"}`}>
            {pct === 100 ? "✓ Lengkap!" : `${filled} / ${allFields.length} (${pct}%)`}
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Tab Header - Stepper style */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map((tab, idx) => {
          const { filled: tabFilled, total: tabTotal } = getTabFilledCount(idx, formData);
          const tabComplete = tabFilled === tabTotal;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabIdx(idx)}
              className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                idx === activeTabIdx
                  ? "bg-[#1e3a5f] text-white shadow-sm"
                  : tabComplete
                  ? "bg-white text-green-600 border border-green-200"
                  : "text-slate-400"
              }`}
            >
              <span className="text-base leading-none mb-0.5">{tab.emoji}</span>
              <span className="leading-tight text-center" style={{ fontSize: "10px" }}>
                {idx !== activeTabIdx && tabComplete ? "✓ Selesai" : tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Title */}
      <div className="px-1">
        <p className="text-sm font-semibold text-[#1e3a5f]">
          {TABS[activeTabIdx].emoji} {TABS[activeTabIdx].label}
        </p>
        <p className="text-xs text-slate-400">Langkah {activeTabIdx + 1} dari {TABS.length}</p>
      </div>

      {/* Content */}
      <div>{renderTabContent()}</div>

      {/* Navigation Buttons */}
      <div className="flex gap-2 pt-2">
        {activeTabIdx > 0 && (
          <button
            type="button"
            onClick={() => setActiveTabIdx((i) => i - 1)}
            className="flex items-center gap-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
        )}
        <div className="flex-1" />
        {isLastTab ? (
          <button
            type="button"
            onClick={handleFinishClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pct === 100
                ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                : "bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white"
            }`}
          >
            <CheckCircle size={16} />
            Selesai
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTabIdx((i) => i + 1)}
            className="flex items-center gap-1 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5a8a] text-white rounded-xl text-sm font-semibold"
          >
            Lanjut <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}