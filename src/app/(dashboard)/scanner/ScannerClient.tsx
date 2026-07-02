// src/app/(dashboard)/audit/scanner/ScannerClient.tsx
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { submitAuditScan } from "@/actions/audit.actions";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, FileQuestion, ScanLine, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

type AuditAction = "FOUND" | "DAMAGED" | "WRONG_LOCATION" | "NOT_FOUND" | null;

interface ScannerClientProps {
  locations: { id: string; name: string }[];
}

function ScannerContent({ locations }: ScannerClientProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // STATE CHO UI ĐỘNG
  const [pendingAction, setPendingAction] = useState<AuditAction>(null);
  const [notes, setNotes] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!scannedCode) inputRef.current?.focus();
  }, [scannedCode]);

  if (!sessionId) return <div className="p-10 text-center font-bold text-red-500">Lỗi: Không tìm thấy mã Phiên kiểm kê!</div>;

  const handleScan = (text: string) => {
    if (text && text !== scannedCode && !isLoading) {
      setScannedCode(text.trim());
      setMessage(null);
      setPendingAction(null);
      setNotes("");
      setSelectedLocationId("");
      setShowConfirmModal(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault();
      handleScan(e.currentTarget.value);
      e.currentTarget.value = ""; 
    }
  };

  // HÀM XỬ LÝ CHÍNH KHI BẤM NÚT SUBMIT CUỐI CÙNG
  const executeSubmit = async (status: AuditAction) => {
    if (!scannedCode || !status) return;
    
    // Validate trước khi gửi
    if (status === "DAMAGED" && !notes.trim()) {
      alert("Vui lòng nhập mô tả tình trạng hư hỏng!");
      return;
    }
    if (status === "WRONG_LOCATION" && !selectedLocationId) {
      alert("Vui lòng chọn vị trí thực tế của thiết bị!");
      return;
    }
    if (status === "NOT_FOUND" && !notes.trim()) {
      alert("Vui lòng nhập lý do/ghi chú khi báo mất tài sản!");
      return;
    }

    setIsLoading(true);
    setShowConfirmModal(false);
    
    const result = await submitAuditScan(scannedCode, sessionId, status, notes, selectedLocationId);
    
    if (result.success) {
      setMessage({ type: "success", text: `Đã lưu: ${result.assetName || scannedCode}` });
    } else {
      setMessage({ type: "error", text: result.error || "Lỗi lưu dữ liệu" });
    }
    
    setTimeout(() => {
      setScannedCode(null);
      setMessage(null);
      setIsLoading(false);
      setPendingAction(null);
      setNotes("");
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto h-full flex flex-col space-y-4 px-4 pb-8 relative">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <Link href="/audit" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Máy Quét MES</h1>
          <p className="text-xs text-samsung font-semibold truncate">Mã đợt: {sessionId}</p>
        </div>
      </div>

      <input type="text" ref={inputRef} onKeyDown={handleKeyDown} className="absolute opacity-0 w-0 h-0" autoFocus />

      {/* Camera Area */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-3/4 border-4 border-gray-800 shadow-xl shrink-0">
        {!scannedCode ? (
          <div className="absolute inset-0">
            <Scanner onScan={(result) => result && handleScan(result[0].rawValue)} components={{ finder: false }} styles={{ container: { width: '100%', height: '100%' } }} />
            <div className="absolute inset-0 pointer-events-none border-40px border-black/40 z-10 flex items-center justify-center">
              <div className="w-full h-1/2 border-2 border-dashed border-white/50 rounded-lg"></div>
            </div>
            <div className="absolute bottom-4 left-0 w-full text-center text-white/70 text-xs z-20">Đưa camera vào QR hoặc dùng súng quét mã vạch</div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-blue-900/95 flex flex-col items-center justify-center p-6 text-white text-center z-20">
            <ScanLine className="h-16 w-16 text-blue-300 mb-4 animate-pulse" />
            <p className="text-sm opacity-80 uppercase tracking-wider">Đã nhận mã tài sản</p>
            <p className="text-3xl font-bold mt-1 mb-6 text-yellow-400">{scannedCode}</p>
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-blue-200" />}
          </div>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2 ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          {message.text}
        </div>
      )}

      {/* Giao diện Hành động (Chỉ hiện khi đã quét mã và chưa submit) */}
      {scannedCode && !isLoading && !message && (
        <div className="transition-all duration-300">
          
          {/* BƯỚC 1: CHỌN TÌNH TRẠNG */}
          {!pendingAction ? (
            <>
              <h3 className="text-sm font-bold text-gray-700 mb-3 text-center uppercase tracking-wider">Xác nhận tình trạng:</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPendingAction("FOUND")} className="flex flex-col items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-xl hover:bg-emerald-500 hover:text-white transition group">
                  <CheckCircle2 className="h-6 w-6 group-hover:scale-110 transition-transform" /> <span className="text-xs font-bold">BÌNH THƯỜNG</span>
                </button>
                <button onClick={() => setPendingAction("DAMAGED")} className="flex flex-col items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 p-3 rounded-xl hover:bg-orange-500 hover:text-white transition group">
                  <XCircle className="h-6 w-6 group-hover:scale-110 transition-transform" /> <span className="text-xs font-bold">HƯ HỎNG</span>
                </button>
                <button onClick={() => setPendingAction("WRONG_LOCATION")} className="flex flex-col items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 p-3 rounded-xl hover:bg-amber-500 hover:text-white transition group">
                  <AlertTriangle className="h-6 w-6 group-hover:scale-110 transition-transform" /> <span className="text-xs font-bold">SAI VỊ TRÍ</span>
                </button>
                <button onClick={() => setPendingAction("NOT_FOUND")} className="flex flex-col items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl hover:bg-red-500 hover:text-white transition group">
                  <FileQuestion className="h-6 w-6 group-hover:scale-110 transition-transform" /> <span className="text-xs font-bold">MẤT TÍCH</span>
                </button>
              </div>
            </>
          ) : (
            
            /* BƯỚC 2: FORM ĐỘNG DỰA VÀO TÌNH TRẠNG ĐÃ CHỌN */
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-sm font-bold text-gray-700">
                  {pendingAction === "FOUND" && "Tài sản Bình thường"}
                  {pendingAction === "DAMAGED" && "Báo cáo Hư hỏng (Tạo tự động phiếu sửa chữa)"}
                  {pendingAction === "WRONG_LOCATION" && "Cập nhật Vị trí mới"}
                  {pendingAction === "NOT_FOUND" && "Báo cáo Mất tài sản"}
                </span>
                <button onClick={() => setPendingAction(null)} className="text-xs font-bold text-samsung hover:underline">Đổi lại</button>
              </div>

              {/* Dynamic Fields */}
              {pendingAction === "WRONG_LOCATION" && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Chọn vị trí thực tế phát hiện:</label>
                  <select 
                    value={selectedLocationId} 
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-samsung text-sm bg-white"
                  >
                    <option value="">-- Vui lòng chọn vị trí --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(pendingAction === "DAMAGED" || pendingAction === "NOT_FOUND" || pendingAction === "WRONG_LOCATION") && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    {pendingAction === "DAMAGED" ? "Mô tả chi tiết hư hỏng (*):" : "Ghi chú thêm:"}
                  </label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Nhập thông tin tại đây..." 
                    rows={2}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-samsung text-sm resize-none bg-white"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button 
                onClick={() => pendingAction === "NOT_FOUND" ? setShowConfirmModal(true) : executeSubmit(pendingAction)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white transition ${
                  pendingAction === "FOUND" ? "bg-emerald-600 hover:bg-emerald-700" :
                  pendingAction === "DAMAGED" ? "bg-orange-600 hover:bg-orange-700" :
                  pendingAction === "WRONG_LOCATION" ? "bg-amber-600 hover:bg-amber-700" :
                  "bg-red-600 hover:bg-red-700"
                }`}
              >
                <Send className="h-4 w-4" /> Ghi nhận kiểm kê
              </button>
            </div>
          )}

          <button onClick={() => { setScannedCode(null); setPendingAction(null); }} className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-800 underline font-medium">
            Hủy & Quét máy khác
          </button>
        </div>
      )}

      {/* DIALOG XÁC NHẬN BÁO MẤT (NOT_FOUND) */}
      {showConfirmModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 rounded-2xl backdrop-blur-sm">
          <div className="bg-white p-5 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Xác nhận Báo mất tài sản?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Hành động này sẽ cập nhật trạng thái thiết bị thành <strong className="text-red-600">MẤT TÍCH (LOST)</strong>, tự động thu hồi phiếu cấp phát hiện tại và tạo <strong>Báo cáo mất tài sản (PDF)</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg transition">Hủy bỏ</button>
              <button onClick={() => executeSubmit("NOT_FOUND")} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition shadow-sm">
                Xác nhận Mất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScannerClient({ locations }: ScannerClientProps) {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-samsung"><Loader2 className="animate-spin" /></div>}>
      <ScannerContent locations={locations} />
    </Suspense>
  );
}