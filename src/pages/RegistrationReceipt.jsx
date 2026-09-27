import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const docFields = [
  { key: "doc_birth_certificate", label: "Fotokopi Akta Kelahiran" },
  { key: "doc_family_card", label: "Fotokopi Kartu Keluarga" },
  { key: "doc_ktp_father", label: "Fotokopi KTP Ayah" },
  { key: "doc_ktp_mother", label: "Fotokopi KTP Ibu" },
  { key: "doc_photo_3x4", label: "Pas Foto 3x4 (2 lembar)" },
  { key: "doc_ijazah", label: "Fotokopi Ijazah Legalisir (2 lbr)" },
  { key: "doc_skhun", label: "Fotokopi Surat Keterangan Lulus" },
  { key: "doc_nisn_card", label: "Fotokopi Kartu NISN/Print NISN" },
  { key: "doc_kip", label: "Fotokopi KIP/KPS/PKH (Jika ada)" },
];

export default function RegistrationReceipt() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("id");

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-receipt", studentId],
    queryFn: async () => {
      const students = await base44.entities.Student.filter({ id: studentId });
      return students[0];
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments-receipt", studentId],
    queryFn: () => base44.entities.Payment.filter({ student_id: studentId }),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  const WAVE1_COST = 1815000;
  const WAVE2_COST = 2265000;
  const SPECIAL_COST = 610000;

  const getTarget = (s) => {
    if (s.total_cost_override > 0) return s.total_cost_override;
    if (s.payment_status === "yatim" || s.payment_status === "beasiswa") return SPECIAL_COST;
    if (s.wave === "Gelombang 1") return WAVE1_COST;
    if (s.wave === "Gelombang 2") return WAVE2_COST;
    return 0;
  };

  const handlePrint = () => { window.print(); };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!student) return <div className="p-8 text-center">Data tidak ditemukan</div>;

  const regDate = student.registration_date ? format(new Date(student.registration_date), "d MMMM yyyy", { locale: id }) : "-";
  const studentPayments = payments.filter(p => p.student_id === studentId).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  const totalPaid = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastPayment = studentPayments[0];
  const targetCost = getTarget(student);
  const sisaBayar = Math.max(0, targetCost - totalPaid);

  return (
    <div>
      <div className="no-print mb-4 flex gap-2">
        <Button variant="outline" onClick={() => navigate(createPageUrl(`StudentDetail?id=${studentId}`))} className="text-slate-900">
          <ArrowLeft size={16} className="mr-2" /> Kembali
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={16} /> Cetak
        </Button>
      </div>

      <div className="print-content bg-white" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>

        {/* ==================== BUKTI PENDAFTARAN & PENERIMAAN BERKAS ==================== */}
        <div style={{ borderBottom: "2px dashed #555", paddingBottom: "6mm", marginBottom: "6mm" }}>

          {/* Title — langsung ke judul, tanpa kop/header */}
          <div style={{ textAlign: "center", marginBottom: "4mm" }}>
            <h1 style={{ fontSize: "13pt", fontWeight: "bold", margin: "0 0 1mm 0", letterSpacing: "0.5px" }}>
              BUKTI PENDAFTARAN & PENERIMAAN BERKAS
            </h1>
            <p style={{ fontSize: "9pt", margin: "0", fontWeight: "600" }}>SMP YPPI ARRAHMAH</p>
            <p style={{ fontSize: "9pt", margin: "0" }}>PPDB Tahun Pelajaran 2026/2027</p>
          </div>

          {/* No. Pendaftaran */}
          <div style={{ textAlign: "center", marginBottom: "4mm", padding: "2mm", background: "#f0f4f8", borderRadius: "3px" }}>
            <span style={{ fontSize: "11pt", fontFamily: "monospace", fontWeight: "bold" }}>
              No. {student.registration_number}
            </span>
            <span style={{ fontSize: "8pt", marginLeft: "6px", color: "#555" }}>
              {student.wave} &nbsp;·&nbsp; {regDate}
            </span>
          </div>

          {/* Data Siswa + Berkas */}
          <div style={{ display: "flex", gap: "6mm" }}>
            <div style={{ flex: "1.1" }}>
              <p style={{ fontSize: "8pt", fontWeight: "bold", borderBottom: "1px solid #333", paddingBottom: "1mm", marginBottom: "2mm" }}>
                DATA SISWA
              </p>
              <Row label="NISN" value={student.nisn} />
              <Row label="Nama Lengkap" value={student.full_name} bold />
              <Row label="Tempat Lahir" value={student.birth_place} />
              <Row label="Tanggal Lahir" value={student.birth_date ? format(new Date(student.birth_date), "d MMMM yyyy", { locale: id }) : "-"} />
              <Row label="Jenis Kelamin" value={student.gender} />
              <Row label="Alamat" value={student.address} />
              <Row label="Kota/Kab" value={student.city} />
              <Row label="Nama Ibu" value={student.mother_name} bold />
              <Row label="HP Ibu" value={student.mother_phone} />
              <Row label="Asal Sekolah" value={student.previous_school} />
            </div>
            <div style={{ flex: "0.9" }}>
              <p style={{ fontSize: "8pt", fontWeight: "bold", borderBottom: "1px solid #333", paddingBottom: "1mm", marginBottom: "2mm" }}>
                KELENGKAPAN BERKAS
              </p>
              {docFields.map((doc) => (
                <CheckItem key={doc.key} label={doc.label} checked={student[doc.key]} />
              ))}
            </div>
          </div>

          {/* Footer: Contact + Petugas */}
          <div style={{ marginTop: "4mm", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: "7.5pt", lineHeight: "1.5" }}>
              <p style={{ margin: "0", fontWeight: "bold" }}>Tanggal Daftar: {regDate}</p>
              <p style={{ margin: "0" }}>Simpan bukti ini untuk daftar ulang</p>
              <p style={{ margin: "0", fontWeight: "bold" }}>WA: 0895 3269 45999</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "8pt", margin: "0 0 1mm 0" }}>Bogor, {regDate}</p>
              <p style={{ fontSize: "8pt", margin: "0 0 10mm 0" }}>Petugas,</p>
              <p style={{ fontSize: "8pt", fontWeight: "bold", margin: "0", borderTop: "1px solid #333", paddingTop: "1mm", minWidth: "35mm", display: "inline-block", textAlign: "center" }}>
                {student.registration_officer || "................."}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== KWITANSI ==================== */}
        <div>
          <div style={{ textAlign: "center", marginBottom: "3mm", padding: "2mm", border: "2px solid #333", background: "#f8fafc" }}>
            <h2 style={{ fontSize: "11pt", fontWeight: "bold", margin: "0", letterSpacing: "1px" }}>
              KWITANSI PEMBAYARAN
            </h2>
            <p style={{ fontSize: "7.5pt", margin: "0" }}>SMP YPPI ARRAHMAH · PPDB 2026/2027</p>
          </div>

          <table style={{ width: "100%", fontSize: "9pt", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold", width: "35%" }}>Diterima dari</td>
                <td style={{ padding: "1.5mm 2mm" }}>: {student.mother_name || student.father_name || "-"} (Ortu/Wali)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>Nama Siswa</td>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>: {student.full_name}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>No. Pendaftaran</td>
                <td style={{ padding: "1.5mm 2mm" }}>: {student.registration_number}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>Pembayaran</td>
                <td style={{ padding: "1.5mm 2mm" }}>: Biaya Pendaftaran {student.wave}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>Jumlah</td>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold", fontSize: "11pt" }}>
                  : Rp {lastPayment ? lastPayment.amount.toLocaleString("id-ID") : totalPaid.toLocaleString("id-ID")}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>Tanggal Daftar</td>
                <td style={{ padding: "1.5mm 2mm" }}>: {regDate}</td>
              </tr>
              {lastPayment && (
                <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>Tanggal Bayar</td>
                  <td style={{ padding: "1.5mm 2mm" }}>: {format(new Date(lastPayment.payment_date), "d MMMM yyyy", { locale: id })}</td>
                </tr>
              )}
              {studentPayments.length > 1 && (
                <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>Total Dibayar</td>
                  <td style={{ padding: "1.5mm 2mm", fontWeight: "bold" }}>: Rp {totalPaid.toLocaleString("id-ID")}</td>
                </tr>
              )}
              <tr style={{ borderTop: "2px solid #333", background: "#fef3c7" }}>
                <td style={{ padding: "2mm 2mm", fontWeight: "bold", fontSize: "10pt" }}>Total Biaya</td>
                <td style={{ padding: "2mm 2mm", fontWeight: "bold", fontSize: "10pt" }}>: Rp {targetCost.toLocaleString("id-ID")}</td>
              </tr>
              <tr style={{ background: "#fef3c7" }}>
                <td style={{ padding: "2mm 2mm", fontWeight: "bold", fontSize: "10pt" }}>Sisa Bayar</td>
                <td style={{ padding: "2mm 2mm", fontWeight: "bold", fontSize: "11pt", color: sisaBayar === 0 ? "#16a34a" : "#dc2626" }}>
                  : {sisaBayar === 0 ? "LUNAS ✓" : `Rp ${sisaBayar.toLocaleString("id-ID")}`}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6mm" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "8pt", margin: "0 0 12mm 0" }}>Pembayar,</p>
              <p style={{ fontSize: "8pt", margin: "0", borderTop: "1px solid #333", paddingTop: "1mm", display: "inline-block", minWidth: "30mm" }}>.................</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "8pt", margin: "0" }}>Bogor, {lastPayment ? format(new Date(lastPayment.payment_date), "d MMMM yyyy", { locale: id }) : regDate}</p>
              <p style={{ fontSize: "8pt", margin: "1mm 0 12mm 0" }}>Penerima,</p>
              <p style={{ fontSize: "8pt", fontWeight: "bold", margin: "0", borderTop: "1px solid #333", paddingTop: "1mm", display: "inline-block", minWidth: "35mm", textAlign: "center" }}>
                {student.registration_officer || "................."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-content {
            margin: 0 !important;
            padding: 8mm 10mm !important;
            width: 100% !important;
            max-width: none !important;
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
            max-width: 190mm;
            margin: 0 auto;
            padding: 16mm 14mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", padding: "1mm 0", borderBottom: "1px solid #eef0f2", fontSize: "8pt", alignItems: "baseline" }}>
      <span style={{ width: "32%", color: "#666", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: bold ? "bold" : "normal", color: bold ? "#1e3a5f" : "#333" }}>{value || "-"}</span>
    </div>
  );
}

function CheckItem({ label, checked }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "2mm", marginBottom: "1.2mm", fontSize: "8pt" }}>
      <div style={{
        width: "3.5mm", height: "3.5mm", border: "1.5px solid #333",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "5pt", fontWeight: "bold", flexShrink: 0, marginTop: "0.5mm",
        backgroundColor: checked ? "#333" : "white", color: checked ? "white" : "transparent"
      }}>
        {checked ? "✓" : ""}
      </div>
      <span style={{ color: "#333", lineHeight: "1.3" }}>{label}</span>
    </div>
  );
}