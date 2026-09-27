import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, BarChart3, Search } from "lucide-react";

const COLUMN_GROUPS = [
  {
    group: "Data Pribadi",
    fields: [
      { key: "gender", label: "Jenis Kelamin" },
      { key: "birth_place", label: "Tempat Lahir" },
      { key: "birth_date", label: "Tanggal Lahir" },
      { key: "religion", label: "Agama" },
      { key: "citizenship", label: "Kewarganegaraan" },
      { key: "child_order", label: "Anak Ke-" },
      { key: "siblings_count", label: "Jumlah Saudara" },
      { key: "address", label: "Alamat" },
      { key: "village", label: "Kelurahan" },
      { key: "district", label: "Kecamatan" },
      { key: "city", label: "Kota/Kabupaten" },
      { key: "province", label: "Provinsi" },
      { key: "postal_code", label: "Kode Pos" },
      { key: "phone", label: "No. Telepon" },
      { key: "kip_kps_pkh", label: "KIP/KPS/PKH" },
    ],
  },
  {
    group: "Data Orang Tua",
    fields: [
      { key: "father_name", label: "Nama Ayah" },
      { key: "father_education", label: "Pendidikan Ayah" },
      { key: "father_job", label: "Pekerjaan Ayah" },
      { key: "father_income", label: "Penghasilan Ayah" },
      { key: "father_phone", label: "HP Ayah" },
      { key: "mother_name", label: "Nama Ibu" },
      { key: "mother_education", label: "Pendidikan Ibu" },
      { key: "mother_job", label: "Pekerjaan Ibu" },
      { key: "mother_income", label: "Penghasilan Ibu" },
      { key: "mother_phone", label: "HP Ibu" },
      { key: "guardian_name", label: "Nama Wali" },
      { key: "guardian_relation", label: "Hubungan Wali" },
      { key: "guardian_phone", label: "HP Wali" },
    ],
  },
  {
    group: "Data Sekolah",
    fields: [
      { key: "previous_school", label: "Asal Sekolah" },
      { key: "previous_school_type", label: "Jenis Sekolah" },
      { key: "graduation_year", label: "Tahun Lulus" },
    ],
  },
  {
    group: "Status & Proses",
    fields: [
      { key: "status", label: "Status Pendaftaran" },
      { key: "wave", label: "Gelombang" },
      { key: "interview_status", label: "Status Wawancara" },
      { key: "quran_test_status", label: "Status Tes Mengaji" },
      { key: "payment_status", label: "Status Pembayaran" },
      { key: "meeting_attendance", label: "Kehadiran Rapat" },
      { key: "_orphan", label: "Yatim/Piatu" },
    ],
  },
  {
    group: "Seragam",
    fields: [
      { key: "uniform_batik_size", label: "Ukuran Batik" },
      { key: "uniform_sport_size", label: "Ukuran Olahraga" },
    ],
  },
];

const DEFAULT_COLUMNS = ["full_name", "registration_number", "nisn"];
const DEFAULT_LABELS = {
  full_name: "Nama",
  registration_number: "No. Pendaftaran",
  nisn: "NISN",
};

const getOrphanStatus = (s) => {
  const fatherDead = s.father_job === "Sudah Meninggal";
  const motherDead = s.mother_job === "Sudah Meninggal";
  if (fatherDead && motherDead) return "Yatim Piatu";
  if (fatherDead) return "Yatim";
  if (motherDead) return "Piatu";
  return "Tidak";
};

const getFieldValue = (student, key) => {
  if (key === "_orphan") return getOrphanStatus(student);
  const v = student[key];
  if (typeof v === "boolean") return v ? "Ya" : "Tidak";
  if (!v || v === "") return "-";
  return String(v);
};

const getFieldLabel = (key) => {
  for (const group of COLUMN_GROUPS) {
    const field = group.fields.find(f => f.key === key);
    if (field) return field.label;
  }
  return DEFAULT_LABELS[key] || key;
};

