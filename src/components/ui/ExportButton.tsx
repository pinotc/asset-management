// src/components/ui/ExportButton.tsx
"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    // Chuyển hướng trình duyệt đến API để tải file
    window.location.href = "/api/export/assets";
    
    // Tắt trạng thái loading sau 2 giây
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <Download className={`h-4 w-4 ${isExporting ? 'animate-bounce' : ''}`} />
      {isExporting ? "Đang xuất file..." : "Xuất báo cáo Excel"}
    </button>
  );
}