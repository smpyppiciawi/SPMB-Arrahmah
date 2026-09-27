import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RegistrationForm({ formData, setFormData, errors = {} }) {
  const [officers, setOfficers] = useState(["Gustini", "Ibnu Hasan"]);
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [newOfficer, setNewOfficer] = useState("");

  useEffect(() => {
    if (formData.registration_date) {
      const date = new Date(formData.registration_date);
      const month = date.getMonth();
      const autoWave = month < 2 ? "Gelombang 1" : "Gelombang 2";
      if (!formData.wave || formData.wave !== autoWave) {
        setFormData((prev) => ({ ...prev, wave: autoWave }));
      }
    }
  }, [formData.registration_date]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddOfficer = () => {
    const trimmed = newOfficer.trim();
    if (!trimmed) return;
    if (!officers.includes(trimmed)) {
      setOfficers((prev) => [...prev, trimmed]);
    }
    handleChange("registration_officer", trimmed);
    setNewOfficer("");
    setShowAddOfficer(false);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-[#d4af37] text-[#1e3a5f] rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar size={20} />
          Informasi Pendaftaran
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Nama Petugas — paling atas, wajib */}
        <div>
          <Label htmlFor="registration_officer">Nama Petugas *</Label>
          <div className="flex gap-2 mt-1">
            <Select
              value={formData.registration_officer || ""}
              onValueChange={(value) => handleChange("registration_officer", value)}
            >
              <SelectTrigger className={`flex-1 ${errors.registration_officer ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Pilih petugas" />
              </SelectTrigger>
              <SelectContent>
                {officers.map((officer) => (
                  <SelectItem key={officer} value={officer}>{officer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowAddOfficer(true)}
              title="Tambah petugas baru"
            >
              <Plus size={16} />
            </Button>
          </div>
          {errors.registration_officer && (
            <p className="text-red-500 text-xs mt-1">{errors.registration_officer}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="registration_date">Tanggal Daftar *</Label>
            <Input
              id="registration_date"
              type="date"
              value={formData.registration_date || ""}
              onChange={(e) => handleChange("registration_date", e.target.value)}
              className={`mt-1 ${errors.registration_date ? "border-red-500" : ""}`}
            />
            {errors.registration_date && (
              <p className="text-red-500 text-xs mt-1">{errors.registration_date}</p>
            )}
          </div>

          <div>
            <Label htmlFor="wave">Gelombang *</Label>
            <Select
              value={formData.wave || ""}
              onValueChange={(value) => handleChange("wave", value)}
            >
              <SelectTrigger className={`mt-1 ${errors.wave ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Pilih gelombang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gelombang 1">Gelombang 1 (Jan-Feb)</SelectItem>
                <SelectItem value="Gelombang 2">Gelombang 2 (Mar-Des)</SelectItem>
              </SelectContent>
            </Select>
            {errors.wave && <p className="text-red-500 text-xs mt-1">{errors.wave}</p>}
            <p className="text-xs text-slate-500 mt-1">Terisi otomatis berdasarkan tanggal daftar</p>
          </div>
        </div>
      </CardContent>

      <Dialog open={showAddOfficer} onOpenChange={setShowAddOfficer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Nama Petugas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newOfficer">Nama Petugas Baru</Label>
            <Input
              id="newOfficer"
              value={newOfficer}
              onChange={(e) => setNewOfficer(e.target.value)}
              placeholder="Masukkan nama petugas"
              className="mt-1"
              onKeyDown={(e) => { if (e.key === "Enter") handleAddOfficer(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOfficer(false)}>Batal</Button>
            <Button onClick={handleAddOfficer} disabled={!newOfficer.trim()}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}