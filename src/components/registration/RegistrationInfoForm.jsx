import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";

export default function RegistrationInfoForm({ formData, setFormData, errors = {} }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList size={20} />
          Informasi Pendaftaran
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Tanggal Daftar *</Label>
            <Input
              type="date"
              value={formData.registration_date || ""}
              onChange={(e) => handleChange("registration_date", e.target.value)}
              className={errors.registration_date ? "border-red-500" : ""}
            />
            {errors.registration_date && <p className="text-red-500 text-xs mt-1">{errors.registration_date}</p>}
          </div>
          <div>
            <Label>Gelombang *</Label>
            <Select
              value={formData.wave || ""}
              onValueChange={(value) => handleChange("wave", value)}
            >
              <SelectTrigger className={errors.wave ? "border-red-500" : ""}>
                <SelectValue placeholder="Pilih gelombang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gelombang 1">Gelombang 1 (Jan - Feb)</SelectItem>
                <SelectItem value="Gelombang 2">Gelombang 2 (Mar - Des)</SelectItem>
              </SelectContent>
            </Select>
            {errors.wave && <p className="text-red-500 text-xs mt-1">{errors.wave}</p>}
          </div>
          <div>
            <Label>Nama Petugas</Label>
            <Input
              value={formData.registration_officer || ""}
              onChange={(e) => handleChange("registration_officer", e.target.value)}
              placeholder="Nama petugas pendaftaran"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}