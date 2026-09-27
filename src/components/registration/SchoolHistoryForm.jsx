import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { School } from "lucide-react";

export default function SchoolHistoryForm({ formData, setFormData, errors }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <School size={20} />
          Riwayat Pendidikan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="previous_school">Nama Sekolah Asal *</Label>
            <Input
              id="previous_school"
              value={formData.previous_school || ""}
              onChange={(e) => handleChange("previous_school", e.target.value)}
              placeholder="Nama sekolah sebelumnya"
              className={errors.previous_school ? "border-red-500" : ""}
            />
            {errors.previous_school && <p className="text-red-500 text-xs mt-1">{errors.previous_school}</p>}
          </div>

          <div>
            <Label htmlFor="previous_school_type">Jenis Sekolah</Label>
            <Select
              value={formData.previous_school_type || ""}
              onValueChange={(value) => handleChange("previous_school_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Negeri">Negeri</SelectItem>
                <SelectItem value="Swasta">Swasta</SelectItem>
                <SelectItem value="MI/Pesantren">MI/Pesantren</SelectItem>
                <SelectItem value="Paket/PKBM">Paket/PKBM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="previous_school_address">Alamat Sekolah Asal</Label>
            <Textarea
              id="previous_school_address"
              value={formData.previous_school_address || ""}
              onChange={(e) => handleChange("previous_school_address", e.target.value)}
              placeholder="Alamat lengkap sekolah asal"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="previous_school_npsn">NPSN Sekolah Asal</Label>
            <Input
              id="previous_school_npsn"
              value={formData.previous_school_npsn || ""}
              onChange={(e) => handleChange("previous_school_npsn", e.target.value)}
              placeholder="8 digit NPSN"
            />
          </div>

          <div>
            <Label htmlFor="graduation_year">Tahun Lulus</Label>
            <Select
              value={formData.graduation_year || ""}
              onValueChange={(value) => handleChange("graduation_year", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tahun lulus" />
              </SelectTrigger>
              <SelectContent>
                {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}