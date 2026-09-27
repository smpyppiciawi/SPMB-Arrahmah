import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Save, X, Loader2, MapPin, Navigation } from "lucide-react";
import L from "leaflet";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? <Marker position={position}><Popup>Lokasi Pengukuran</Popup></Marker> : null;
}

export default function PeriodicForm({ record, students, onCancel }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    student_id: "",
    student_name: "",
    measurement_date: new Date().toISOString().split("T")[0],
    height: "",
    weight: "",
    blood_type: "",
    head_circumference: "",
    latitude: "",
    longitude: "",
    location_address: "",
  });
  const [mapPosition, setMapPosition] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData(record);
      if (record.latitude && record.longitude) {
        setMapPosition([record.latitude, record.longitude]);
      }
    }
  }, [record]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Update student_name when student_id changes
    if (field === "student_id") {
      const selectedStudent = students.find((s) => s.id === value);
      if (selectedStudent) {
        setFormData((prev) => ({ ...prev, student_name: selectedStudent.full_name }));
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapPosition([latitude, longitude]);
          setFormData((prev) => ({
            ...prev,
            latitude,
            longitude,
          }));
          setGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Tidak dapat mengambil lokasi. Pastikan GPS diaktifkan.");
          setGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation tidak didukung oleh browser Anda.");
    }
  };

  useEffect(() => {
    if (mapPosition) {
      setFormData((prev) => ({
        ...prev,
        latitude: mapPosition[0],
        longitude: mapPosition[1],
      }));
    }
  }, [mapPosition]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (record) {
        return base44.entities.StudentPeriodic.update(record.id, data);
      }
      return base44.entities.StudentPeriodic.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodicRecords"] });
      onCancel();
    },
  });

  const handleSubmit = () => {
    if (!formData.student_id || !formData.measurement_date) {
      alert("Mohon pilih siswa dan tanggal pengukuran");
      return;
    }
    saveMutation.mutate(formData);
  };

  const defaultCenter = [-6.2088, 106.8456]; // Jakarta coordinates

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-[#1e3a5f] text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2">
          <MapPin size={20} />
          {record ? "Edit Data Periodik" : "Tambah Data Periodik"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Student Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="student_id">Pilih Siswa *</Label>
            <Select
              value={formData.student_id}
              onValueChange={(value) => handleChange("student_id", value)}
              disabled={!!record}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih siswa" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} - {student.registration_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="measurement_date">Tanggal Pengukuran *</Label>
            <Input
              type="date"
              value={formData.measurement_date}
              onChange={(e) => handleChange("measurement_date", e.target.value)}
            />
          </div>
        </div>

        {/* Measurements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="height">Tinggi Badan (cm)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Contoh: 150.5"
              value={formData.height}
              onChange={(e) => handleChange("height", parseFloat(e.target.value) || "")}
            />
          </div>

          <div>
            <Label htmlFor="weight">Berat Badan (kg)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Contoh: 45.5"
              value={formData.weight}
              onChange={(e) => handleChange("weight", parseFloat(e.target.value) || "")}
            />
          </div>

          <div>
            <Label htmlFor="blood_type">Golongan Darah</Label>
            <Select
              value={formData.blood_type}
              onValueChange={(value) => handleChange("blood_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih golongan darah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="AB">AB</SelectItem>
                <SelectItem value="O">O</SelectItem>
                <SelectItem value="Tidak Tahu">Tidak Tahu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="head_circumference">Lingkar Kepala (cm)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Contoh: 52.5"
              value={formData.head_circumference}
              onChange={(e) => handleChange("head_circumference", parseFloat(e.target.value) || "")}
            />
          </div>
        </div>

        {/* Location Coordinates */}
        <div>
          <Label>Titik Koordinat (Maps)</Label>
          <div className="flex gap-2 mb-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={gettingLocation}
              className="gap-2"
            >
              {gettingLocation ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mendapatkan Lokasi...
                </>
              ) : (
                <>
                  <Navigation size={16} />
                  Gunakan Lokasi Saat Ini
                </>
              )}
            </Button>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  handleChange("latitude", lat || "");
                  if (lat && formData.longitude) {
                    setMapPosition([lat, formData.longitude]);
                  }
                }}
              />
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  handleChange("longitude", lng || "");
                  if (lng && formData.latitude) {
                    setMapPosition([formData.latitude, lng]);
                  }
                }}
              />
            </div>
          </div>

          <div className="h-80 rounded-xl overflow-hidden border-2 border-slate-200">
            <MapContainer
              center={mapPosition || defaultCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={mapPosition} setPosition={setMapPosition} />
            </MapContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Klik pada peta untuk menandai lokasi pengukuran
          </p>
        </div>

        <div>
          <Label htmlFor="location_address">Alamat Lokasi Pengukuran</Label>
          <Input
            placeholder="Contoh: Ruang UKS, SMP YPPI Arrahmah"
            value={formData.location_address}
            onChange={(e) => handleChange("location_address", e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X size={16} className="mr-2" />
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="bg-[#1e3a5f] hover:bg-[#2d5a8a]"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Simpan Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}