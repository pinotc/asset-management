// src/actions/setting.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// 1. Hàm Xuất toàn bộ CSDL ra file JSON (Sao lưu)
export async function exportDatabaseBackup() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Truy cập bị từ chối. Chỉ ADMIN mới được phép sao lưu." };
    }

    // Kéo dữ liệu từ các bảng quan trọng nhất
    const [assets, categories, users, departments, locations, logs] = await Promise.all([
      prisma.asset.findMany(),
      prisma.assetCategory.findMany(),
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, departmentId: true } }), // Không export password
      prisma.department.findMany(),
      prisma.assetLocation.findMany(),
      prisma.assetLog.findMany({ orderBy: { createdAt: "desc" }, take: 2000 }), // Giới hạn 2000 log gần nhất để tránh kẹt bộ nhớ
    ]);

    const backupData = {
      exportDate: new Date().toISOString(),
      system: "DAEHA_MES_ASSETS",
      data: { assets, categories, users, departments, locations, logs }
    };

    return { success: true, data: JSON.stringify(backupData, null, 2) };
  } catch (error: any) {
    console.error("Lỗi khi sao lưu:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình đóng gói dữ liệu." };
  }
}

// 2. Hàm Xóa sạch bảng Sổ cái Nhật ký (Dọn dẹp Database)
export async function clearSystemLogs() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Truy cập bị từ chối. Chỉ ADMIN mới được phép xóa nhật ký." };
    }

    // Thực thi lệnh xóa toàn bộ bản ghi trong bảng AssetLog
    const result = await prisma.assetLog.deleteMany({});

    revalidatePath("/settings");
    revalidatePath("/logs");
    
    return { success: true, deletedCount: result.count };
  } catch (error: any) {
    console.error("Lỗi khi xóa logs:", error);
    return { success: false, error: "Đã xảy ra lỗi khi cố gắng xóa sổ cái nhật ký." };
  }
}

// 3. BỔ SUNG: Hàm cập nhật cấu hình vận hành nhà máy
export async function updateOperationalSettings(payload: { 
  assetPrefix: string; 
  alertThreshold: number; 
  allowUserReport: boolean; 
}) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Truy cập bị từ chối. Chỉ ADMIN mới được cấu hình hệ thống." };
    }

    if (!payload.assetPrefix.trim()) {
      return { success: false, error: "Tiền tố mã tài sản không được để trống!" };
    }

    // Thực thi lưu trữ. (Giả định cấu hình lưu vào bảng SystemConfig với ID duy nhất là 'GLOBAL')
    // Nếu bạn chưa tạo bảng này, có thể tạm thời chạy lệnh ghi Log Sổ cái bên dưới trước.
    /*
    await prisma.systemConfig.upsert({
      where: { id: "GLOBAL" },
      update: {
        assetPrefix: payload.assetPrefix.trim().toUpperCase(),
        alertThreshold: payload.alertThreshold,
        allowUserReport: payload.allowUserReport,
      },
      create: {
        id: "GLOBAL",
        assetPrefix: payload.assetPrefix.trim().toUpperCase(),
        alertThreshold: payload.alertThreshold,
        allowUserReport: payload.allowUserReport,
      }
    });
    */

    // Ghi nhận hành động thay đổi cấu hình lõi vào Sổ cái hệ thống
    await prisma.assetLog.create({
      data: {
        assetId: "SYSTEM_CONFIG", // Định danh dòng máy hệ thống
        userId: session?.user?.id || "system",
        action: "CONFIG_UPDATED",
        details: `Cấu hình thay đổi bởi Admin: Tiền tố mã [${payload.assetPrefix.toUpperCase()}], Ngưỡng bảo hành sớm [${payload.alertThreshold} ngày], Quyền USER báo hỏng [${payload.allowUserReport ? "BẬT" : "TẮT"}]`,
      }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi lưu cấu hình vận hành:", error);
    return { success: false, error: "Lỗi hệ thống khi lưu tham số vận hành." };
  }
}

// Thêm vào cuối file src/actions/setting.actions.ts

// 4. Hàm cập nhật độc lập đường dẫn Grafana từ trang Monitoring
export async function updateGrafanaUrl(grafanaUrl: string) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên (ADMIN) mới có quyền cấu hình hệ thống giám sát." };
    }

    await prisma.systemConfig.upsert({
      where: { id: "GLOBAL" },
      update: { grafanaUrl: grafanaUrl.trim() },
      create: {
        id: "GLOBAL",
        grafanaUrl: grafanaUrl.trim(),
        assetPrefix: "AST", // Giá trị mặc định nếu bản ghi GLOBAL chưa từng tồn tại
        alertThreshold: 30,
        allowUserReport: true,
      }
    });

    revalidatePath("/monitoring");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi lưu URL Grafana:", error);
    return { success: false, error: "Lỗi hệ thống khi cập nhật kết nối Grafana." };
  }
}