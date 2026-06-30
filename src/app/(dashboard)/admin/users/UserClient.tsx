// src/app/(dashboard)/admin/users/UserClient.tsx
"use client";

import { useState } from "react";
import { updateUserPermissions, createUser, updateUserAdmin, resetUserPasswordAdmin } from "@/actions/user.actions";
import { Users, Search, Box, Wrench, CheckCircle, Plus, X, Loader2, Edit2, KeyRound, Save } from "lucide-react";

interface UserClientProps {
  initialUsers: any[];
  departments: any[];
}

export default function UserClient({ initialUsers, departments }: UserClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // States quản lý Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null); // Quản lý user đang được sửa thông tin/reset pass
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<"INFO" | "PASSWORD">("INFO");

  const filteredUsers = initialUsers.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handlePermissionChange = async (userId: string, currentRole: string, currentDeptId: string | null, field: "ROLE" | "DEPT", value: string) => {
    setUpdatingId(userId);
    const targetRole = field === "ROLE" ? value : currentRole;
    const targetDeptId = field === "DEPT" ? (value === "NONE" ? null : value) : currentDeptId;

    const result = await updateUserPermissions(userId, targetRole as any, targetDeptId);
    if (!result.success) alert("Lỗi: " + result.error);
    setUpdatingId(null);
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const result = await createUser(new FormData(e.currentTarget));
    if (result.success) {
      alert("Tạo tài khoản thành công!");
      setIsAddModalOpen(false);
    } else {
      alert(result.error);
    }
    setIsCreating(false);
  };

  const handleUpdateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingEdit(true);
    const result = await updateUserAdmin(editingUser.id, new FormData(e.currentTarget));
    if (result.success) {
      alert("Cập nhật thông tin nhân sự thành công!");
      setEditingUser(null);
    } else {
      alert(result.error);
    }
    setIsSavingEdit(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingEdit(true);
    const result = await resetUserPasswordAdmin(editingUser.id, new FormData(e.currentTarget));
    if (result.success) {
      alert(`Đã đặt lại mật khẩu mới thành công cho tài khoản ${editingUser.name}!`);
      setEditingUser(null);
    } else {
      alert(result.error);
    }
    setIsSavingEdit(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "text-red-700 bg-red-50 border-red-200";
      case "TECHNICIAN": return "text-blue-700 bg-blue-50 border-blue-200";
      case "MANAGER": return "text-purple-700 bg-purple-50 border-purple-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-samsung" />
            Quản lý Nhân sự & Phân quyền
          </h1>
          <p className="text-sm text-gray-500 mt-1">Khởi tạo tài khoản nội bộ và cấu hình vai trò vận hành hệ thống phần cứng.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-samsung text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> Khởi tạo tài khoản
        </button>
      </div>

      {/* Bộ lọc Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm theo tên hoặc email tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-gray-50 focus:bg-white text-gray-800"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-700 font-medium"
        >
          <option value="">-- Tất cả vai trò --</option>
          <option value="ADMIN">Quản trị viên (ADMIN)</option>
          <option value="TECHNICIAN">Kỹ thuật viên (TECHNICIAN)</option>
          <option value="MANAGER">Quản lý (MANAGER)</option>
          <option value="USER">Nhân viên sản xuất (USER)</option>
        </select>
      </div>

      {/* Bảng Danh sách Quản trị */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Họ tên & Tài khoản</th>
                <th className="px-6 py-4">Vai trò hệ thống</th>
                <th className="px-6 py-4">Phòng ban phụ trách</th>
                <th className="px-6 py-4 text-center">Tài sản giữ</th>
                <th className="px-6 py-4 text-center">Phiếu lỗi báo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{user.name}</span>
                      <span className="text-xs text-gray-400 font-medium">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <select
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(e) => handlePermissionChange(user.id, user.role, user.departmentId, "ROLE", e.target.value)}
                      className={`text-xs font-bold border px-2 py-1 rounded outline-none focus:ring-1 focus:ring-samsung ${getRoleBadgeColor(user.role)}`}
                    >
                      <option value="USER">USER (Nhân viên)</option>
                      <option value="MANAGER">MANAGER (Quản lý)</option>
                      <option value="TECHNICIAN">TECHNICIAN (Kỹ thuật)</option>
                      <option value="ADMIN">ADMIN (Hệ thống)</option>
                    </select>
                  </td>
                  <td className="px-6 py-3.5">
                    <select
                      value={user.departmentId || "NONE"}
                      disabled={updatingId === user.id}
                      onChange={(e) => handlePermissionChange(user.id, user.role, user.departmentId, "DEPT", e.target.value)}
                      className="text-xs font-medium border border-gray-200 p-1 rounded bg-white outline-none focus:ring-1 focus:ring-samsung text-gray-700 max-w-180px"
                    >
                      <option value="NONE">-- Chưa gán phòng --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600"><Box className="h-3 w-3" /> {user._count.assignedAssets} máy</span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600"><Wrench className="h-3 w-3" /> {user._count.repairTickets} lần</span>
                  </td>
                  
                  {/* CỘT THAO TÁC CẬP NHẬT MỚI */}
                  <td className="px-6 py-3.5 text-right">
                    <button 
                      onClick={() => { setEditingUser(user); setActiveTab("INFO"); }}
                      className="p-1.5 border border-gray-200 text-gray-500 hover:text-samsung hover:bg-gray-50 rounded-lg transition"
                      title="Chỉnh sửa chi tiết tài khoản"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Nhân Sự Mới (Giữ nguyên) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Plus className="h-5 w-5 text-samsung" /> Khởi tạo tài khoản mới</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và Tên *</label>
                <input type="text" name="name" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900" placeholder="VD: Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email nội bộ *</label>
                <input type="email" name="email" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900" placeholder="VD: a.nguyen@daeha.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu khởi tạo *</label>
                <input type="text" name="password" required defaultValue="Daeha@123" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phân quyền *</label>
                  <select name="role" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900">
                    <option value="USER">USER</option>
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng ban</label>
                  <select name="departmentId" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900">
                    <option value="NONE">-- Bỏ qua --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">Hủy</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-samsung text-white rounded-lg text-sm font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Lưu tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BỔ SUNG MODAL: SỬA THÔNG TIN & RESET PASSWORD (2 TRONG 1) */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-800 text-base">Cấu hình: {editingUser.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button>
            </div>

            {/* Điều hướng Tabs Chức năng */}
            <div className="flex border-b border-gray-100 text-sm">
              <button 
                onClick={() => setActiveTab("INFO")}
                className={`flex-1 py-3 text-center font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${activeTab === "INFO" ? "border-samsung text-samsung" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <Edit2 className="h-4 w-4" /> Sửa thông tin
              </button>
              <button 
                onClick={() => setActiveTab("PASSWORD")}
                className={`flex-1 py-3 text-center font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${activeTab === "PASSWORD" ? "border-samsung text-samsung" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <KeyRound className="h-4 w-4" /> Đặt lại mật khẩu
              </button>
            </div>

            {/* KHUNG FORM NỘI DUNG TABS */}
            <div className="p-5">
              {activeTab === "INFO" ? (
                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Họ và Tên mới *</label>
                    <input type="text" name="name" required defaultValue={editingUser.name} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Địa chỉ Email mới *</label>
                    <input type="email" name="email" required defaultValue={editingUser.email} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900" />
                  </div>
                  <div className="pt-4 flex justify-end gap-2 border-t border-gray-50">
                    <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg">Đóng</button>
                    <button type="submit" disabled={isSavingEdit} className="px-5 py-2 text-sm font-bold bg-samsung text-white rounded-lg flex items-center gap-1.5">
                      {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed font-medium">
                    Cảnh báo bảo mật: Hành động này sẽ ghi đè trực tiếp mã hóa mật khẩu mới. Vui lòng bàn giao lại mật khẩu này cho đúng nhân sự sở hữu.
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Mật khẩu mới ép buộc *</label>
                    <input type="text" name="password" required placeholder="Nhập tối thiểu 6 ký tự..." className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung bg-white text-gray-900 font-mono" />
                  </div>
                  <div className="pt-4 flex justify-end gap-2 border-t border-gray-50">
                    <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg">Đóng</button>
                    <button type="submit" disabled={isSavingEdit} className="px-5 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5">
                      {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Cập nhật mật khẩu
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}