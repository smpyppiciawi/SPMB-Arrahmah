import React, { useState, useEffect } from "react";
import { WifiOff, CloudUpload } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
      <WifiOff size={16} />
      <span>Mode Offline — data tersimpan lokal dan akan tersinkron otomatis saat koneksi kembali</span>
      <CloudUpload size={16} className="animate-pulse" />
    </div>
  );
}