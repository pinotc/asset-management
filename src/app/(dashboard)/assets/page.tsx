// src/app/(dashboard)/assets/page.tsx
import { prisma } from "@/lib/prisma";
import AssetListClient from "./AssetListClient";
import { Monitor, Plus, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  // 1. Kéo dữ liệu từ DB
  const rawAssets = await prisma.asset.findMany({
    include: {
      category: { select: { name: true } },
      location: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const userMap = new Map(users.map(u => [u.id, u.name]));

  // 2. Chuẩn hóa dữ liệu thành đối tượng thuần túy (Plain Object) 
  // Cách này xử lý lỗi "Decimal objects are not supported"
  const formattedAssets = JSON.parse(JSON.stringify(rawAssets.map((asset) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    name: asset.name,
    serialNumber: asset.serialNumber,
    categoryName: asset.category?.name ?? "—",
    departmentName: asset.department?.name ?? "Chưa gán PB",
    locationName: asset.location?.name ?? "Trong kho",
    status: asset.status,
    stockInDate: asset.createdAt,
    purchaseDate: asset.purchaseDate,
    assigneeName: asset.assignedUserId ? (userMap.get(asset.assignedUserId) ?? null) : null,
  }))));

  // 3. Đếm thống kê
  const total = formattedAssets.length;
  const inStock = formattedAssets.filter((a: any) => a.status === "IN_STOCK").length;
  const assigned = formattedAssets.filter((a: any) => a.status === "ASSIGNED").length;
  const repairing = formattedAssets.filter((a: any) => ["UNDER_REPAIR", "DAMAGED"].includes(a.status)).length;

  return (
    <div className="space-y-6">
      {/* Header & Nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Monitor className="h-6 w-6 text-samsung" /> 
            Quản lý Kho Thiết bị
          </h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách tổng hợp toàn bộ tài sản, máy móc đang quản lý trong hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm text-gray-700 hover:bg-gray-50 transition">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Xuất Excel
          </button>
          <Link href="/assets/new" className="flex items-center gap-1.5 bg-samsung text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition">
            <Plus className="h-4 w-4" /> Đăng ký thiết bị
          </Link>
        </div>
      </div>

      {/* Thẻ Thống kê nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng tài sản</span>
          <p className="text-2xl font-black text-gray-800 mt-1">{total}</p>
        </div>
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Sẵn sàng (Kho)</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{inStock}</p>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đang sử dụng</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{assigned}</p>
        </div>
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Đang sự cố / Sửa</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{repairing}</p>
        </div>
      </div>

      {/* Giao diện Bảng dữ liệu tương tác */}
      <AssetListClient data={formattedAssets} />
    </div>
  );
}