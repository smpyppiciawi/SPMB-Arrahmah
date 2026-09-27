import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function CompletionChart({ students }) {
  const calculateCompletion = () => {
    let complete = 0;
    let incomplete = 0;

    students.forEach((student) => {
      const docsComplete =
        student.doc_birth_certificate &&
        student.doc_family_card &&
        student.doc_ktp_father &&
        student.doc_ktp_mother &&
        student.doc_photo_3x4;

      if (docsComplete) complete++;
      else incomplete++;
    });

    return [
      { name: "Lengkap", value: complete, color: "#22c55e" },
      { name: "Belum Lengkap", value: incomplete, color: "#f59e0b" },
    ];
  };

  const data = calculateCompletion();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Kelengkapan Berkas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} siswa`, ""]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-slate-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}