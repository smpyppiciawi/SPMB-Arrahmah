import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, BookOpen, Shirt, CreditCard } from "lucide-react";

export default function ProcessStatus({ students }) {
  const calculateStats = () => {
    const total = students.length || 1;
    
    const interviewDone = students.filter(s => s.interview_status === "lulus" || s.interview_status === "tidak_lulus").length;
    const quranDone = students.filter(s => s.quran_test_status === "lulus" || s.quran_test_status === "tidak_lulus").length;
    const uniformDone = students.filter(s => s.uniform_batik_size).length;
    const paymentDone = students.filter(s => s.payment_status === "lunas" || s.payment_status === "dp").length;

    return [
      {
        name: "Wawancara",
        icon: MessageSquare,
        done: interviewDone,
        total: total,
        color: "bg-blue-500",
      },
      {
        name: "Tes Mengaji",
        icon: BookOpen,
        done: quranDone,
        total: total,
        color: "bg-green-500",
      },
      {
        name: "Ukur Baju",
        icon: Shirt,
        done: uniformDone,
        total: total,
        color: "bg-purple-500",
      },
      {
        name: "Pembayaran",
        icon: CreditCard,
        done: paymentDone,
        total: total,
        color: "bg-orange-500",
      },
    ];
  };

  const stats = calculateStats();

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Status Proses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <stat.icon size={16} className="text-slate-500" />
                <span className="font-medium text-slate-700">{stat.name}</span>
              </div>
              <span className="text-slate-500">
                {stat.done}/{stat.total}
              </span>
            </div>
            <Progress
              value={(stat.done / stat.total) * 100}
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}