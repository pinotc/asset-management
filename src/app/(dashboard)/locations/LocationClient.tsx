// src/app/(dashboard)/locations/LocationClient.tsx
"use client";

import { useState } from "react";
import { createLocation, updateLocation, deleteLocation } from "@/actions/location.actions";
import { MapPin, Plus, Edit2, Trash2, Box, Check, X, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type LocationData = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { assets: number };
};

export default function LocationClient({ initialData }: { initialData: LocationData[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Trạng thái cho Edit Inline
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. Xử lý Thêm mới
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createLocation(formData);

    if (!result.success) {
      setError(result.error || "Có lỗi xảy ra");
    } else {
      (e.target as HTMLFormElement).reset(); // Xóa form sau khi thành công
    }
    setIsSubmitting(false);
  };

  // 2. Xử lý Cập nhật
  const handleUpdate = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateLocation(id, formData);

    if (!result.success) {
      alert(result.error);
    } else {
      setEditingId(null); // Tắt chế độ edit
    }
  };

  // 3. Xử lý Xóa
  const handleDelete = async (id: string, assetCount: number) => {
    if (assetCount > 0) {
      alert("Hệ thống từ chối: Không thể xóa vị trí đang chứa thiết bị!");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa vị trí này không?")) return;

    const result = await deleteLocation(id);
    if (!result.success) alert(result.error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          Quản lý Vị trí
        </h1>
        <p className="text-sm text-gray-500 mt-1">Thiết lập các Line, Khu vực, Kho để gán cho thiết bị.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI: Form Thêm Mới */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" /> Thêm vị trí mới
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tên vị trí (Line / Kho) *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="VD: Line SMT 1, Kho IT..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo vị trí"}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: Bảng Danh sách */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-5 py-4 w-1/2">Tên vị trí</th>
                  <th className="px-5 py-4 text-center">Số lượng thiết bị</th>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialData.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* CỘT TÊN VỊ TRÍ (Hỗ trợ Edit Inline) */}
                    <td className="px-5 py-3">
                      {editingId === location.id ? (
                        <form id={`edit-form-${location.id}`} onSubmit={(e) => handleUpdate(location.id, e)} className="flex items-center gap-2">
                          <input 
                            name="name" autoFocus defaultValue={location.name}
                            className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button type="submit" className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Check className="h-4 w-4"/></button>
                          <button type="button" onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"><X className="h-4 w-4"/></button>
                        </form>
                      ) : (
                        <span className="font-bold text-gray-800 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" /> {location.name}
                        </span>
                      )}
                    </td>

                    {/* CỘT SỐ LƯỢNG */}
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${location._count.assets > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Box className="h-3.5 w-3.5" />
                        {location._count.assets}
                      </span>
                    </td>

                    {/* CỘT NGÀY TẠO */}
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {format(new Date(location.createdAt), "dd/MM/yyyy")}
                    </td>

                    {/* CỘT THAO TÁC */}
                    <td className="px-5 py-3 text-right">
                      {editingId !== location.id && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(location.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Sửa">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(location.id, location._count.assets)} 
                            className={`p-1.5 rounded transition ${location._count.assets > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`} 
                            title={location._count.assets > 0 ? "Không thể xóa vị trí đang có thiết bị" : "Xóa"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {initialData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                      Chưa có dữ liệu vị trí nào được thiết lập.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}