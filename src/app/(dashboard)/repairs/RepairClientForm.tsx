// src/app/(dashboard)/repairs/RepairClientForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, Printer, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RepairClientForm({ assets }: { assets: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  // Form State
  const [assetId, setAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !description) return alert("Vui lòng chọn thiết bị và nhập tình trạng sửa chữa!");
    
    setIsSubmitting(true);
    
    try {
      // Giả lập gọi action xử lý lưu vào bảng Repair/Maintenance
      // const res = await createRepairLogAction({ assetId, description, cost });
      
      setTimeout(() => {
        const mockGeneratedId = "REP-ID-" + Math.floor(Math.random() * 10000);
        setCreatedDocId(mockGeneratedId);
        setIsSubmitting(false);
        router.refresh();
      }, 800);
    } catch (error) {
      alert("Lỗi hệ thống khi lưu nhật ký bảo dưỡng");
      setIsSubmitting(false);
    }
  };

  const handleOpenPrintTab = () => {
    if (!createdDocId) return;
    // Đồng bộ về chuẩn URL hệ thống: /documents/print/repair/[id]
    window.open(`/documents/print/repair/${createdDocId}`, "_blank");
  };
  
  return (
    <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mx-auto">
      {/* Header Form */}
      <div className="p-5 bg-gray-50 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Ghi Nhận Lịch Sử Bảo Dưỡng / Sửa Chữa</h2>
          <p className="text-xs text-gray-400 mt-0.5">Lưu vết sự cố kỹ thuật phần cứng và đồng bộ phiếu nghiệm thu ISO.</p>
        </div>
        <Link href="/repairs" className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft className="h-4 w-4" /> Danh sách sửa chữa
        </Link>
      </div>

      {/* Thông báo thành công & nút In nhanh */}
      {createdDocId ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-full flex items-center justify-center mx-auto text-purple-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base">Đã ghi nhận nhật ký bảo dưỡng thành công!</h3>
            <p className="text-xs text-gray-400 mt-1">Dữ liệu kỹ thuật đã sẵn sàng xuất bản in nghiệm thu cho phòng IT/Cơ điện.</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button 
              onClick={handleOpenPrintTab}
              className="flex items-center gap-2 bg-samsung text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition"
            >
              <Printer className="h-4 w-4" /> Mở Trang In Nghiệm Thu (A4)
            </button>
            <button 
              onClick={() => setCreatedDocId(null)}
              className="px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-gray-50 transition text-gray-600"
            >
              Thêm bản ghi mới
            </button>
          </div>
        </div>
      ) : (
        /* Form nhập liệu kỹ thuật */
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Thiết bị bảo trì</label>
              <select 
                value={assetId} 
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 focus:ring-samsung text-gray-800 font-mono"
              >
                <option value="">-- Chọn máy móc bảo dưỡng --</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.assetCode} - {a.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Chi phí sửa chữa (VNĐ)</label>
              <input 
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-samsung text-gray-800 font-bold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Chi tiết tình trạng hỏng hóc & Vật tư thay thế</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi rõ thông tin: Máy hỏng linh kiện gì, tiến hành thay thế linh kiện mã nào, tình trạng sau khi khắc phục..."
                className="w-full h-28 p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-samsung resize-none text-gray-800"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-samsung text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Ghi sổ nhật ký sửa chữa
            </button>
          </div>
        </form>
      )}
    </div>
  );
}