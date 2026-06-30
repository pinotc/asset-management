// src/components/forms/AssignAssetForm.tsx
"use client";

import { useState } from "react";
import { assignAsset } from "@/actions/assignment.actions";
import { UserPlus, Loader2, CheckCircle2, Printer } from "lucide-react";

interface AssignFormProps {
  assetId: string;
  users: { id: string; name: string; departmentId?: string | null }[];
  departments: { id: string; name: string }[];
  locations?: { id: string; name: string }[]; // Thêm location (optional để không lỗi trang cũ)
}

export default function AssignAssetForm({ assetId, users, departments, locations = [] }: AssignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  // State hỗ trợ auto-fill phòng ban
  const [userId, setUserId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    setUserId(selectedUserId);
    
    // Auto-fill phòng ban
    const user = users.find(u => u.id === selectedUserId);
    if (user && user.departmentId) {
      setDepartmentId(user.departmentId);
    } else {
      setDepartmentId("");
    }
  };

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    
    // Gọi Action cấp phát (FormData giờ đã tự chứa đủ userId, departmentId, remark)
    const res = await assignAsset(formData);
    
    if (res.success && res.data?.id) {
      setCreatedDocId(res.data.id); // Lưu ID thật để mở tab in
    } else {
      alert(res.error || "Lỗi khi bàn giao thiết bị!");
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mt-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-samsung" />
        Bàn giao thiết bị
      </h3>

      {createdDocId ? (
        <div className="p-6 text-center space-y-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-sm">Bàn giao thành công!</h4>
            <p className="text-xs text-gray-500 mt-1">Dữ liệu đã được lưu và sẵn sàng in biên bản.</p>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            <button 
              onClick={() => window.open(`/documents/print/handover/${createdDocId}`, "_blank")}
              className="flex items-center gap-1.5 bg-samsung text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
            >
              <Printer className="h-3.5 w-3.5" /> In Biên bản (A4)
            </button>
          </div>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          {/* Trường ẩn lưu ID thiết bị */}
          <input type="hidden" name="assetId" value={assetId} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Người nhận</label>
              <select 
                name="userId" // Sửa name thành userId để khớp với Action
                required
                value={userId}
                onChange={handleUserChange}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none bg-white"
              >
                <option value="">-- Chọn nhân sự --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Phòng ban / Phân xưởng</label>
              <select 
                name="departmentId" 
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none bg-white"
              >
                <option value="">-- Chọn bộ phận --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Chỉ render nếu cha có truyền danh sách locations */}
            {locations.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Vị trí đặt máy</label>
                <select name="locationId" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none bg-white">
                  <option value="">-- Chọn vị trí sử dụng --</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Ghi chú bàn giao</label>
            {/* Sửa name thành remark để khớp với Action */}
            <input 
              name="remark" 
              type="text" 
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none" 
              placeholder="VD: Bàn giao kèm chuột, bàn phím..." 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận bàn giao"}
          </button>
        </form>
      )}
    </div>
  );
}