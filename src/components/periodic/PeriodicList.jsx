import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Search, MapPin, Ruler, Weight, Droplet, Circle as CircleIcon, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PeriodicList({ records, students, onEdit, isLoading }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = records.filter((record) =>
    record.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentInfo = (studentId) => {
    return students.find((s) => s.id === studentId);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8a] text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} />
            Daftar Data Periodik
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={18} />
            <Input
              placeholder="Cari nama siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Memuat data...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchTerm ? "Tidak ada data yang sesuai dengan pencarian" : "Belum ada data periodik"}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRecords.map((record) => {
              const student = getStudentInfo(record.student_id);
              return (
                <Card key={record.id} className="border-2 border-slate-100 hover:border-[#1e3a5f] transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800">{record.student_name}</h3>
                        {student && (
                          <p className="text-sm text-slate-500">{student.registration_number}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {format(new Date(record.measurement_date), "dd MMM yyyy")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(record)}
                        className="gap-2"
                      >
                        <Edit size={14} />
                        Edit
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {record.height && (
                        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                          <Ruler size={18} className="text-blue-600" />
                          <div>
                            <p className="text-xs text-blue-600 font-medium">Tinggi</p>
                            <p className="text-lg font-bold text-blue-900">{record.height} cm</p>
                          </div>
                        </div>
                      )}

                      {record.weight && (
                        <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                          <Weight size={18} className="text-green-600" />
                          <div>
                            <p className="text-xs text-green-600 font-medium">Berat</p>
                            <p className="text-lg font-bold text-green-900">{record.weight} kg</p>
                          </div>
                        </div>
                      )}

                      {record.blood_type && (
                        <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg">
                          <Droplet size={18} className="text-red-600" />
                          <div>
                            <p className="text-xs text-red-600 font-medium">Gol. Darah</p>
                            <p className="text-lg font-bold text-red-900">{record.blood_type}</p>
                          </div>
                        </div>
                      )}

                      {record.head_circumference && (
                        <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-lg">
                          <CircleIcon size={18} className="text-purple-600" />
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Lingkar Kepala</p>
                            <p className="text-lg font-bold text-purple-900">{record.head_circumference} cm</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {(record.latitude && record.longitude) && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="font-mono text-xs">
                            {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                          </span>
                        </div>
                        {record.location_address && (
                          <p className="text-sm text-slate-500 mt-1 ml-6">{record.location_address}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}