//src\app\(dashboard)\audit\scanner\page.tsx
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { submitAuditScan } from "@/actions/audit.actions";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, FileQuestion, ScanLine, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Lock } from "lucide-react";

function ScannerContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notes, setNotes] = useState("");
  
  // Ref để hứng thao tác từ súng quét barcode
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Luôn focus vào input ẩn để súng quét hoạt động ngay khi mở web
    if (!scannedCode) inputRef.current?.focus();
  }, [scannedCode]);

  if (!sessionId) return <div className="p-10 text-center font-bold text-red-500">Lỗi: Không tìm thấy mã Phiên kiểm kê!</div>;

  const handleScan = (text: string) => {
    if (text && text !== scannedCode && !isLoading) {
      setScannedCode(text.trim());
      setMessage(null);
      setNotes("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault();
      handleScan(e.currentTarget.value);
      e.currentTarget.value = ""; // Xóa input sau khi quét
    }
  };

  const handleAction = async (status: "FOUND" | "DAMAGED" | "WRONG_LOCATION" | "NOT_FOUND") => {
    if (!scannedCode) return;
    setIsLoading(true);
    
    const result = await submitAuditScan(scannedCode, sessionId, status, notes);
    
    if (result.success) {
      setMessage({ type: "success", text: `Đã lưu: ${result.assetName || scannedCode}` });
    } else {
      setMessage({ type: "error", text: result.error || "Lỗi lưu dữ liệu" });
    }
    
    setTimeout(() => {
      setScannedCode(null);
      setMessage(null);
      setIsLoading(false);
      setNotes("");
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto h-full flex flex-col space-y-4 px-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <Link href="/audit" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Máy Quét MES</h1>
          <p className="text-xs text-samsung font-semibold truncate">Mã đợt: {sessionId}</p>
        </div>
      </div>

      {/* Input ẩn hứng súng quét Barcode */}
      <input 
        type="text" 
        ref={inputRef} 
        onKeyDown={handleKeyDown} 
        className="absolute opacity-0 w-0 h-0" 
        placeholder="Hidden barcode input" 
        autoFocus
      />

      {/* Camera & Result Area */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-3/4 border-4 border-gray-800 shadow-xl">
        {!scannedCode ? (
          <div className="absolute inset-0">
            <Scanner onScan={(result) => result && handleScan(result[0].rawValue)} components={{ finder: false }} styles={{ container: { width: '100%', height: '100%' } }} />
            <div className="absolute inset-0 pointer-events-none border-40px] border-black/40 z-10 flex items-center justify-center">
              <div className="w-full h-1/2 border-2 border-dashed border-white/50 rounded-lg"></div>
            </div>
            <div className="absolute bottom-4 left-0 w-full text-center text-white/70 text-xs z-20">Đưa camera vào QR hoặc dùng súng quét mã vạch</div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-blue-900/95 flex flex-col items-center justify-center p-6 text-white text-center z-20">
            <ScanLine className="h-16 w-16 text-blue-300 mb-4 animate-pulse" />
            <p className="text-sm opacity-80 uppercase tracking-wider">Đã nhận mã tài sản</p>
            <p className="text-2xl font-bold mt-1 mb-6">{scannedCode}</p>
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-blue-200" />}
          </div>
        )}
      </div>

      {/* Thông báo */}
      {message && (
        <div className={`p-3 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Giao diện Hành động (Chỉ hiện khi đã quét mã) */}
      <div className={`transition-all duration-300 ${scannedCode && !isLoading && !message ? "opacity-100 translate-y-0 block" : "opacity-0 translate-y-4 hidden"}`}>
        <input 
          type="text" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Thêm ghi chú tình trạng (nếu có)..." 
          className="w-full p-3 mb-4 border border-gray-300 rounded-xl outline-none focus:border-samsung text-sm"
        />
        
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Xác nhận tình trạng tài sản:</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleAction("FOUND")} className="flex flex-col items-center gap-1.5 bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition">
            <CheckCircle2 className="h-6 w-6" /> <span className="text-xs font-bold">BÌNH THƯỜNG</span>
          </button>
          <button onClick={() => handleAction("DAMAGED")} className="flex flex-col items-center gap-1.5 bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition">
            <XCircle className="h-6 w-6" /> <span className="text-xs font-bold">HƯ HỎNG</span>
          </button>
          <button onClick={() => handleAction("WRONG_LOCATION")} className="flex flex-col items-center gap-1.5 bg-amber-500 text-white p-3 rounded-xl hover:bg-amber-600 transition">
            <AlertTriangle className="h-5 w-5" /> <span className="text-xs font-bold">SAI VỊ TRÍ</span>
          </button>
          <button onClick={() => handleAction("NOT_FOUND")} className="flex flex-col items-center gap-1.5 bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition">
            <FileQuestion className="h-5 w-5" /> <span className="text-xs font-bold">MẤT TÍCH</span>
          </button>
        </div>
        <button onClick={() => setScannedCode(null)} className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-800 underline">
          Hủy & Quét máy khác
        </button>
      </div>
    </div>
  );
}

export default function AuditScannerPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading scanner...</div>}><ScannerContent /></Suspense>;
}