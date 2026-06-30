// src/app/api/audit/[sessionId]/export/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.sessionId;

    // 1. Lấy thông tin phiên và danh sách máy ĐÃ QUÉT
    const session = await prisma.auditSession.findUnique({
      where: { id: sessionId },
      include: {
        inspections: {
          include: { asset: true },
          orderBy: { scannedAt: "desc" },
        },
      },
    });

    if (!session) {
      return new NextResponse("Không tìm thấy phiên kiểm kê", { status: 404 });
    }

    // 2. Lấy TẤT CẢ máy để đối chiếu danh sách CHƯA QUÉT
    const allAssets = await prisma.asset.findMany({
      where: { status: { not: "DISPOSED" } },
      select: { id: true, assetCode: true, name: true, status: true },
    });

    const auditedAssetIds = new Set(session.inspections.map((i) => i.assetId));
    const unauditedAssets = allAssets.filter((a) => !auditedAssetIds.has(a.id));

    // 3. Hàm map trạng thái Tiếng Việt trực quan
    const getStatusText = (status: string) => {
      switch (status) {
        case "FOUND": return "Bình thường (FOUND)";
        case "DAMAGED": return "Hư hỏng (DAMAGED)";
        case "WRONG_LOCATION": return "Sai vị trí (WRONG LOCATION)";
        case "NOT_FOUND": return "Mất tích (NOT FOUND)";
        default: return status;
      }
    };

    // 4. Chuẩn bị dữ liệu cho Sheet 1: ĐÃ KIỂM KÊ
    const dataAudited = session.inspections.map((insp, index) => ({
      "STT": index + 1,
      "Mã Tài Sản": insp.asset.assetCode,
      "Tên Thiết Bị": insp.asset.name,
      "Kết Quả Kiểm Kê": getStatusText(insp.status),
      "Thời Gian Quét": format(new Date(insp.scannedAt), "HH:mm:ss dd/MM/yyyy"),
      "Ghi Chú Chi Tiết": insp.notes || "—",
    }));

    // 5. Chuẩn bị dữ liệu cho Sheet 2: CHƯA KIỂM KÊ (Sót/Mất)
    const dataUnaudited = unauditedAssets.map((asset, index) => ({
      "STT": index + 1,
      "Mã Tài Sản": asset.assetCode,
      "Tên Thiết Bị": asset.name,
      "Trạng Thái Hệ Thống": asset.status,
      "Cảnh Báo": "Chưa được quét trong đợt này (Nghi ngờ thất lạc)",
    }));

    // 6. Khởi tạo Workbook và tạo các Sheet dữ liệu
    const workbook = XLSX.utils.book_new();

    const sheet1 = XLSX.utils.json_to_sheet(dataAudited);
    const sheet2 = XLSX.utils.json_to_sheet(dataUnaudited);

    // Tự động căn chỉnh độ rộng cột cơ bản cho đẹp mắt
    const autoWidth = (data: any[]) => {
      if (data.length === 0) return [];
      const keys = Object.keys(data[0]);
      return keys.map((key) => ({
        wch: Math.max(
          key.length + 4,
          ...data.map((row) => (row[key] ? row[key].toString().length + 2 : 10))
        ),
      }));
    };
    sheet1["!cols"] = autoWidth(dataAudited);
    sheet2["!cols"] = autoWidth(dataUnaudited);

    // Thêm các sheet vào workbook
    XLSX.utils.book_append_sheet(workbook, sheet1, "Đã kiểm kê");
    XLSX.utils.book_append_sheet(workbook, sheet2, "Chưa kiểm kê (Sót)");

    // 7. Xuất file dạng Buffer nhị phân
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // Tên file chuẩn doanh nghiệp (Mã phiên + Ngày xuất)
    const fileName = `BaoCao_KiemKe_${sessionId}_${format(new Date(), "yyyyMMdd")}.xlsx`;

    // 8. Trả về Response kèm Headers ép trình duyệt kích hoạt Download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Lỗi xuất Excel:", error);
    return new NextResponse("Lỗi máy chủ khi tạo file Excel", { status: 500 });
  }
}