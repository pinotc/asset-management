// src/actions/dashboard.actions.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    // 1. Lấy các con số tổng quan
    const totalAssets = await prisma.asset.count();
    const underRepair = await prisma.asset.count({ where: { status: "UNDER_REPAIR" } });
    const openRepairs = await prisma.assetRepair.count({ where: { status: "OPEN" } });
    const totalUsers = await prisma.user.count();

    // 2. Gom nhóm dữ liệu cho Biểu đồ Tròn (Trạng thái tài sản)
    const statusGroups = await prisma.asset.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    // Map lại tên trạng thái cho thân thiện
    const statusMap: Record<string, string> = {
      IN_STOCK: "Trong kho", ASSIGNED: "Đang sử dụng", 
      UNDER_REPAIR: "Đang sửa", DAMAGED: "Hư hỏng",
      LOST: "Thất lạc", DISPOSED: "Đã thanh lý"
    };

    const pieChartData = statusGroups.map((g: { status: string; _count: { status: number } }) => ({
      name: statusMap[g.status] || g.status,
      value: g._count.status
    }));

    // 3. Gom nhóm dữ liệu cho Biểu đồ Cột (Số lượng theo danh mục)
    const categories = await prisma.assetCategory.findMany({
      include: { _count: { select: { assets: true } } }
    });

    const barChartData = categories.map((c: { name: string; _count: { assets: number } }) => ({
      name: c.name,
      count: c._count.assets
    }));

    return { 
      success: true, 
      stats: { totalAssets, underRepair, openRepairs, totalUsers },
      pieChartData,
      barChartData
    };
  } catch (error) {
    console.error("Lỗi tải dữ liệu Dashboard:", error);
    return { success: false, error: "Không thể tải dữ liệu thống kê" };
  }
}