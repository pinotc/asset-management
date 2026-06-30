// src/app/(dashboard)/settings/SettingsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sliders, ShieldCheck, Info, Save, 
  Database, RefreshCw, HardDrive, CheckCircle2, Loader2, Users, Settings
} from "lucide-react";
import { exportDatabaseBackup, clearSystemLogs, updateOperationalSettings } from "@/actions/setting.actions";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";

// IMPORT COMPONENT PHÂN QUYỀN
import PermissionManager from "@/components/admin/PermissionManager";

interface SettingsClientProps {
  userRole: string; // <-- ĐÃ BỔ SUNG QUYỀN USER ĐỂ ẨN HIỆN TAB
  systemInfo: {
    companyName: string;
    environment: string;
    databaseStatus: string;
    assetCount: number;
    logCount: number;
    categoryCount: number;
    version: string;
    // Đảm bảo initialConfig tồn tại trong Props
    initialConfig?: {
      assetPrefix: string;
      alertThreshold: string;
      allowUserReport: boolean;
      grafanaUrl: string;
    };
  };
}

export default function SettingsClient({ userRole, systemInfo }: SettingsClientProps) {
  const router = useRouter();
  
  // KIỂM TRA QUYỀN ADMIN
  const isAdmin = userRole === "ADMIN";

  // KHÔNG PHẢI ADMIN THÌ MẶC ĐỊNH MỞ LUÔN TAB SECURITY
  const [activeTab, setActiveTab] = useState<"GENERAL" | "BACKUP" | "INFO" | "PERMISSIONS" | "SECURITY">(
    isAdmin ? "GENERAL" : "SECURITY"
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);

  // Đọc dữ liệu ban đầu, dùng fallback nếu initialConfig bị thiếu
  const [assetPrefix, setAssetPrefix] = useState(systemInfo.initialConfig?.assetPrefix || "AST");
  const [alertThreshold, setAlertThreshold] = useState(systemInfo.initialConfig?.alertThreshold || "30");
  const [allowUserReport, setAllowUserReport] = useState(systemInfo.initialConfig?.allowUserReport ?? true);

  // CẬP NHẬT BACKEND CHO HÀM LƯU CẤU HÌNH VẬN HÀNH
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateOperationalSettings({
        assetPrefix,
        alertThreshold: Number(alertThreshold),
        allowUserReport
      });

      if (result?.success) {
        // Sử dụng alert đơn giản hoặc thay bằng toast nếu dự án có sẵn
        alert("Cấu hình hệ thống đã được cập nhật thành công!");
        router.refresh(); 
      } else {
        throw new Error(result?.error || "Không thể lưu cấu hình");
      }
    } catch (error: any) {
      console.error("Save settings error:", error);
      alert("Lỗi: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // HÀM XỬ LÝ TẢI BẢN SAO LƯU (BACKUP)
  const handleBackupDatabase = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    
    try {
      const result = await exportDatabaseBackup();
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().split('T')[0];
        
        a.href = url;
        a.download = `mes_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(result.error || "Lỗi tải bản sao lưu");
      }
    } catch (error) {
      alert("Đã xảy ra lỗi trong quá trình tạo file backup.");
    } finally {
      setIsBackingUp(false);
    }
  };

  // HÀM XỬ LÝ XÓA NHẬT KÝ (CLEAR LOGS)
  const handleClearLogs = async () => {
    const confirmed = confirm("⚠️ CẢNH BÁO: Bạn chắc chắn muốn xóa vĩnh viễn toàn bộ lịch sử hoạt động?");
    if (!confirmed) return;

    setIsClearingLogs(true);
    try {
      const result = await clearSystemLogs();
      if (result.success) {
        alert(`Đã dọn dẹp thành công ${result.deletedCount} bản ghi!`);
        router.refresh();
      } else {
        alert(result.error || "Lỗi khi xóa nhật ký");
      }
    } catch (error) {
      alert("Lỗi hệ thống khi xóa nhật ký.");
    } finally {
      setIsClearingLogs(false);
    }
  };
  

 return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* THANH ĐIỀU HƯỚNG TABS BÊN TRÁI */}
      <div className="md:col-span-1 flex flex-col space-y-1">
        {/* ================= CÁC TAB CHỈ DÀNH CHO ADMIN ================= */}
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("GENERAL")}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition ${
                activeTab === "GENERAL" 
                  ? "bg-blue-50 text-samsung" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Sliders className="h-4 w-4" /> Cấu hình vận hành
            </button>

            <button
              onClick={() => setActiveTab("PERMISSIONS")}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition ${
                activeTab === "PERMISSIONS" 
                  ? "bg-blue-50 text-samsung" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4" /> Phân quyền Tài khoản
            </button>

            <button
              onClick={() => setActiveTab("BACKUP")}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition ${
                activeTab === "BACKUP" 
                  ? "bg-blue-50 text-samsung" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Database className="h-4 w-4" /> Sao lưu & Dữ liệu
            </button>
          </>
        )}

        {/* ================= TAB BẢO MẬT (MẶC ĐỊNH CHO TẤT CẢ USER) ================= */}
        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition ${
            activeTab === "SECURITY"
              ? "bg-blue-50 text-samsung" 
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Bảo mật & Tài khoản
        </button>

        {/* ================= TAB INFO (CHỈ DÀNH CHO ADMIN) ================= */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab("INFO")}
            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition ${
              activeTab === "INFO" 
                ? "bg-blue-50 text-samsung" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Info className="h-4 w-4" /> Thông tin hệ thống
          </button>
        )}
      </div>

      {/* KHUNG NỘI DUNG CHÍNH BÊN PHẢI */}
      <div className="md:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* TAB 1: CẤU HÌNH VẬN HÀNH CHUNG (CHỈ ADMIN) */}
        {isAdmin && activeTab === "GENERAL" && (
          <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-gray-800">Quy tắc định danh & Vận hành tài sản</h3>
              <p className="text-xs text-gray-400 mt-0.5">Thiết lập tiền tố mã hóa thiết bị tự động và phân quyền chức năng đầu cuối.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tiền tố mã tài sản (Asset Prefix)</label>
                <input 
                  type="text" 
                  value={assetPrefix}
                  onChange={(e) => setAssetPrefix(e.target.value.toUpperCase())}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-samsung text-gray-800 font-mono" 
                  maxLength={5}
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Ví dụ định dạng mã sinh ra: <strong className="text-gray-600">{assetPrefix}-2026-000001</strong></span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Cảnh báo hết hạn bảo hành sớm (Ngày)</label>
                <input 
                  type="number" 
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-samsung text-gray-800" 
                  min={5}
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Hệ thống sẽ đổi màu trạng thái bảo hành trước số ngày này.</span>
              </div>

              <div className="sm:col-span-2 bg-gray-50 p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Cho phép Nhân viên sản xuất (USER) báo hỏng máy</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Nếu tắt, chỉ quản lý (MANAGER) và kỹ thuật viên (TECHNICIAN) mới có thể tạo phiếu sửa chữa.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={allowUserReport} 
                    onChange={(e) => setAllowUserReport(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-2px after:left-2px after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-samsung"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-samsung text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 hover:bg-blue-700 transition shadow-sm"
              >
                <Save className="h-4 w-4" /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: QUẢN LÝ PHÂN QUYỀN (CHỈ ADMIN) */}
        {isAdmin && activeTab === "PERMISSIONS" && (
          <div className="p-6 bg-gray-50/50">
            <div className="border-b pb-3 mb-6">
              <h3 className="text-base font-bold text-gray-800">Quản lý Phân quyền Module</h3>
              <p className="text-xs text-gray-400 mt-0.5">Bật/tắt quyền truy cập từng chức năng linh hoạt cho các tài khoản trong hệ thống MES.</p>
            </div>
            <PermissionManager />
          </div>
        )}

        {/* TAB 3: SAO LƯU & DATABASE (CHỈ ADMIN) */}
        {isAdmin && activeTab === "BACKUP" && (
          <div className="p-6 space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-gray-800">Quản trị Cơ sở dữ liệu & Nhật ký</h3>
              <p className="text-xs text-gray-400 mt-0.5">Xử lý kết xuất an toàn toàn bộ dữ liệu máy móc và bảo dưỡng chỉ mục hệ thống.</p>
            </div>

            <div className="space-y-4">
              <div className="border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/30">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <HardDrive className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Sao lưu dữ liệu dự phòng (Full Backup)</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Tải xuống tệp tin chứa toàn bộ trạng thái tài sản, thông tin nhân sự và logs hiện tại dưới dạng JSON.</p>
                  </div>
                </div>
                <button 
                  onClick={handleBackupDatabase}
                  disabled={isBackingUp}
                  className="px-4 py-2 border border-emerald-300 text-emerald-800 bg-emerald-100 font-bold text-xs rounded-lg hover:bg-emerald-200 transition whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo bản sao lưu (.json)"}
                </button>
              </div>

              <div className="border border-red-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50/30">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                    <RefreshCw className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Xóa vĩnh viễn Sổ cái Nhật ký (Clear Logs)</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Xóa sạch toàn bộ bản ghi lịch sử hoạt động để giảm tải cho cơ sở dữ liệu. Không thể hoàn tác!</p>
                  </div>
                </div>
                <button 
                  onClick={handleClearLogs}
                  disabled={isClearingLogs}
                  className="px-4 py-2 border border-red-300 text-red-800 bg-red-100 font-bold text-xs rounded-lg hover:bg-red-200 transition whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isClearingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa toàn bộ Logs"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BẢO MẬT (ĐỔI MẬT KHẨU - CHo MỌI TÀI KHOẢN) */}
        {activeTab === "SECURITY" && (
          <div className="p-6 space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-gray-800">Bảo mật tài khoản</h3>
              <p className="text-xs text-gray-400 mt-0.5">Thay đổi mật khẩu đăng nhập để bảo vệ tài khoản cá nhân của bạn.</p>
            </div>
            
            <div className="max-w-md">
              <ChangePasswordForm />
            </div>
          </div>
        )}

        {/* TAB 5: THÔNG TIN HỆ THỐNG (CHỈ ADMIN) */}
        {isAdmin && activeTab === "INFO" && (
          <div className="p-6 space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-base font-bold text-gray-800">Thông tin Phần mềm & Tài nguyên mạng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Thông tin chi tiết về phiên bản máy chủ mạng nội bộ và mật độ lưu trữ cơ sở dữ liệu.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-gray-600">
              <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Đơn vị vận hành</span>
                <span className="text-gray-900 font-bold">{systemInfo.companyName}</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Phiên bản Core MES Assets</span>
                <span className="text-gray-900 font-mono font-bold ">{systemInfo.version}</span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Trạng thái Kết nối Cơ sở dữ liệu</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" /> {systemInfo.databaseStatus}
                </span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Môi trường Node.js</span>
                <span className="text-gray-800 font-mono font-bold uppercase">{systemInfo.environment}</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
              <div className="bg-gray-50 px-4 py-2.5 font-bold text-xs text-gray-500 border-b uppercase tracking-wider">Mật độ bản ghi trong cơ sở dữ liệu hiện tại</div>
              <div className="p-4 space-y-3 text-sm text-gray-700">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span>Tổng số thiết bị/máy móc (`Asset`):</span>
                  <span className="font-bold text-gray-900">{systemInfo.assetCount} bản ghi</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span>Chủng loại thiết bị phân tách (`AssetCategory`):</span>
                  <span className="font-bold text-gray-900">{systemInfo.categoryCount} nhóm</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Tổng số dòng dữ liệu Sổ cái nhật ký (`AssetLog`):</span>
                  <span className="font-bold text-blue-600 font-mono">{systemInfo.logCount} dòng nhật ký</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}