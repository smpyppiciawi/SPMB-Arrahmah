import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function RegistrationForm() {
  const navigate = useNavigate();
  const printRef = useRef();
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("id");

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-form", studentId],
    queryFn: async () => {
      const students = await base44.entities.Student.filter({ id: studentId });
      return students[0];
    },
    enabled: !!studentId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center">Data tidak ditemukan</div>;
  }

  return (
    <div>
      {/* Print Button - Hidden saat print */}
      <div className="no-print mb-4 flex gap-2">
        <Button variant="outline" onClick={() => navigate(createPageUrl(`StudentDetail?id=${studentId}`))} className="text-slate-900">
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={16} />
          Cetak Formulir
        </Button>
      </div>

      {/* Print Content */}
      <div ref={printRef} className="print-content bg-white p-12" style={{ maxWidth: "210mm", margin: "0 auto" }}>
        {/* Header */}
        <div className="text-center mb-6 pb-4">
          <h1 className="text-2xl font-bold mb-1">FORMULIR PENDAFTARAN PPDB</h1>
          <p className="text-sm font-semibold">SMP YPPI Arrahmah Tahun Pelajaran 2026/2027</p>
        </div>

        {/* Registration Info */}
        <div className="mb-4 pb-3 border-b-2 border-black text-sm" style={{ fontFamily: "monospace" }}>
          <p><strong>Nomor Pendaftaran:</strong> {student.registration_number} | <strong>Gelombang:</strong> {student.wave} | <strong>Tanggal Daftar:</strong> {student.registration_date && format(new Date(student.registration_date), "d MMMM yyyy", { locale: id })}</p>
        </div>

        {/* Data Pribadi */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-3 bg-gray-200 px-3 py-2">A. DATA PRIBADI SISWA</h3>
          <table className="w-full text-xs" style={{ fontFamily: "monospace" }}>
            <tbody>
              <tr>
                <td className="py-1" style={{ width: "35%" }}>Nama Lengkap</td>
                <td className="py-1" style={{ width: "2%" }}>:</td>
                <td className="py-1">{student.full_name}</td>
              </tr>
              <tr>
                <td className="py-1">Nama Panggilan</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.nickname || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">NISN</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.nisn || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">NIK</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.nik}</td>
              </tr>
              <tr>
                <td className="py-1">Tempat, Tanggal Lahir</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.birth_place}, {student.birth_date && format(new Date(student.birth_date), "d MMMM yyyy", { locale: id })}</td>
              </tr>
              <tr>
                <td className="py-1">Jenis Kelamin</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.gender}</td>
              </tr>
              <tr>
                <td className="py-1">Agama</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.religion}</td>
              </tr>
              <tr>
                <td className="py-1">Kewarganegaraan</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.citizenship || "WNI"}</td>
              </tr>
              <tr>
                <td className="py-1">Anak Ke- / Jumlah Saudara</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.child_order || "-"} / {student.siblings_count || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Alamat Lengkap</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.address}</td>
              </tr>
              <tr>
                <td className="py-1">RT / RW</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.rt || "-"} / {student.rw || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Kelurahan / Desa</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.village || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Kecamatan</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.district || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Kota / Kabupaten</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.city || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Provinsi</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.province || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Kode Pos</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.postal_code || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">No. Telepon/HP</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.phone || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Memiliki KIP/KPS/PKH</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.kip_kps_pkh || "Tidak"} {student.kip_kps_pkh === "Ya" && student.kip_kps_pkh_number ? `(No: ${student.kip_kps_pkh_number})` : ""}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Data Orang Tua */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-3 bg-gray-200 px-3 py-2">B. DATA ORANG TUA</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Ayah */}
            <div>
              <p className="font-bold text-xs mb-2">AYAH</p>
              <table className="w-full text-xs" style={{ fontFamily: "monospace" }}>
                <tbody>
                  <tr>
                    <td className="py-1" style={{ width: "40%" }}>Nama</td>
                    <td className="py-1" style={{ width: "2%" }}>:</td>
                    <td className="py-1">{student.father_name}</td>
                  </tr>
                  <tr>
                    <td className="py-1">NIK</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.father_nik || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Tempat Lahir</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.father_birth_place || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Tanggal Lahir</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.father_birth_date ? format(new Date(student.father_birth_date), "d MMM yyyy", { locale: id }) : "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pendidikan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.father_education || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pekerjaan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.father_job || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Penghasilan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.father_income || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">No. HP</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.father_phone || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ibu */}
            <div>
              <p className="font-bold text-xs mb-2">IBU</p>
              <table className="w-full text-xs" style={{ fontFamily: "monospace" }}>
                <tbody>
                  <tr>
                    <td className="py-1" style={{ width: "40%" }}>Nama</td>
                    <td className="py-1" style={{ width: "2%" }}>:</td>
                    <td className="py-1">{student.mother_name}</td>
                  </tr>
                  <tr>
                    <td className="py-1">NIK</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.mother_nik || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Tempat Lahir</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.mother_birth_place || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Tanggal Lahir</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.mother_birth_date ? format(new Date(student.mother_birth_date), "d MMM yyyy", { locale: id }) : "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pendidikan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.mother_education || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pekerjaan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.mother_job || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Penghasilan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.mother_income || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">No. HP</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.mother_phone || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Wali (if exists) */}
          {student.guardian_name && (
            <div className="mt-4">
              <p className="font-bold text-xs mb-2">WALI</p>
              <table className="w-full text-xs" style={{ fontFamily: "monospace" }}>
                <tbody>
                  <tr>
                    <td className="py-1" style={{ width: "35%" }}>Nama</td>
                    <td className="py-1" style={{ width: "2%" }}>:</td>
                    <td className="py-1">{student.guardian_name}</td>
                  </tr>
                  <tr>
                    <td className="py-1">NIK</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_nik || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Tempat Lahir</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_birth_place || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Tanggal Lahir</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_birth_date ? format(new Date(student.guardian_birth_date), "d MMM yyyy", { locale: id }) : "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Hubungan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_relation || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pendidikan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_education || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pekerjaan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_job || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Penghasilan</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_income || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">No. HP</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_phone || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Alamat</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{student.guardian_address || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Data Sekolah */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-3 bg-gray-200 px-3 py-2">C. DATA SEKOLAH ASAL</h3>
          <table className="w-full text-xs" style={{ fontFamily: "monospace" }}>
            <tbody>
              <tr>
                <td className="py-1" style={{ width: "35%" }}>Nama Sekolah</td>
                <td className="py-1" style={{ width: "2%" }}>:</td>
                <td className="py-1">{student.previous_school}</td>
              </tr>
              <tr>
                <td className="py-1">Jenis Sekolah</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.previous_school_type || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Alamat Sekolah</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.previous_school_address || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">NPSN</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.previous_school_npsn || "-"}</td>
              </tr>
              <tr>
                <td className="py-1">Tahun Lulus</td>
                <td className="py-1">:</td>
                <td className="py-1">{student.graduation_year || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Lampiran Berkas */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-3 bg-gray-200 px-3 py-2">LAMPIRAN BERKAS:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_birth_certificate ? "✓" : ""}</div>
              <span>Formulir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_family_card ? "✓" : ""}</div>
              <span>Fotokopi Kartu Keluarga</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{(student.doc_ktp_father && student.doc_ktp_mother) ? "✓" : ""}</div>
              <span>Fotokopi KTP Orang Tua (Ayah & Ibu)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_ijazah ? "✓" : ""}</div>
              <span>Fotokopi Ijazah Legalisir (2 Lembar)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_skhun ? "✓" : ""}</div>
              <span>Fotokopi Surat Keterangan Lulus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_birth_certificate ? "✓" : ""}</div>
              <span>Fotokopi Akta Kelahiran</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_nisn_card ? "✓" : ""}</div>
              <span>Fotokopi Kartu NISN/NISN via Website</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_photo_3x4 ? "✓" : ""}</div>
              <span>Foto Hitam Putih/Berwarna Ukuran 3x4 (2 Lembar)</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <div className="w-4 h-4 border border-black flex items-center justify-center text-lg">{student.doc_kip ? "✓" : ""}</div>
              <span>Fotokopi Kartu KIP/KPS/PKH (Jika ada)</span>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div className="text-center">
            <p className="mb-1">Mengetahui,</p>
            <p className="mb-16">Kepala Sekolah</p>
            <p className="border-t border-black inline-block px-8 pt-1">
              (...............................)
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1">Bogor, {student.registration_date && format(new Date(student.registration_date), "d MMMM yyyy", { locale: id })}</p>
            <p className="mb-16">Orang Tua / Wali Siswa</p>
            <p className="border-t border-black inline-block px-8 pt-1">
              (...............................)
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content {
            margin: 0 !important;
            padding: 8mm 10mm !important;
            max-width: none !important;
            width: 100% !important;
            box-shadow: none !important;
          }
          @page { size: A4 portrait; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-content * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media screen {
          .print-content {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}