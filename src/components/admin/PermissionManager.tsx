// src/components/admin/PermissionManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Shield, Save, CheckSquare, Square, UserCog } from "lucide-react";
import { getUsersPermissions, updateUserPermissions } from "@/actions/permission.actions";

const MODULES = [
  { id: "DASHBOARD", name: "Tổng quan (Dashboard)" },
  { id: "ASSETS", name: "Quản lý Thiết bị & Máy móc" },
  { id: "ASSIGNMENTS", name: "Bàn giao & Thu hồi" },
  { id: "DOCUMENTS", name: "Văn bản & Biểu mẫu" },
  { id: "REPORTS", name: "Báo cáo Thống kê" },
  { id: "MONITORING", name: "Giám sát Grafana" },
  { id: "SETTINGS", name: "Cài đặt Hệ thống" }
];

export default function PermissionManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // States lưu trữ thay đổi
  const [role, setRole] = useState<string>("USER");
  const [allowed, setAllowed] = useState<string[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await getUsersPermissions();
      if (res.success) setUsers(res.data || []);
    };
    fetchUsers();
  }, []);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setRole(user.role || "USER");
    setAllowed(user.allowedModules || []);
  };

  // Logic đổi Role: Gợi ý check sẵn các module tương ứng
  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole === "ADMIN") {
      setAllowed(MODULES.map(m => m.id)); // Admin full quyền
    } else if (newRole === "TECHNICIAN") {
      setAllowed(["DASHBOARD", "ASSETS", "ASSIGNMENTS", "REPAIRS", "MONITORING"]);
    } else if (newRole === "MANAGER") {
      setAllowed(["DASHBOARD", "ASSETS", "REPORTS"]);
    } else {
      setAllowed(["DASHBOARD"]); // User thường
    }
  };

  const toggleModule = (modId: string) => {
    setAllowed(prev => 
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    
    // Gọi hàm backend mới cập nhật cả Role và Module
    const res = await updateUserPermissions(selectedUser.id, role, allowed);
    
    if (res.success) {
      alert("Đã cập nhật Chức vụ và Phân quyền thành công!");
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, role, allowedModules: allowed } : u
      ));
    } else {
      alert("Lỗi: " + res.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-gray-200">
      {/* CỘT TRÁI: DANH SÁCH USER */}
      <div className="lg:col-span-1 border-r border-gray-100 pr-4">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-samsung" /> Chọn Tài khoản
        </h3>
        <div className="space-y-2 max-h-400px overflow-y-auto pr-2">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleSelectUser(u)}
              className={`w-full text-left p-3 rounded-xl border text-sm transition ${
                selectedUser?.id === u.id 
                  ? "bg-blue-50 border-samsung text-samsung font-bold" 
                  : "border-gray-100 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div>{u.name}</div>
              <div className="text-xs font-normal text-gray-400 mt-0.5 flex justify-between">
                <span>{u.department?.name || "Chưa phân phòng"}</span>
                <span className="font-bold">{u.role}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: CẤU HÌNH ROLE & MODULES */}
      <div className="lg:col-span-2 pl-2">
        {!selectedUser ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
            Vui lòng chọn một tài khoản để thiết lập quyền...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-bold text-gray-800 text-lg">
                Thiết lập quyền: <span className="text-samsung">{selectedUser.name}</span>
              </h3>
            </div>

            {/* BỘ CHỌN ROLE (CHỨC VỤ) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <UserCog className="h-4 w-4 text-samsung" /> Chức vụ hệ thống (Role)
              </label>
              <select 
                value={role} 
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-samsung bg-white"
              >
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
                <option value="MANAGER">Quản lý / Tổ trưởng (MANAGER)</option>
                <option value="TECHNICIAN">Kỹ thuật viên MES (TECHNICIAN)</option>
                <option value="USER">Nhân sự Xưởng (USER)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Thay đổi chức vụ sẽ ảnh hưởng đến quyền thao tác dữ liệu (VD: Chỉ ADMIN mới được xem Cài đặt).
              </p>
            </div>

            {/* BỘ CHỌN MODULES CHI TIẾT */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Tinh chỉnh Menu hiển thị (Sidebar Modules)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MODULES.map(mod => {
                  const isGranted = allowed.includes(mod.id);
                  const isDisabled = mod.id === "SETTINGS" && role === "ADMIN"; 

                  return (
                    <button
                      key={mod.id}
                      disabled={isDisabled}
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition ${
                        isGranted 
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800" 
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isGranted ? <CheckSquare className="h-5 w-5 text-emerald-600" /> : <Square className="h-5 w-5 text-gray-400" />}
                      {mod.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-samsung text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {isSaving ? "Đang xử lý..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}