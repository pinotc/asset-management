// src/app/(dashboard)/reports/page.tsx
import { prisma } from "@/lib/prisma";
import ReportClient from "./ReportClient";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  // 1. Lấy toàn bộ tài sản để tính toán trạng thái và tổng giá trị
  const assets = await prisma.asset.findMany({
    select: { status: true, price: true }
  });

  // 2. Lấy danh sách Danh mục kèm số lượng tài sản bên trong
  const categories = await prisma.assetCategory.findMany({
    select: { 
      name: true, 
      _count: { select: { assets: true } } 
    },
    orderBy: { assets: { _count: 'desc' } }
  });

  // 3. Lấy danh sách Phòng ban kèm số lượng tài sản đang sử dụng
  const departments = await prisma.department.findMany({
    select: { 
      name: true, 
      _count: { select: { assets: true } } 
    },
    orderBy: { assets: { _count: 'desc' } }
  });

  // Tính toán số liệu tổng quan
  const totalAssets = assets.length;
  let totalValue = 0;
  
  const statusCount = {
    IN_STOCK: 0,
    ASSIGNED: 0,
    UNDER_REPAIR: 0,
    DAMAGED: 0,
    LOST: 0,
    DISPOSED: 0,
  };

  assets.forEach((asset) => {
    // Cộng dồn giá trị (Xử lý cả Decimal và Number)
    if (asset.price) totalValue += Number(asset.price);
    
    // Đếm trạng thái
    const status = asset.status as keyof typeof statusCount;
    if (statusCount[status] !== undefined) {
      statusCount[status]++;
    }
  });

  const reportData = {
    summary: {
      totalAssets,
      totalValue,
      inStock: statusCount.IN_STOCK,
      assigned: statusCount.ASSIGNED,
      repairing: statusCount.UNDER_REPAIR + statusCount.DAMAGED,
      lost: statusCount.LOST, // ĐÃ BỔ SUNG TRƯỜNG NÀY ĐỂ FIX LỖI TYPE
    },
    statusDistribution: statusCount,
    categoryDistribution: categories.map(c => ({ name: c.name, count: c._count.assets })),
    departmentDistribution: departments.map(d => ({ name: d.name, count: d._count.assets })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-samsung" />
          Báo cáo & Thống kê
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cái nhìn tổng quan về tình trạng phân bổ, giá trị tài sản và hao mòn trong nhà máy.
        </p>
      </div>

      {/* Giao diện Client */}
      <ReportClient data={reportData} />
    </div>
  );
}