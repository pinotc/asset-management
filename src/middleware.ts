// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;

    // 1. Phân quyền Tuyệt đối: CHỈ ADMIN
    const adminRoutes = ["/admin"];
    if (adminRoutes.some(r => path.startsWith(r)) && role !== "ADMIN") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // 2. Phân quyền Kỹ thuật (Phần cứng, Giám sát, Nhật ký): ADMIN & TECHNICIAN
    const techRoutes = ["/categories", "/locations", "/warranty", "/monitoring", "/logs"];
    if (techRoutes.some(r => path.startsWith(r)) && !["ADMIN", "TECHNICIAN"].includes(role)) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // 3. Phân quyền Quản lý Báo cáo: ADMIN & MANAGER
    const reportRoutes = ["/reports"];
    if (reportRoutes.some(r => path.startsWith(r)) && !["ADMIN", "MANAGER"].includes(role)) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // 4. Phân quyền Vận hành & Quản lý Kho: ADMIN, MANAGER, TECHNICIAN
    // Đã bổ sung "/assets" và "/timeline" vào đây để chặn USER thường truy cập
    const operationRoutes = ["/assignments", "/recalls", "/audit", "/documents", "/assets", "/timeline"];
    if (operationRoutes.some(r => path.startsWith(r)) && !["ADMIN", "MANAGER", "TECHNICIAN"].includes(role)) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // 5. Chặn USER vào trang danh sách sửa chữa tổng (/repairs)
    // Dùng path === "/repairs" để khóa đúng trang danh sách, 
    // không dùng startsWith để USER vẫn có thể vào "/repairs/new" hoặc "/repairs/[id]"
    // HÃY XÓA HOẶC COMMENT ĐOẠN NÀY LẠI ĐỂ MỞ KHÓA CHO USER
    /* if (path === "/repairs" && role === "USER") {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    } 
    */

    // Các route công cộng (cho phép mọi user đã đăng nhập):
    if (path.startsWith("/settings") || path.startsWith("/search")) {
      return NextResponse.next();
    }

    // Route mặc định (Dashboard /): Mọi user đều được vào
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized).*)",
  ],
};