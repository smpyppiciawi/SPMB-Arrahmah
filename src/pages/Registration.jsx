import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import PersonalDataForm from "../components/registration/PersonalDataForm";
import ParentDataForm from "../components/registration/ParentDataForm";
import SchoolHistoryForm from "../components/registration/SchoolHistoryForm";
import RegistrationForm from "../components/registration/RegistrationForm";
import DocumentChecklistForm from "../components/registration/DocumentChecklistForm";

export default function Registration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const wlName = urlParams.get("wl_name");
  const [formData, setFormData] = useState({
    religion: "Islam",
    status: "pending",
    registration_date: new Date().toISOString().split("T")[0],
    wave: new Date().getMonth() < 2 ? "Gelombang 1" : "Gelombang 2",
    ...(wlName ? { full_name: wlName } : {}),
  });
  const [errors, setErrors] = useState({});

  const generateRegNumber = async () => {
    const allStudents = await base44.entities.Student.list("-created_date", 1000);
    const lastNumber = allStudents.length;
    const nextNumber = String(lastNumber + 1).padStart(3, "0");
    return `P262707-${nextNumber}`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.registration_officer) newErrors.registration_officer = "Nama petugas wajib diisi";
    if (!formData.full_name) newErrors.full_name = "Nama lengkap wajib diisi";
    if (!formData.nik) newErrors.nik = "NIK wajib diisi";
    if (!formData.gender) newErrors.gender = "Jenis kelamin wajib diisi";
    if (!formData.birth_place) newErrors.birth_place = "Tempat lahir wajib diisi";
    if (!formData.birth_date) newErrors.birth_date = "Tanggal lahir wajib diisi";
    if (!formData.address) newErrors.address = "Alamat wajib diisi";
    if (!formData.father_name) newErrors.father_name = "Nama ayah wajib diisi";
    if (!formData.mother_name) newErrors.mother_name = "Nama ibu wajib diisi";
    if (!formData.previous_school) newErrors.previous_school = "Sekolah asal wajib diisi";
    if (!formData.registration_date) newErrors.registration_date = "Tanggal daftar wajib diisi";
    if (!formData.wave) newErrors.wave = "Gelombang wajib diisi";

    // At least 1 document must be checked
    const docFields = [
      "doc_birth_certificate","doc_family_card","doc_ktp_father","doc_ktp_mother",
      "doc_photo_3x4","doc_ijazah","doc_skhun","doc_nisn_card","doc_kip",
    ];
    const hasDoc = docFields.some((f) => formData[f]);
    if (!hasDoc) newErrors.doc_checklist = "Minimal 1 berkas harus diceklis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: (data) => {
      navigate(createPageUrl(`StudentDetail?id=${data.id}`));
    },
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const dataToSave = {
      ...formData,
      registration_number: await generateRegNumber(),
    };
    createMutation.mutate(dataToSave);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pendaftaran Siswa Baru</h1>
          <p className="text-slate-500">Isi formulir dengan lengkap dan benar</p>
        </div>
        <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))} className="gap-2">
          <ArrowLeft size={16} />
          Kembali
        </Button>
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 font-medium">Mohon lengkapi data berikut:</p>
          <ul className="list-disc list-inside text-red-500 text-sm mt-2">
            {Object.values(errors).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Informasi Pendaftaran — paling atas */}
      <RegistrationForm formData={formData} setFormData={setFormData} errors={errors} />

      {/* Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PersonalDataForm formData={formData} setFormData={setFormData} errors={errors} />
          <ParentDataForm formData={formData} setFormData={setFormData} errors={errors} />
          <SchoolHistoryForm formData={formData} setFormData={setFormData} errors={errors} />
        </div>
        <div>
          <DocumentChecklistForm formData={formData} setFormData={setFormData} errors={errors} />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={16} />
              Simpan Pendaftaran
            </>
          )}
        </Button>
      </div>
    </div>
  );
}