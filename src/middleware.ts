// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;

    // 1. Phân quyền Tuyệt đối: CHỈ ADMIN
    // ĐÃ XÓA "/settings" khỏi danh sách này để User thường có thể truy cập
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

    // 4. Phân quyền Vận hành: ADMIN, MANAGER, TECHNICIAN
    const operationRoutes = ["/assignments", "/recalls", "/audit", "/documents"];
    if (operationRoutes.some(r => path.startsWith(r)) && !["ADMIN", "MANAGER", "TECHNICIAN"].includes(role)) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // Route /settings cho phép mọi role đã đăng nhập truy cập
    // (Bên trong SettingsClient.tsx đã có logic ẩn/hiện tab dựa trên role)
    if (path.startsWith("/settings")) {
      return NextResponse.next();
    }

    // Các route còn lại: /, /assets, /repairs, /timeline -> Mọi user đã đăng nhập đều được vào
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