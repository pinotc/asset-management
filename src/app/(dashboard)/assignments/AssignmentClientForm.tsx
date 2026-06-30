// src/app/(dashboard)/assignments/AssignmentClientForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Loader2, Printer, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { assignAsset } from "@/actions/assignment.actions"; // Import Server Action thật

// Định nghĩa Props nhận đủ 4 mảng dữ liệu từ page.tsx
interface AssignmentFormProps {
  assets: any[];
  users: any[];
  departments: any[];
  locations: any[];
}

export default function AssignmentClientForm({ assets, users, departments, locations }: AssignmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  // States lưu trữ dữ liệu nhập liệu
  const [userId, setUserId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [remark, setRemark] = useState("");

  // Logic tự động lấy phòng ban theo Nhân sự
  const handleUserChange = (selectedUserId: string) => {
    setUserId(selectedUserId);
    
    if (selectedUserId) {
      const selectedUser = users.find(u => u.id === selectedUserId);
      if (selectedUser && selectedUser.departmentId) {
        setDepartmentId(selectedUser.departmentId);
      } else {
        setDepartmentId(""); 
      }
    } else {
      setDepartmentId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !userId || !locationId || !departmentId) {
      return alert("Vui lòng chọn đầy đủ Nhân sự, Phòng ban, Vị trí và Thiết bị!");
    }
    
    setIsSubmitting(true);
    
    try {
      // Đóng gói dữ liệu vào FormData để khớp với Server Action
      const formData = new FormData();
      formData.append("assetId", assetId);
      formData.append("userId", userId);
      formData.append("departmentId", departmentId);
      formData.append("locationId", locationId);
      formData.append("remark", remark);

      // Gọi API Action thực tế đẩy thẳng vào Database
      const result = await assignAsset(formData);
      
      if (result.success && result.data?.id) {
        // Nhận lại ID thật của bảng AssetAssignment (ví dụ: cmqyn93...)
        setCreatedDocId(result.data.id);
        router.refresh(); // Làm mới danh sách bên dưới
      } else {
        alert("Lỗi: " + result.error);
      }
    } catch (error) {
      alert("Lỗi hệ thống khi lưu phiếu bàn giao!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPrintTab = () => {
    if (!createdDocId) return;
    // Mở tab in với ID thật từ DB
    window.open(`/documents/print/handover/${createdDocId}`, "_blank");
  };

  return (
    <div className="max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      {/* Header Form */}
      <div className="p-5 bg-gray-50 border-b flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Lập Phiếu Bàn Giao Thiết Bị</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dữ liệu cấp phát sau khi lưu sẽ tự động đồng bộ vào phôi văn bản ISO.</p>
        </div>
      </div>

      {createdDocId ? (
        <div className="p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base">Lưu thông tin cấp phát thành công!</h3>
            <p className="text-xs text-gray-400 mt-1">Hệ thống đã lưu vào CSDL và sẵn sàng in biểu mẫu chuẩn.</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button 
              onClick={handleOpenPrintTab}
              className="flex items-center gap-2 bg-samsung text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition"
            >
              <Printer className="h-4 w-4" /> Mở Trang In Bàn Giao (A4)
            </button>
            <button 
              onClick={() => {
                setCreatedDocId(null);
                setAssetId("");
                setRemark("");
              }}
              className="px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-gray-50 transition text-gray-600"
            >
              Tạo phiếu tiếp theo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* 1. Chọn Nhân sự */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">1. Nhân sự nhận thiết bị</label>
              <select 
                value={userId} 
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 focus:ring-samsung text-gray-800 font-semibold"
              >
                <option value="">-- Chọn nhân viên --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            {/* 2. Phòng ban */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 justify-between">
                <span>2. Đơn vị / Phòng ban</span>
              </label>
              <select 
                value={departmentId} 
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={!!departmentId} 
                className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-samsung text-gray-800 font-semibold transition ${
                  departmentId 
                    ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-80" 
                    : "border-gray-300 bg-white"
                }`}
              >
                <option value="">-- Tự động điền --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* 3. Vị trí */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">3. Vị trí sử dụng máy</label>
              <select 
                value={locationId} 
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 focus:ring-samsung text-gray-800 font-semibold"
              >
                <option value="">-- Chọn vị trí trong xưởng --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {/* 4. Chọn thiết bị */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">4. Thiết bị cấp phát</label>
              <select 
                value={assetId} 
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white focus:ring-1 focus:ring-samsung text-gray-900 font-mono font-bold"
              >
                <option value="">-- Chọn máy móc / thiết bị --</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.assetCode} - {a.name}</option>)}
              </select>
            </div>

            {/* 5. Ghi chú */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">5. Mô tả tình trạng / Ghi chú bàn giao</label>
              <textarea 
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Ví dụ: Cấp mới màn hình Dell 24 inch, chuột và bàn phím..."
                className="w-full h-20 p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-samsung resize-none text-gray-800"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-samsung text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Chốt Phiếu Bàn Giao
            </button>
          </div>
        </form>
      )}
    </div>
  );
}