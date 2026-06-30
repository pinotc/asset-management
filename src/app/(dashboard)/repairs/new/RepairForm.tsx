"use client";

import { useState } from "react";
import { createRepairTicket } from "@/actions/repair.actions";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

export default function RepairForm({ assets }: { assets: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (assets.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Không có thiết bị khả dụng</h3>
        <p className="text-sm text-gray-500 mt-2">
          Bạn hiện không có thiết bị nào đang được cấp phát. Chỉ có thể báo hỏng những máy bạn đang trực tiếp sử dụng.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createRepairTicket(formData);

    if (result.success) {
      router.push("/repairs");
      router.refresh();
    } else {
      setError(result.error || "Có lỗi xảy ra khi gửi yêu cầu.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">1. Chọn thiết bị đang sử dụng *</label>
          <select 
            name="assetId" required 
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-samsung font-medium text-gray-800 bg-white"
          >
            <option value="">-- Chọn thiết bị cần báo hỏng --</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                [{asset.assetCode}] - {asset.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">2. Mô tả chi tiết hiện tượng lỗi *</label>
          <textarea 
            name="description" required rows={4} 
            placeholder="Ví dụ: Màn hình cảm ứng bị sọc, đột ngột mất nguồn..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-samsung text-sm resize-none"
          ></textarea>
        </div>

        <div className="pt-3 border-t flex justify-end">
          <button 
            type="submit" disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition disabled:opacity-70 shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="animate-spin h-4 w-4" /> Đang gửi...</> : "Gửi phiếu yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
}