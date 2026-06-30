// src/app/(dashboard)/recalls/RecallButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Undo2, X, Loader2, CheckCircle2, Printer } from "lucide-react";
import { processRecall } from "@/actions/recall.actions"; 

interface RecallButtonProps {
  assignmentId: string;
  assetCode: string;
  locations: any[]; 
}

export default function RecallButton({ assignmentId, assetCode, locations }: RecallButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [remark, setRemark] = useState("");
  const [locationId, setLocationId] = useState(""); 
  const [successDocId, setSuccessDocId] = useState<string | null>(null);

  const handleRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId) return alert("Vui lòng chọn vị trí lưu kho sau khi thu hồi!");
    
    setIsSubmitting(true);

    try {
      const res = await processRecall(assignmentId, locationId, remark);
      
      if (res.success) {
        // 1. Chốt mã thành công để UI hiện lên
        setSuccessDocId(assignmentId); 
        
        // 2. MỞ TAB MỚI TRANG IN NGAY LẬP TỨC CHO NGƯỜI DÙNG TIỆN LỢI
        window.open(`/documents/print/recall/${assignmentId}`, "_blank");
        
        // KHÔNG GỌI ROUTER.REFRESH() Ở ĐÂY ĐỂ TRÁNH MẤT POPUP
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (error) {
      alert("Lỗi kết nối khi thu hồi thiết bị.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPrintTab = () => {
    if (!successDocId) return;
    window.open(`/documents/print/recall/${successDocId}`, "_blank");
  };

  // CHỈ REFRESH DỮ LIỆU KHI NGƯỜI DÙNG BẤM TẮT FORM
  const handleCloseModal = () => {
    setIsOpen(false);
    setSuccessDocId(null);
    router.refresh(); 
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition"
      >
        <Undo2 className="h-3.5 w-3.5" /> Thu hồi
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">Thu hồi máy <span className="text-samsung">{assetCode}</span></h3>
              <button onClick={() => !isSubmitting && setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {successDocId ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Đã thu hồi về kho!</h3>
                  <p className="text-sm text-gray-500 mt-1">Hệ thống đã tự động bật tab in ấn. Nếu trình duyệt chặn popup, bạn có thể bấm nút bên dưới để in lại.</p>
                </div>
                <div className="pt-4 flex flex-col gap-2">
                  <button 
                    onClick={handleOpenPrintTab}
                    className="w-full flex items-center justify-center gap-2 bg-samsung text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition"
                  >
                    <Printer className="h-5 w-5" /> In Lại Biên Bản (A4)
                  </button>
                  <button 
                    onClick={handleCloseModal} // Sử dụng hàm đóng mới ở đây
                    className="w-full px-5 py-3 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600"
                  >
                    Xác nhận & Đóng cửa sổ
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecall}>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Vị trí lưu kho sau thu hồi
                    </label>
                    <select 
                      required
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-1 focus:ring-red-400 text-gray-800 bg-gray-50 focus:bg-white transition font-semibold"
                    >
                      <option value="">-- Chọn vị trí cất giữ máy --</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Đánh giá tình trạng thu hồi
                    </label>
                    <textarea 
                      required
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Ví dụ: Thu hồi thiết bị đổi mới cho nhân sự, máy cũ trầy xước nhẹ..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-1 focus:ring-red-400 resize-none text-gray-800 bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                  <button type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition">Hủy bỏ</button>
                  <button type="submit" disabled={isSubmitting} className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-red-600 transition disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />} Xác nhận thu hồi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}