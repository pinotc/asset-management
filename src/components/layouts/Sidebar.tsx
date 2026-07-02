// src/components/layouts/Sidebar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Monitor, ArrowRightLeft, History,
  Undo2, ClipboardCheck, Wrench, Activity, Tags,
  MapPin, ShieldCheck, FileText, BarChart3,
  Users, Building2, Settings, LogOut
} from "lucide-react";

// ============================================================================
// 1. ĐỊNH NGHĨA CÁC NHÓM QUYỀN (ROLE GROUPS) DỰA TRÊN ENUM
// ============================================================================
const ALL_ROLES = ["ADMIN", "MANAGER", "TECHNICIAN", "USER"];
const TECH_AND_UP = ["ADMIN", "MANAGER", "TECHNICIAN"];
const MANAGER_AND_UP = ["ADMIN", "MANAGER"];
const ADMIN_ONLY = ["ADMIN"];

// ============================================================================
// 2. CẤU HÌNH MENU & ÁP DỤNG NHÓM QUYỀN
// ============================================================================
const MENU_GROUPS = [
  {
    group: "Tổng quan",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/", roles: ALL_ROLES },
    ]
  },
  {
    group: "Quản lý Tài sản",
    items: [
      // Chỉ Admin, Quản lý và Kỹ thuật viên mới được vào kho
      { name: "Kho Thiết bị", icon: Monitor, href: "/assets", roles: TECH_AND_UP },
      { name: "Danh mục", icon: Tags, href: "/categories", roles: TECH_AND_UP },
      { name: "Vị trí", icon: MapPin, href: "/locations", roles: TECH_AND_UP }, 
      { name: "Lịch sử thiết bị", icon: History, href: "/timeline", roles: TECH_AND_UP },
    ]
  },
  {
    group: "Vận hành (Vòng đời)",
    items: [
      // Chỉ Quản lý và Admin mới được duyệt cấp phát/thu hồi/kiểm kê
      { name: "Cấp phát", icon: ArrowRightLeft, href: "/assignments", roles: MANAGER_AND_UP },
      { name: "Thu hồi", icon: Undo2, href: "/recalls", roles: MANAGER_AND_UP },
      { name: "Kiểm kê", icon: ClipboardCheck, href: "/audit", roles: MANAGER_AND_UP },
      
      // Chức năng Sửa chữa: Ai cũng thấy được (đường dẫn href sẽ được tính toán động bên dưới)
      { name: "Sửa chữa", icon: Wrench, href: "/repairs", roles: ALL_ROLES }, 
    ]
  },
  {
    group: "Tài liệu & Báo cáo",
    items: [
      { name: "Phiếu / Biểu mẫu", icon: FileText, href: "/documents", roles: TECH_AND_UP },
      { name: "Báo cáo thống kê", icon: BarChart3, href: "/reports", roles: MANAGER_AND_UP },
    ]
  },
  {
    group: "Hệ thống",
    items: [
      { name: "Giám sát MES", icon: Activity, href: "/monitoring", roles: TECH_AND_UP },
      
      // Vùng cấm: Chỉ Admin
      { name: "Nhân sự", icon: Users, href: "/admin/users", roles: ADMIN_ONLY },
      { name: "Phòng ban", icon: Building2, href: "/admin/departments", roles: ADMIN_ONLY },
      { name: "Sổ cái Nhật ký", icon: History, href: "/logs", roles: ADMIN_ONLY },
      { name: "Cài đặt", icon: Settings, href: "/settings", roles: ALL_ROLES },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Lấy Role từ Session
  const role = (session?.user as any)?.role || "USER";

  // Phân quyền cho Sửa chữa: User thường vào form báo hỏng, còn lại vào danh sách tổng
  const isAdminOrTech = ["ADMIN", "MANAGER", "TECHNICIAN"].includes(role);
  const repairHref = isAdminOrTech ? "/repairs" : "/repairs/new";

  const userName = session?.user?.name || "Đang tải...";
  const initial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U";

  return (
    <aside className="w-64 bg-white border-r border-factory-border flex flex-col h-full shadow-sm z-10">
      <div className="h-16 flex items-center px-6 border-b border-factory-border shrink-0">
        <div className="text-samsung font-bold text-xl tracking-tight">
          MES<span className="text-gray-800 font-medium"> ASSETS</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {MENU_GROUPS.map((group, index) => {
          
          // 3. LỌC MENU DỰA TRÊN ROLE CỦA USER ĐANG ĐĂNG NHẬP
          const allowedItems = group.items.filter(item => {
            // Admin có đặc quyền nhìn thấy mọi thứ
            if (role === "ADMIN") return true; 
            // Kiểm tra xem role hiện tại có nằm trong mảng roles cho phép của menu item không
            return item.roles.includes(role);
          });

          // Nếu nhóm không có menu nào được phép hiển thị, bỏ qua luôn nhóm đó
          if (allowedItems.length === 0) return null;

          return (
            <div key={index}>
              <h3 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                {group.group}
              </h3>
              <div className="space-y-1">
                {allowedItems.map((item) => {
                  
                  // Thay thế href động cho module sửa chữa
                  const finalHref = item.name === "Sửa chữa" ? repairHref : item.href;
                  
                  // Kiểm tra Active: Sáng đèn nếu đang ở đúng module
                  const isActive = pathname === finalHref || 
                                   (finalHref !== "/" && pathname.startsWith(finalHref)) ||
                                   (item.name === "Sửa chữa" && pathname.startsWith("/repairs"));

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={finalHref}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
                        isActive 
                          ? "bg-blue-50 text-samsung font-semibold" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-samsung"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-samsung" : "text-gray-400"}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* KHU VỰC HIỂN THỊ PROFILE & NÚT ĐĂNG XUẤT */}
      <div className="p-4 border-t border-factory-border shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-samsung text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {initial}
          </div>
          <div className="text-sm overflow-hidden flex-1">
            <p className="font-bold text-gray-800 truncate" title={userName}>{userName}</p>
            <p className="text-xs text-gray-500 truncate font-medium">
              {role === "ADMIN" ? "Quản trị viên" : 
               role === "TECHNICIAN" ? "Kỹ thuật viên" : 
               role === "MANAGER" ? "Quản lý / Tổ trưởng" : 
               role === "USER" ? "Nhân viên" : "Khách"}
            </p>
          </div>
          
          {/* NÚT ĐĂNG XUẤT */}
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}