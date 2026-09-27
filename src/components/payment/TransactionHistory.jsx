import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Printer, Search, Receipt } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const paymentStatusColors = {
  belum_bayar: "bg-gray-100 text-gray-600 border-gray-200",
  dp: "bg-yellow-100 text-yellow-600 border-yellow-200",
  lunas: "bg-green-100 text-green-600 border-green-200",
  yatim: "bg-purple-100 text-purple-600 border-purple-200",
  beasiswa: "bg-blue-100 text-blue-600 border-blue-200",
};
const paymentStatusLabels = {
  belum_bayar: "Belum Bayar", dp: "DP", lunas: "Lunas", yatim: "Yatim", beasiswa: "Beasiswa",
};

export default function TransactionHistory({ payments, students }) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [waveFilter, setWaveFilter] = useState("all");
  const printRef = useRef();

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const filtered = payments.filter(p => {
    const student = studentMap[p.student_id];
    if (!student) return false;
    const matchSearch = student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || student.payment_status === statusFilter;
    const matchWave = waveFilter === "all" || student.wave === waveFilter;
    const pDate = new Date(p.payment_date);
    const matchFrom = !dateFrom || pDate >= new Date(dateFrom);
    const matchTo = !dateTo || pDate <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchWave && matchFrom && matchTo;
  }).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  const totalAmount = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Cetak laporan seluruh transaksi
  const handlePrintReport = () => {
    const printWindow = window.open("", "", "width=900,height=700");
    const rows = filtered.map((p, i) => {
      const student = studentMap[p.student_id];
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${format(new Date(p.payment_date), "d MMM yyyy", { locale: id })}</td>
          <td>${student?.registration_number || "-"}</td>
          <td>${student?.full_name || "-"}</td>
          <td>${student?.wave || "-"}</td>
          <td>${paymentStatusLabels[student?.payment_status] || "-"}</td>
          <td style="text-align:right">Rp ${p.amount?.toLocaleString("id-ID")}</td>
          <td>${p.notes || "-"}</td>
        </tr>`;
    }).join("");

    const filterInfo = [
      dateFrom && dateTo ? `Periode: ${format(new Date(dateFrom), "d MMM yyyy", { locale: id })} - ${format(new Date(dateTo), "d MMM yyyy", { locale: id })}` : "",
      statusFilter !== "all" ? `Status: ${paymentStatusLabels[statusFilter]}` : "",
      waveFilter !== "all" ? `Gelombang: ${waveFilter}` : "",
      search ? `Pencarian: "${search}"` : "",
    ].filter(Boolean).join(" | ");

    printWindow.document.write(`
      <html><head><title>Laporan Riwayat Transaksi Pembayaran</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 20mm 15mm; }
        .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
        .header h2 { font-size: 15px; color: #1e3a5f; font-weight: bold; margin-bottom: 2px; }
        .header p { font-size: 10px; color: #555; }
        .filter-info { font-size: 10px; color: #555; margin-bottom: 12px; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        .total-row td { font-weight: bold; background: #eef2f8; border-top: 2px solid #1e3a5f; }
        .footer { font-size: 10px; color: #555; margin-top: 16px; display: flex; justify-content: space-between; }
        @page { size: A4 landscape; margin: 15mm; }
      </style></head><body>
      <div class="header">
        <h2>LAPORAN RIWAYAT TRANSAKSI PEMBAYARAN</h2>
        <p>SMP YPPI Arrahmah &nbsp;|&nbsp; PPDB Tahun Pelajaran 2026-2027</p>
        <p>Dicetak pada: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })}</p>
      </div>
      ${filterInfo ? `<div class="filter-info">Filter: ${filterInfo}</div>` : ""}
      <table>
        <thead><tr>
          <th>No</th><th>Tanggal</th><th>No. Daftar</th><th>Nama Siswa</th>
          <th>Gelombang</th><th>Status</th><th>Nominal</th><th>Catatan</th>
        </tr></thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td colspan="6" style="text-align:right">TOTAL</td>
            <td style="text-align:right">Rp ${totalAmount.toLocaleString("id-ID")}</td>
            <td>${filtered.length} transaksi</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">
        <span>Total Transaksi: ${filtered.length}</span>
        <span>Total Nominal: Rp ${totalAmount.toLocaleString("id-ID")}</span>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Cetak kwitansi per transaksi
  const handlePrintReceipt = (payment) => {
    const student = studentMap[payment.student_id];
    if (!student) return;

    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
      <html><head><title>Kwitansi Pembayaran</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 40px; color: #000; }
        .receipt { border: 2px solid #000; border-style: double; padding: 20px; max-width: 320px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .header h2 { font-size: 16px; margin-bottom: 4px; }
        .header p { font-size: 11px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .label { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 12px 0; }
        .signature { margin-top: 30px; display: flex; justify-content: space-between; }
        .sig-box { text-align: center; }
        .sig-line { margin-top: 30px; border-top: 1px solid #000; padding-top: 4px; font-size: 11px; }
        @page { size: auto; margin: 5mm; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="receipt">
        <div class="header">
          <h2>KWITANSI PEMBAYARAN</h2>
          <p>SMP YPPI ARRAHMAH</p>
          <p>PPDB Tahun Pelajaran 2026/2027</p>
        </div>

        <div class="row"><span class="label">No. Pendaftaran</span><span>${student.registration_number || "-"}</span></div>
        <div class="row"><span class="label">Nama Siswa</span><span>${student.full_name || "-"}</span></div>
        <div class="row"><span class="label">Gelombang</span><span>${student.wave || "-"}</span></div>

        <div class="line"></div>

        <div class="row"><span class="label">Tanggal Bayar</span><span>${format(new Date(payment.payment_date), "d MMMM yyyy", { locale: id })}</span></div>
        <div class="row"><span class="label">Jumlah</span><span style="font-weight:bold">Rp ${payment.amount?.toLocaleString("id-ID")}</span></div>
        <div class="row"><span class="label">Catatan</span><span>${payment.notes || "-"}</span></div>

        <div class="line"></div>

        <div class="row"><span class="label">Status</span><span>${paymentStatusLabels[student.payment_status] || "-"}</span></div>

        <div class="signature">
          <div class="sig-box">
            <div class="sig-line">Pembayar</div>
          </div>
          <div class="sig-box">
            <div style="font-size:10px">Bogor, ${format(new Date(payment.payment_date), "d MMMM yyyy", { locale: id })}</div>
            <div class="sig-line">Penerima</div>
          </div>
        </div>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input placeholder="Cari nama / no. pendaftaran..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-slate-500">Dari Tanggal</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-slate-500">Sampai Tanggal</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
              <SelectItem value="dp">DP</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
              <SelectItem value="yatim">Yatim</SelectItem>
              <SelectItem value="beasiswa">Beasiswa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <Select value={waveFilter} onValueChange={setWaveFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Gelombang" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gelombang</SelectItem>
              <SelectItem value="Gelombang 1">Gelombang 1</SelectItem>
              <SelectItem value="Gelombang 2">Gelombang 2</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{filtered.length} transaksi</span>
            <span className="text-sm font-semibold text-green-600">Rp {totalAmount.toLocaleString("id-ID")}</span>
            <Button onClick={handlePrintReport} variant="outline" className="gap-2">
              <Printer size={16} />
              Cetak Laporan
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>No</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Pendaftaran</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Gelombang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="w-16 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    Tidak ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => {
                  const student = studentMap[p.student_id];
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{format(new Date(p.payment_date), "d MMM yyyy", { locale: id })}</TableCell>
                      <TableCell className="font-mono text-sm">{student?.registration_number || "-"}</TableCell>
                      <TableCell className="font-medium">{student?.full_name || "-"}</TableCell>
                      <TableCell>{student?.wave || "-"}</TableCell>
                      <TableCell>
                        <Badge className={`${paymentStatusColors[student?.payment_status || "belum_bayar"]} border text-xs`}>
                          {paymentStatusLabels[student?.payment_status || "belum_bayar"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        Rp {p.amount?.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{p.notes || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintReceipt(p)}
                          className="text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                          title="Cetak Kwitansi"
                        >
                          <Receipt size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && (
          <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
            <span className="text-sm text-slate-600">{filtered.length} transaksi</span>
            <span className="font-bold text-green-600 text-lg">
              Total: Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}