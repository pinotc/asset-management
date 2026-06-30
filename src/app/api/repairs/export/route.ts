import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export async function GET() {
  try {
    const tickets = await prisma.assetRepair.findMany({
      include: {
        asset: { select: { assetCode: true, name: true } },
        creator: { select: { name: true } },
        technician: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const getStatusText = (status: string) => {
      switch (status) {
        case "OPEN": return "Đang chờ tiếp nhận";
        case "IN_PROGRESS": return "Đang sửa chữa";
        case "COMPLETED": return "Đã hoàn thành";
        default: return status;
      }
    };

    const excelData = tickets.map((t: any, index) => ({
      "STT": index + 1,
      "Mã Tài Sản": t.asset.assetCode,
      "Tên Thiết Bị": t.asset.name,
      "Người Báo Hỏng": t.creator?.name || "N/A",
      "Nội Dung Sự Cố": t.description || t.issueType || "—",
      "Trạng Thái": getStatusText(t.status),
      "Ngày Tạo": format(new Date(t.createdAt), "dd/MM/yyyy HH:mm"),
    }));

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, sheet, "Danh sách");
    
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="BaoCao_SuaChua.xlsx"`,
      }
    });
  } catch (error) {
    return new NextResponse("Lỗi máy chủ", { status: 500 });
  }
}