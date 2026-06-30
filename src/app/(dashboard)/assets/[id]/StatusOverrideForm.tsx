"use client";

import { useState } from "react";
import { updateAssetStatus } from "@/actions/asset.actions";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function StatusOverrideForm({ assetId, currentStatus }: { assetId: string, currentStatus: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("newStatus") as string;
    const remark = formData.get("remark") as string;

    const result = await updateAssetStatus(assetId, newStatus, remark);
    
    if (result.success) {
      alert("Đã cập nhật trạng thái thành công!");
    } else {
      setError(result.error || "Có lỗi xảy ra.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mt-6">
      <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4" /> Công cụ Admin: Ép đổi trạng thái
      </h3>
      
      {error && <p className="text-xs text-red-600 mb-2 font-medium">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <select 
          name="newStatus" 
          defaultValue={currentStatus}
          className="px-3 py-2 text-sm border border-orange-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        >
          <option value="IN_STOCK">Sẵn sàng (IN_STOCK)</option>
          <option value="UNDER_REPAIR">Đang sửa chữa (UNDER_REPAIR)</option>
          <option value="DAMAGED">Hư hỏng (DAMAGED)</option>
          <option value="LOST">Thất lạc (LOST)</option>
          <option value="DISPOSED">Thanh lý (DISPOSED)</option>
        </select>

        <input 
          type="text" 
          name="remark" 
          required 
          placeholder="Nhập lý do chuyển trạng thái..." 
          className="flex-1 px-3 py-2 text-sm border border-orange-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition flex items-center gap-2 disabled:opacity-70"
        >
          <RefreshCcw className={`h-4 w-4 ${isSubmitting ? "animate-spin" : ""}`} />
          Xác nhận đổi
        </button>
      </form>
    </div>
  );
}