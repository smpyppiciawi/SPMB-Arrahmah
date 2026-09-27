import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";
import { getProvinces, getCities, getDistricts, getVillages } from "../utils/indonesiaData";
import ManualInputSelect from "./ManualInputSelect";

export default function PersonalDataForm({ formData, setFormData, errors }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const provinces = getProvinces();
  const cities = formData.province ? getCities(formData.province) : [];
  const districts = formData.province && formData.city ? getDistricts(formData.province, formData.city) : [];
  const villages = formData.province && formData.city && formData.district ? getVillages(formData.province, formData.city, formData.district) : [];

  useEffect(() => {
    if (formData.province) {
      const availableCities = getCities(formData.province);
      if (!availableCities.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: "", district: "", village: "" }));
      }
    }
  }, [formData.province]);

  useEffect(() => {
    if (formData.city) {
      const availableDistricts = getDistricts(formData.province, formData.city);
      if (!availableDistricts.includes(formData.district)) {
        setFormData(prev => ({ ...prev, district: "", village: "" }));
      }
    }
  }, [formData.city]);

  useEffect(() => {
    if (formData.district) {
      const availableVillages = getVillages(formData.province, formData.city, formData.district);
      if (!availableVillages.includes(formData.village)) {
        setFormData(prev => ({ ...prev, village: "" }));
      }
    }
  }, [formData.district]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User size={20} />
          Data Pribadi Siswa
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="full_name">Nama Lengkap sesuai KK *</Label>
            <Input
              id="full_name"
              value={formData.full_name || ""}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Nama lengkap sesuai Kartu Keluarga"
              className={errors.full_name ? "border-red-500" : ""}
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <Label htmlFor="nickname">Nama Panggilan</Label>
            <Input
              id="nickname"
              value={formData.nickname || ""}
              onChange={(e) => handleChange("nickname", e.target.value)}
              placeholder="Nama panggilan"
            />
          </div>

          <div>
            <Label htmlFor="nisn">NISN</Label>
            <Input
              id="nisn"
              type="text"
              maxLength="10"
              value={formData.nisn || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                handleChange("nisn", value);
              }}
              placeholder="10 digit NISN"
            />
            <p className="text-xs text-slate-500 mt-1">Hanya angka, maksimal 10 digit</p>
          </div>

          <div>
            <Label htmlFor="nik">NIK *</Label>
            <Input
              id="nik"
              type="text"
              maxLength="16"
              value={formData.nik || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                handleChange("nik", value);
              }}
              placeholder="16 digit NIK"
              className={errors.nik ? "border-red-500" : ""}
            />
            <p className="text-xs text-slate-500 mt-1">Hanya angka, maksimal 16 digit</p>
            {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik}</p>}
          </div>

          <div>
            <Label htmlFor="gender">Jenis Kelamin *</Label>
            <Select
              value={formData.gender || ""}
              onValueChange={(value) => handleChange("gender", value)}
            >
              <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                <SelectItem value="Perempuan">Perempuan</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
          </div>

          <div>
            <Label htmlFor="birth_place">Tempat Lahir *</Label>
            <Input
              id="birth_place"
              value={formData.birth_place || ""}
              onChange={(e) => handleChange("birth_place", e.target.value)}
              placeholder="Kota kelahiran"
              className={errors.birth_place ? "border-red-500" : ""}
            />
            {errors.birth_place && <p className="text-red-500 text-xs mt-1">{errors.birth_place}</p>}
          </div>

          <div>
            <Label htmlFor="birth_date">Tanggal Lahir *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date || ""}
              onChange={(e) => handleChange("birth_date", e.target.value)}
              className={errors.birth_date ? "border-red-500" : ""}
            />
            {errors.birth_date && <p className="text-red-500 text-xs mt-1">{errors.birth_date}</p>}
          </div>

          <div>
            <Label htmlFor="religion">Agama</Label>
            <Select
              value={formData.religion || "Islam"}
              onValueChange={(value) => handleChange("religion", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih agama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Islam">Islam</SelectItem>
                <SelectItem value="Kristen">Kristen</SelectItem>
                <SelectItem value="Katolik">Katolik</SelectItem>
                <SelectItem value="Hindu">Hindu</SelectItem>
                <SelectItem value="Buddha">Buddha</SelectItem>
                <SelectItem value="Konghucu">Konghucu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="citizenship">Kewarganegaraan</Label>
            <Select
              value={formData.citizenship || "WNI"}
              onValueChange={(value) => handleChange("citizenship", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kewarganegaraan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WNI">WNI</SelectItem>
                <SelectItem value="WNA">WNA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="child_order">Anak Ke-</Label>
            <Input
              id="child_order"
              type="number"
              min="1"
              value={formData.child_order || ""}
              onChange={(e) => handleChange("child_order", parseInt(e.target.value) || "")}
              placeholder="Urutan anak"
            />
          </div>

          <div>
            <Label htmlFor="siblings_count">Jumlah Saudara</Label>
            <Input
              id="siblings_count"
              type="number"
              min="0"
              value={formData.siblings_count || ""}
              onChange={(e) => handleChange("siblings_count", parseInt(e.target.value) || "")}
              placeholder="Jumlah saudara kandung"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Alamat Lengkap *</Label>
            <Textarea
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Alamat lengkap tempat tinggal"
              rows={2}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <Label htmlFor="rt">RT</Label>
            <Input
              id="rt"
              value={formData.rt || ""}
              onChange={(e) => handleChange("rt", e.target.value)}
              placeholder="RT"
            />
          </div>

          <div>
            <Label htmlFor="rw">RW</Label>
            <Input
              id="rw"
              value={formData.rw || ""}
              onChange={(e) => handleChange("rw", e.target.value)}
              placeholder="RW"
            />
          </div>

          <div>
            <Label htmlFor="province">Provinsi *</Label>
            <ManualInputSelect
              value={formData.province || ""}
              onValueChange={(value) => handleChange("province", value)}
              options={provinces}
              placeholder="Pilih provinsi"
              allowManual={true}
            />
          </div>

          <div>
            <Label htmlFor="city">Kota/Kabupaten *</Label>
            <ManualInputSelect
              value={formData.city || ""}
              onValueChange={(value) => handleChange("city", value)}
              options={cities}
              placeholder={!formData.province ? "Pilih provinsi dulu" : "Pilih kota/kabupaten"}
              disabled={!formData.province}
              allowManual={true}
            />
          </div>

          <div>
            <Label htmlFor="district">Kecamatan *</Label>
            <ManualInputSelect
              value={formData.district || ""}
              onValueChange={(value) => handleChange("district", value)}
              options={districts}
              placeholder={!formData.city ? "Pilih kota dulu" : "Pilih kecamatan"}
              disabled={!formData.city}
              allowManual={true}
            />
          </div>

          <div>
            <Label htmlFor="village">Kelurahan/Desa *</Label>
            <ManualInputSelect
              value={formData.village || ""}
              onValueChange={(value) => handleChange("village", value)}
              options={villages}
              placeholder={!formData.district ? "Pilih kecamatan dulu" : "Pilih kelurahan/desa"}
              disabled={!formData.district}
              allowManual={true}
            />
          </div>

          <div>
            <Label htmlFor="postal_code">Kode Pos</Label>
            <Input
              id="postal_code"
              value={formData.postal_code || ""}
              onChange={(e) => handleChange("postal_code", e.target.value)}
              placeholder="Kode pos"
            />
          </div>

          <div>
            <Label htmlFor="phone">No. Telepon/HP</Label>
            <Input
              id="phone"
              type="text"
              maxLength="13"
              value={formData.phone || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                handleChange("phone", value);
              }}
              placeholder="Nomor yang bisa dihubungi"
            />
            <p className="text-xs text-slate-500 mt-1">Hanya angka, maksimal 13 digit</p>
          </div>

          <div>
            <Label htmlFor="kip_kps_pkh">Memiliki KIP/KPS/PKH</Label>
            <Select
              value={formData.kip_kps_pkh || "Tidak"}
              onValueChange={(value) => handleChange("kip_kps_pkh", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ya">Ya</SelectItem>
                <SelectItem value="Tidak">Tidak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.kip_kps_pkh === "Ya" && (
            <div>
              <Label htmlFor="kip_kps_pkh_number">Nomor Kartu KIP/KPS/PKH</Label>
              <Input
                id="kip_kps_pkh_number"
                value={formData.kip_kps_pkh_number || ""}
                onChange={(e) => handleChange("kip_kps_pkh_number", e.target.value)}
                placeholder="Masukkan nomor kartu"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}