export default function CekRekapDialog({ open, onOpenChange, students }) {
  const [selectedColumns, setSelectedColumns] = useState(new Set());
  const [pivotField, setPivotField] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [search, setSearch] = useState("");

  const toggleColumn = (key) => {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeColumns = [...DEFAULT_COLUMNS, ...selectedColumns];

  const filteredStudents = useMemo(() => {
    let result = students;
    if (filterField && filterValue) {
      result = result.filter(s => getFieldValue(s, filterField) === filterValue);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(s =>
        s.full_name?.toLowerCase().includes(lower) ||
        s.registration_number?.toLowerCase().includes(lower) ||
        s.nisn?.includes(search)
      );
    }
    return result;
  }, [students, filterField, filterValue, search]);

  const pivotBreakdown = useMemo(() => {
    if (!pivotField) return [];
    const counts = {};
    for (const s of students) {
      const val = getFieldValue(s, pivotField);
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [students, pivotField]);

  const summaries = useMemo(() => {
    return [...selectedColumns].map(key => {
      const counts = {};
      for (const s of filteredStudents) {
        const val = getFieldValue(s, key);
        counts[val] = (counts[val] || 0) + 1;
      }
      return {
        key,
        label: getFieldLabel(key),
        breakdown: Object.entries(counts).sort((a, b) => b[1] - a[1]),
      };
    });
  }, [selectedColumns, filteredStudents]);

  const handlePivotClick = (value) => {
    if (filterField === pivotField && filterValue === value) {
      setFilterField("");
      setFilterValue("");
    } else {
      setFilterField(pivotField);
      setFilterValue(value);
    }
  };

  const handleSummaryClick = (key, value) => {
    if (filterField === key && filterValue === value) {
      setFilterField("");
      setFilterValue("");
    } else {
      setFilterField(key);
      setFilterValue(value);
    }
  };

  const pivotOptions = activeColumns.filter(k => k !== "full_name" && k !== "registration_number" && k !== "nisn");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 size={20} /> Cek Rekap Data Siswa
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Column Selection */}
          <div className="w-72 border-r overflow-y-auto p-4 space-y-4 shrink-0">
            <p className="text-xs font-semibold text-slate-500 uppercase">Pilih Kolom Data</p>
            <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-2">
              Nama, No. Pendaftaran, NISN selalu ditampilkan
            </div>
            {COLUMN_GROUPS.map((group) => (
              <div key={group.group} className="space-y-2">
                <p className="text-xs font-semibold text-[#1e3a5f]">{group.group}</p>
                <div className="space-y-1.5 pl-1">
                  {group.fields.map((field) => (
                    <label key={field.key} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-slate-50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={selectedColumns.has(field.key)}
                        onCheckedChange={() => toggleColumn(field.key)}
                      />
                      <span className="text-slate-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Active Filter */}
            {(filterField || search) && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterField && (
                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200 gap-1">
                    {getFieldLabel(filterField)}: {filterValue}
                    <button onClick={() => { setFilterField(""); setFilterValue(""); }}>
                      <X size={12} />
                    </button>
                  </Badge>
                )}
                {search && (
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200 gap-1">
                    Pencarian: "{search}"
                    <button onClick={() => setSearch("")}>
                      <X size={12} />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Pivot Selector */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <Filter size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Rekap berdasarkan:</span>
              <Select value={pivotField || "_none"} onValueChange={(v) => setPivotField(v === "_none" ? "" : v)}>
                <SelectTrigger className="w-56 h-8">
                  <SelectValue placeholder="Pilih kolom..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Tidak ada</SelectItem>
                  {pivotOptions.map(key => (
                    <SelectItem key={key} value={key}>{getFieldLabel(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-slate-500 ml-auto">{filteredStudents.length} siswa</span>
            </div>

            {/* Pivot Breakdown */}
            {pivotField && pivotBreakdown.length > 0 && (
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  {getFieldLabel(pivotField)} — Klik untuk filter
                </div>
                <div className="flex flex-wrap gap-2 p-3">
                  {pivotBreakdown.map(([value, count]) => (
                    <button
                      key={value}
                      onClick={() => handlePivotClick(value)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        filterField === pivotField && filterValue === value
                          ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#1e3a5f]"
                      }`}
                    >
                      {value} <span className="font-bold ml-1">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Cards for selected columns */}
            {summaries.length > 0 && (
              <div className="space-y-3">
                {summaries.map((summary) => (
                  <div key={summary.key} className="bg-white border rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>{summary.label}</span>
                      <span className="text-xs text-slate-400">{summary.breakdown.length} nilai unik</span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {summary.breakdown.map(([value, count]) => (
                        <button
                          key={value}
                          onClick={() => handleSummaryClick(summary.key, value)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                            filterField === summary.key && filterValue === value
                              ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                              : "bg-white text-slate-600 border-slate-200 hover:border-[#1e3a5f]"
                          }`}
                        >
                          {value} <span className="font-bold ml-1">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Cari nama, no. pendaftaran, NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 sticky left-0 bg-slate-100">No</th>
                    {activeColumns.map(col => (
                      <th key={col} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                        {getFieldLabel(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={activeColumns.length + 1} className="text-center py-8 text-slate-400">
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400 sticky left-0 bg-white">{idx + 1}</td>
                        {activeColumns.map(col => (
                          <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                            {getFieldValue(student, col)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}