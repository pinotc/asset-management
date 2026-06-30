// src/app/(dashboard)/admin/departments/DepartmentClient.tsx
"use client";

import { useState } from "react";
import { createDepartment, updateDepartment, deleteDepartment } from "@/actions/department.actions";
import { Building2, Plus, Edit2, Trash2, Users, Box, Check, X, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type DepartmentData = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { users: number; assets: number };
};

export default function DepartmentClient({ initialData }: { initialData: DepartmentData[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. Xử lý Thêm mới
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createDepartment(formData);

    if (!result.success) {
      setError(result.error || "Có lỗi xảy ra");
    } else {
      (e.target as HTMLFormElement).reset();
    }
    setIsSubmitting(false);
  };

  // 2. Xử lý Cập nhật Inline
  const handleUpdate = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await updateDepartment(id, formData);

    if (!result.success) {
      alert(result.error);
    } else {
      setEditingId(null);
    }
  };

  // 3. Xử lý Xóa an toàn
  const handleDelete = async (id: string, usersCount: number, assetsCount: number) => {
    if (usersCount > 0 || assetsCount > 0) {
      alert("Hệ thống từ chối: Phòng ban đang có nhân sự hoặc thiết bị hoạt động, không thể xóa!");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa phòng ban này?")) return;

    const result = await deleteDepartment(id);
    if (!result.success) alert(result.error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-samsung" />
          Sơ đồ Phòng ban / Bộ phận
        </h1>
        <p className="text-sm text-gray-500 mt-1">Cấu trúc cây phòng ban hành chính phục vụ phân phối trách nhiệm tài sản xưởng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI: Form Thêm Mới */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" /> Khởi tạo phòng ban
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tên phòng ban / Bộ phận *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="VD: Phòng IT / MES, QA/QC, Production Line 1..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-800"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-samsung hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm phòng ban"}
              </button>
            </form>
          </div>
        </div>

        {/* CỘT PHẢI: Bảng Danh sách dữ liệu */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-5 py-4 w-2/5">Tên phòng ban</th>
                  <th className="px-5 py-4 text-center">Nhân sự</th>
                  <th className="px-5 py-4 text-center">Tài sản sở hữu</th>
                  <th className="px-5 py-4">Ngày lập</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialData.map((dept) => {
                  const hasConstraints = dept._count.users > 0 || dept._count.assets > 0;

                  return (
                    <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Tên bộ phận có Inline edit */}
                      <td className="px-5 py-3.5">
                        {editingId === dept.id ? (
                          <form onSubmit={(e) => handleUpdate(dept.id, e)} className="flex items-center gap-2">
                            <input 
                              name="name" autoFocus defaultValue={dept.name}
                              className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-800 font-medium"
                            />
                            <button type="submit" className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Check className="h-4 w-4"/></button>
                            <button type="button" onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"><X className="h-4 w-4"/></button>
                          </form>
                        ) : (
                          <span className="font-bold text-gray-800 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400 shrink-0" /> {dept.name}
                          </span>
                        )}
                      </td>

                      {/* Đếm số nhân viên */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${dept._count.users > 0 ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-gray-100 text-gray-400'}`}>
                          <Users className="h-3 w-3" />
                          {dept._count.users}
                        </span>
                      </td>

                      {/* Đếm số thiết bị thuộc phòng ban */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${dept._count.assets > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                          <Box className="h-3 w-3" />
                          {dept._count.assets}
                        </span>
                      </td>

                      {/* Ngày khởi tạo */}
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {format(new Date(dept.createdAt), "dd/MM/yyyy")}
                      </td>

                      {/* Nút tác vụ */}
                      <td className="px-5 py-3.5 text-right">
                        {editingId !== dept.id && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(dept.id)} className="p-1.5 text-gray-500 hover:text-samsung hover:bg-gray-50 rounded transition">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(dept.id, dept._count.users, dept._count.assets)} 
                              className={`p-1.5 rounded transition ${hasConstraints ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                              disabled={hasConstraints}
                              title={hasConstraints ? "Phòng ban có dữ liệu ràng buộc, không thể xóa" : "Xóa"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {initialData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                      Chưa cấu hình dữ liệu phòng ban hành chính nào.
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