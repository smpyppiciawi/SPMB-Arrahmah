import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";

export default function ParentDataForm({ formData, setFormData, errors }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const educationOptions = ["Tidak Sekolah", "Putus SD", "SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"];
  const jobOptions = ["Guru/Dosen/Pengajar/Pendidik", "PNS/POLRI/TNI", "Karyawan Swasta", "Wiraswasta", "Wirausaha", "Pedagang", "Pegawai Lepas/Buruh", "Tenaga Kerja Indonesia", "Sudah Meninggal", "Tidak Bekerja"];
  const incomeOptions = ["Kurang dari 500.000", "500.000 - 999.999", "999.999 - 1.999.999", "2.000.000 - 4.999.999", "5.999.999 - 20.000.000", "Lebih dari 20.000.000", "TIDAK BERPENGHASILAN"];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users size={20} />
          Data Orang Tua / Wali
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="father" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="father">Data Ayah</TabsTrigger>
            <TabsTrigger value="mother">Data Ibu</TabsTrigger>
            <TabsTrigger value="guardian">Data Wali</TabsTrigger>
          </TabsList>

          <TabsContent value="father" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="father_name">Nama Ayah *</Label>
                <Input
                  id="father_name"
                  value={formData.father_name || ""}
                  onChange={(e) => handleChange("father_name", e.target.value)}
                  placeholder="Nama lengkap ayah"
                  className={errors.father_name ? "border-red-500" : ""}
                />
                {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name}</p>}
              </div>

              <div>
                <Label htmlFor="father_nik">NIK Ayah</Label>
                <Input
                  id="father_nik"
                  type="text"
                  maxLength="16"
                  value={formData.father_nik || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange("father_nik", value);
                  }}
                  placeholder="16 digit NIK"
                />
              </div>

              <div>
                <Label htmlFor="father_birth_place">Tempat Lahir</Label>
                <Input
                  id="father_birth_place"
                  value={formData.father_birth_place || ""}
                  onChange={(e) => handleChange("father_birth_place", e.target.value)}
                  placeholder="Kota kelahiran"
                />
              </div>

              <div>
                <Label htmlFor="father_birth_date">Tanggal Lahir</Label>
                <Input
                  id="father_birth_date"
                  type="date"
                  value={formData.father_birth_date || ""}
                  onChange={(e) => handleChange("father_birth_date", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="father_education">Pendidikan Terakhir</Label>
                <Select
                  value={formData.father_education || ""}
                  onValueChange={(value) => handleChange("father_education", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationOptions.map((edu) => (
                      <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="father_job">Pekerjaan</Label>
                <Select
                  value={formData.father_job || ""}
                  onValueChange={(value) => handleChange("father_job", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pekerjaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOptions.map((job) => (
                      <SelectItem key={job} value={job}>{job}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="father_income">Penghasilan</Label>
                <Select
                  value={formData.father_income || ""}
                  onValueChange={(value) => handleChange("father_income", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih penghasilan" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeOptions.map((income) => (
                      <SelectItem key={income} value={income}>{income}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="father_phone">No. HP</Label>
                <Input
                  id="father_phone"
                  type="text"
                  maxLength="13"
                  value={formData.father_phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange("father_phone", value);
                  }}
                  placeholder="Nomor HP ayah"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mother" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="mother_name">Nama Ibu *</Label>
                <Input
                  id="mother_name"
                  value={formData.mother_name || ""}
                  onChange={(e) => handleChange("mother_name", e.target.value)}
                  placeholder="Nama lengkap ibu"
                  className={errors.mother_name ? "border-red-500" : ""}
                />
                {errors.mother_name && <p className="text-red-500 text-xs mt-1">{errors.mother_name}</p>}
              </div>

              <div>
                <Label htmlFor="mother_nik">NIK Ibu</Label>
                <Input
                  id="mother_nik"
                  type="text"
                  maxLength="16"
                  value={formData.mother_nik || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange("mother_nik", value);
                  }}
                  placeholder="16 digit NIK"
                />
              </div>

              <div>
                <Label htmlFor="mother_birth_place">Tempat Lahir</Label>
                <Input
                  id="mother_birth_place"
                  value={formData.mother_birth_place || ""}
                  onChange={(e) => handleChange("mother_birth_place", e.target.value)}
                  placeholder="Kota kelahiran"
                />
              </div>

              <div>
                <Label htmlFor="mother_birth_date">Tanggal Lahir</Label>
                <Input
                  id="mother_birth_date"
                  type="date"
                  value={formData.mother_birth_date || ""}
                  onChange={(e) => handleChange("mother_birth_date", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="mother_education">Pendidikan Terakhir</Label>
                <Select
                  value={formData.mother_education || ""}
                  onValueChange={(value) => handleChange("mother_education", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationOptions.map((edu) => (
                      <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mother_job">Pekerjaan</Label>
                <Select
                  value={formData.mother_job || ""}
                  onValueChange={(value) => handleChange("mother_job", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pekerjaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOptions.map((job) => (
                      <SelectItem key={job} value={job}>{job}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mother_income">Penghasilan</Label>
                <Select
                  value={formData.mother_income || ""}
                  onValueChange={(value) => handleChange("mother_income", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih penghasilan" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeOptions.map((income) => (
                      <SelectItem key={income} value={income}>{income}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mother_phone">No. HP</Label>
                <Input
                  id="mother_phone"
                  type="text"
                  maxLength="13"
                  value={formData.mother_phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange("mother_phone", value);
                  }}
                  placeholder="Nomor HP ibu"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="guardian" className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">* Isi data wali jika siswa tidak tinggal bersama orang tua</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="guardian_name">Nama Wali</Label>
                <Input
                  id="guardian_name"
                  value={formData.guardian_name || ""}
                  onChange={(e) => handleChange("guardian_name", e.target.value)}
                  placeholder="Nama lengkap wali"
                />
              </div>

              <div>
                <Label htmlFor="guardian_nik">NIK Wali</Label>
                <Input
                  id="guardian_nik"
                  type="text"
                  maxLength="16"
                  value={formData.guardian_nik || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange("guardian_nik", value);
                  }}
                  placeholder="16 digit NIK"
                />
              </div>

              <div>
                <Label htmlFor="guardian_birth_place">Tempat Lahir</Label>
                <Input
                  id="guardian_birth_place"
                  value={formData.guardian_birth_place || ""}
                  onChange={(e) => handleChange("guardian_birth_place", e.target.value)}
                  placeholder="Kota kelahiran"
                />
              </div>

              <div>
                <Label htmlFor="guardian_birth_date">Tanggal Lahir</Label>
                <Input
                  id="guardian_birth_date"
                  type="date"
                  value={formData.guardian_birth_date || ""}
                  onChange={(e) => handleChange("guardian_birth_date", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="guardian_education">Pendidikan Terakhir</Label>
                <Select
                  value={formData.guardian_education || ""}
                  onValueChange={(value) => handleChange("guardian_education", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationOptions.map((edu) => (
                      <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="guardian_job">Pekerjaan</Label>
                <Select
                  value={formData.guardian_job || ""}
                  onValueChange={(value) => handleChange("guardian_job", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pekerjaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOptions.map((job) => (
                      <SelectItem key={job} value={job}>{job}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="guardian_income">Penghasilan</Label>
                <Select
                  value={formData.guardian_income || ""}
                  onValueChange={(value) => handleChange("guardian_income", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih penghasilan" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeOptions.map((income) => (
                      <SelectItem key={income} value={income}>{income}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="guardian_relation">Status Hubungan</Label>
                <Input
                  id="guardian_relation"
                  value={formData.guardian_relation || ""}
                  onChange={(e) => handleChange("guardian_relation", e.target.value)}
                  placeholder="Contoh: Paman, Kakek, dll"
                />
              </div>

              <div>
                <Label htmlFor="guardian_phone">No. HP</Label>
                <Input
                  id="guardian_phone"
                  type="text"
                  maxLength="13"
                  value={formData.guardian_phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange("guardian_phone", value);
                  }}
                  placeholder="Nomor HP wali"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="guardian_address">Alamat Wali</Label>
                <Textarea
                  id="guardian_address"
                  value={formData.guardian_address || ""}
                  onChange={(e) => handleChange("guardian_address", e.target.value)}
                  placeholder="Alamat lengkap wali"
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}