// src/app/(dashboard)/settings/page.tsx
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Lấy thông tin user và role
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  const userRole = currentUser?.role || "USER";

  // 2. Lấy cấu hình hệ thống hiện tại từ DB (nếu có bảng settings)
  // Nếu chưa có bảng Settings riêng, ta lấy tạm hoặc để mặc định
  const rawConfig = {
    assetPrefix: "AST",
    alertThreshold: "30",
    allowUserReport: true,
    grafanaUrl: ""
  };

  const systemInfo = {
    companyName: "DAEHA CABLE VINA CO., LTD",
    environment: process.env.NODE_ENV || "development",
    databaseStatus: "CONNECTED",
    assetCount: await prisma.asset.count(),
    logCount: await prisma.assetLog.count(),
    categoryCount: await prisma.assetCategory.count(),
    version: "v2.4.1-build.2026",
    initialConfig: {
      assetPrefix: rawConfig.assetPrefix,
      alertThreshold: rawConfig.alertThreshold,
      allowUserReport: rawConfig.allowUserReport,
      grafanaUrl: rawConfig.grafanaUrl
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt Hệ thống & Tài khoản</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý cấu hình vận hành và bảo mật thông tin.</p>
      </div>

      {/* Truyền userRole và systemInfo xuống Client */}
      <SettingsClient userRole={userRole} systemInfo={systemInfo} />
    </div>
  );
}