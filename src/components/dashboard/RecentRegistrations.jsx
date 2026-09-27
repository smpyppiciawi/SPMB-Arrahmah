import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, User } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  verified: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  pending: "Pending",
  verified: "Terverifikasi",
  accepted: "Diterima",
  rejected: "Ditolak",
};

export default function RecentRegistrations({ students }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Pendaftaran Terbaru
        </CardTitle>
        <Link to={createPageUrl("StudentList")}>
          <Button variant="ghost" size="sm" className="text-[#1e3a5f] hover:text-[#2d5a8a]">
            Lihat Semua
            <ArrowRight size={16} className="ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {students.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Belum ada pendaftaran</p>
          ) : (
            students.slice(0, 5).map((student) => (
              <Link
                key={student.id}
                to={createPageUrl(`StudentDetail?id=${student.id}`)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User size={20} className="text-[#1e3a5f]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 group-hover:text-[#1e3a5f]">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {student.registration_number} • {student.registration_date && format(new Date(student.registration_date), "d MMM yyyy", { locale: id })}
                    </p>
                  </div>
                </div>
                <Badge className={`${statusColors[student.status]} border`}>
                  {statusLabels[student.status]}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}