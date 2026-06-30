// src/app/api/export/assets/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// Khai báo Type chuẩn theo đúng Schema của bạn
type ExportAsset = {
  assetCode: string;
  name: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: string;
  price: any; // Decimal của Prisma
  purchaseDate: Date | null;
  warrantyEndDate: Date | null;
  category: { name: string } | null;
  department: { name: string } | null;
  location: { name: string } | null;
};

export async function GET() {
  try {
    // 1. Lấy dữ liệu từ Database kèm theo các bảng liên kết
    const assets = await prisma.asset.findMany({
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Tạo Header đầy đủ các cột cho file CSV
    let csvContent = "\uFEFFMã tài sản,Tên thiết bị,Model,Danh mục,Nhà sản xuất,Số Serial,Trạng thái,Giá (VNĐ),Phòng ban,Vị trí,Ngày nhập,Hạn bảo hành\n";

    // 3. Đổ dữ liệu
    assets.forEach((asset: ExportAsset) => {
      const row = [
        asset.assetCode,
        `"${asset.name}"`, 
        `"${asset.model}"`,
        `"${asset.category?.name || '—'}"`,
        `"${asset.manufacturer}"`,
        asset.serialNumber,
        asset.status,
        asset.price ? asset.price.toString() : "0",
        `"${asset.department?.name || '—'}"`,
        `"${asset.location?.name || '—'}"`,
        asset.purchaseDate ? format(new Date(asset.purchaseDate), 'dd/MM/yyyy') : "—",
        asset.warrantyEndDate ? format(new Date(asset.warrantyEndDate), 'dd/MM/yyyy') : "—"
      ].join(",");
      
      csvContent += row + "\n";
    });

    // 4. Trả về file tải xuống
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Bao_Cao_Thiet_Bi_${format(new Date(), 'dd_MM_yyyy')}.csv"`,
      },
    });

  } catch (error) {
    console.error("Lỗi khi xuất file:", error);
    return new NextResponse("Đã xảy ra lỗi khi xuất dữ liệu", { status: 500 });
  }
}