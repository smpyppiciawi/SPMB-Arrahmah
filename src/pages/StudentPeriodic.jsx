import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, User, Plus, Activity, Save, Loader2, MapPin, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  React.useEffect(() => {
    if (position) map.flyTo(position, map.getZoom());
  }, [position, map]);
  return position ? <Marker position={position}><Popup>Lokasi Pengukuran</Popup></Marker> : null;
}

const emptyForm = {
  student_id: "", student_name: "",
  measurement_date: new Date().toISOString().split("T")[0],
  height: "", weight: "", blood_type: "", head_circumference: "",
  latitude: "", longitude: "", location_address: "",
};

export default function StudentPeriodic() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null); // null = closed, {} = new, record = edit
  const [formData, setFormData] = useState(emptyForm);
  const [mapPosition, setMapPosition] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { data: periodicRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ["periodicRecords"],
    queryFn: () => base44.entities.StudentPeriodic.list("-measurement_date", 1000),
    staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => base44.entities.Student.list("full_name", 1000),
    staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false,
  });

  const isLoading = loadingRecords || loadingStudents;

  // Group records by student, keep only latest per student
  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  const latestByStudent = {};
  periodicRecords.forEach(r => {
    if (!studentMap[r.student_id]) return;
    if (!latestByStudent[r.student_id] ||
      new Date(r.measurement_date) > new Date(latestByStudent[r.student_id].measurement_date)) {
      latestByStudent[r.student_id] = r;
    }
  });

  const recordCountByStudent = {};
  periodicRecords.forEach(r => {
    if (!studentMap[r.student_id]) return;
    recordCountByStudent[r.student_id] = (recordCountByStudent[r.student_id] || 0) + 1;
  });

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.registration_number?.toLowerCase().includes(search.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: (data) => selectedRecord?.id
      ? base44.entities.StudentPeriodic.update(selectedRecord.id, data)
      : base44.entities.StudentPeriodic.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodicRecords"] });
      setSelectedRecord(null);
    },
  });

  const openNew = (student) => {
    setFormData({ ...emptyForm, student_id: student.id, student_name: student.full_name });
    setMapPosition(null);
    setSelectedRecord({});
  };

  const openEdit = (record) => {
    setFormData(record);
    setMapPosition(record.latitude && record.longitude ? [record.latitude, record.longitude] : null);
    setSelectedRecord(record);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (mapPosition) {
      setFormData(prev => ({ ...prev, latitude: mapPosition[0], longitude: mapPosition[1] }));
    }
  }, [mapPosition]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation tidak didukung."); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMapPosition([coords.latitude, coords.longitude]);
        setGettingLocation(false);
      },
      () => { alert("Tidak dapat mengambil lokasi."); setGettingLocation(false); }
    );
  };

  const handleSubmit = () => {
    if (!formData.student_id || !formData.measurement_date) {
      alert("Mohon pilih siswa dan tanggal pengukuran");
      return;
    }
    saveMutation.mutate(formData);
  };

  const totalUniqueStudents = Object.keys(latestByStudent).length;
  const totalRecords = periodicRecords.filter(r => studentMap[r.student_id]).length;

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Periodik Siswa</h1>
        <p className="text-slate-500">Data pengukuran kesehatan berkala siswa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-slate-600">Total Siswa</p>
          <p className="text-2xl font-bold text-blue-600">{students.length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-slate-600">Sudah Diukur</p>
          <p className="text-2xl font-bold text-green-600">{totalUniqueStudents}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-slate-600">Total Rekap Data</p>
          <p className="text-2xl font-bold text-purple-600">{totalRecords}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Cari nama atau nomor pendaftaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const latest = latestByStudent[student.id];
          const count = recordCountByStudent[student.id] || 0;
          return (
            <Card key={student.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center overflow-hidden shrink-0">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="" className="w-12 h-12 object-cover" />
                    ) : (
                      <User size={24} className="text-[#1e3a5f]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{student.full_name}</p>
                    <p className="text-xs text-slate-400">{student.registration_number}</p>
                    {latest ? (
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        {latest.height && <span>TB: {latest.height} cm</span>}
                        {latest.weight && <span>BB: {latest.weight} kg</span>}
                        <span className="text-slate-400">{format(new Date(latest.measurement_date), "d MMM yyyy", { locale: id })}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">Belum ada data</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {count > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-xs">{count}x</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      onClick={() => openNew(student)}
                    >
                      <Plus size={12} className="mr-1" />
                      Tambah
                    </Button>
                    {latest && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-slate-500"
                        onClick={() => openEdit(latest)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Form */}
      <Dialog open={selectedRecord !== null} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Activity size={20} />
              {selectedRecord?.id ? "Edit Data Periodik" : "Tambah Data Periodik"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Student info */}
            {formData.student_id && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-semibold text-slate-800">{formData.student_name}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tanggal Pengukuran *</Label>
                <Input type="date" value={formData.measurement_date}
                  onChange={(e) => handleChange("measurement_date", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Golongan Darah</Label>
                <Select value={formData.blood_type} onValueChange={(v) => handleChange("blood_type", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {["A","B","AB","O","Tidak Tahu"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tinggi Badan (cm)</Label>
                <Input type="number" step="0.1" placeholder="150.5" value={formData.height}
                  onChange={(e) => handleChange("height", parseFloat(e.target.value) || "")} className="mt-1" />
              </div>
              <div>
                <Label>Berat Badan (kg)</Label>
                <Input type="number" step="0.1" placeholder="45.5" value={formData.weight}
                  onChange={(e) => handleChange("weight", parseFloat(e.target.value) || "")} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Lingkar Kepala (cm)</Label>
                <Input type="number" step="0.1" placeholder="52.5" value={formData.head_circumference}
                  onChange={(e) => handleChange("head_circumference", parseFloat(e.target.value) || "")} className="mt-1" />
              </div>
            </div>

            {/* Koordinat */}
            <div>
              <Label>Titik Koordinat (Opsional)</Label>
              <div className="flex gap-2 mt-1 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation}
                  disabled={gettingLocation} className="gap-1 shrink-0">
                  {gettingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  Lokasi Saat Ini
                </Button>
                <Input type="number" step="any" placeholder="Latitude" value={formData.latitude}
                  onChange={(e) => { const lat = parseFloat(e.target.value); handleChange("latitude", lat || ""); if (lat && formData.longitude) setMapPosition([lat, formData.longitude]); }} />
                <Input type="number" step="any" placeholder="Longitude" value={formData.longitude}
                  onChange={(e) => { const lng = parseFloat(e.target.value); handleChange("longitude", lng || ""); if (lng && formData.latitude) setMapPosition([formData.latitude, lng]); }} />
              </div>
              <div className="h-48 rounded-lg overflow-hidden border border-slate-200">
                <MapContainer center={mapPosition || [-6.2088, 106.8456]} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                </MapContainer>
              </div>
              <p className="text-xs text-slate-400 mt-1">Klik peta untuk menandai lokasi</p>
            </div>

            <div>
              <Label>Alamat Lokasi</Label>
              <Input placeholder="Contoh: Ruang UKS, SMP YPPI Arrahmah" value={formData.location_address}
                onChange={(e) => handleChange("location_address", e.target.value)} className="mt-1" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>Batal</Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending}
                className="bg-[#1e3a5f] hover:bg-[#2d5a8a] gap-2">
                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}