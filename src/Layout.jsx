import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FileText,
  MessageSquare,
  Shirt,
  BookOpen,
  CheckSquare,
  CreditCard,
  Menu,
  X,
  GraduationCap,
  LogOut,
  ChevronDown,
  Clock,
  BarChart3 } from
"lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const userRole = user?.role;
  const isFullAccess = userRole === "admin" || userRole === "panitia";

  const allMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Pendaftaran Baru", icon: UserPlus, page: "Registration" },
  { name: "Data Siswa", icon: Users, page: "StudentList" },
  { name: "Waiting List", icon: Clock, page: "WaitingList" },
  { name: "Periodik Siswa", icon: BarChart3, page: "StudentPeriodic" },
  { name: "Wawancara", icon: MessageSquare, page: "Interview" },
  { name: "Tes Mengaji", icon: BookOpen, page: "QuranTest" },
  { name: "Rapat Orang Tua", icon: Users, page: "ParentMeeting" },
  { name: "Ukur Baju", icon: Shirt, page: "UniformMeasurement" },
  { name: "Ceklis Berkas", icon: CheckSquare, page: "DocumentChecklist" },
  { name: "Pembiayaan", icon: CreditCard, page: "PaymentNew" },
  { name: "Buku Induk", icon: FileText, page: "StudentBook" }];

  // Interviewer hanya bisa akses Dashboard & Wawancara
  const menuItems = isFullAccess ?
  allMenuItems :
  allMenuItems.filter((item) => item.page === "Dashboard" || item.page === "Interview");

  // Route guard: redirect interviewer away from restricted pages
  const allowedPagesForInterviewer = ["Dashboard", "Interview", "StudentDetail"];
  useEffect(() => {
    if (user && !isFullAccess && !allowedPagesForInterviewer.includes(currentPageName)) {
      navigate(createPageUrl("Dashboard"), { replace: true });
    }
  }, [user, currentPageName, isFullAccess, navigate]);


  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: #1e3a5f;
          --primary-light: #2d5a8a;
          --accent: #d4af37;
          --accent-light: #e8c75a;
        }
      `}</style>

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#1e3a5f] text-white z-50 flex items-center justify-between px-4 lg:px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">

            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#d4af37] rounded-full flex items-center justify-center">
              <GraduationCap size={24} className="text-[#1e3a5f]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight">SPMB SEKOLAH</h1>
              <p className="text-white/100 text-xs">Penerimaan Peserta Didik Baru</p>
            </div>
          </div>
        </div>

        {user &&
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10 gap-2">
                <div className="w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center text-[#1e3a5f] font-bold">
                  {user.full_name?.charAt(0) || user.email?.charAt(0)}
                </div>
                <span className="hidden sm:inline">{user.full_name || user.email}</span>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut size={16} className="mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`
        }>

        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {menuItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive ?
                "bg-[#1e3a5f] text-white shadow-md" :
                "text-slate-600 hover:bg-slate-100 hover:text-[#1e3a5f]"}`
                }>

                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>);

          })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        onClick={() => setSidebarOpen(false)} />

      }

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>);

}