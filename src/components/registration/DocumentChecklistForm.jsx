import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, FileCheck } from "lucide-react";

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

export { documentFields };

export default function DocumentChecklistForm({ formData, setFormData, errors = {} }) {
  const checkedCount = documentFields.filter((d) => formData[d.key]).length;

  const handleToggle = (key, checked) => {
    setFormData((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <Card className={`border-0 shadow-md ${errors.doc_checklist ? "ring-2 ring-red-400" : ""}`}>
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckSquare size={20} />
          Ceklis Berkas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        {errors.doc_checklist && (
          <p className="text-red-500 text-xs mb-2">{errors.doc_checklist}</p>
        )}
        {documentFields.map((doc) => (
          <div
            key={doc.key}
            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
              formData[doc.key]
                ? "bg-green-50 border-green-200"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
            onClick={() => handleToggle(doc.key, !formData[doc.key])}
          >
            <Checkbox
              id={doc.key}
              checked={formData[doc.key] || false}
              onCheckedChange={(checked) => handleToggle(doc.key, checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <label htmlFor={doc.key} className="flex-1 text-sm cursor-pointer select-none">
              {doc.label}
            </label>
            {formData[doc.key] && <FileCheck size={16} className="text-green-500 shrink-0" />}
          </div>
        ))}
        <p className="text-xs text-slate-500 text-center pt-1">
          {checkedCount} dari {documentFields.length} berkas terkumpul
        </p>
      </CardContent>
    </Card>
  );
}