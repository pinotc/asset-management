// src/app/api/audit/[sessionId]/export/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.auditSession.findUnique({
      where: { id: sessionId },
      include: {
        inspections: {
          include: {
            asset: true,
          },
          orderBy: {
            scannedAt: "desc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { message: "Không tìm thấy phiên kiểm kê" },
        { status: 404 }
      );
    }

    const allAssets = await prisma.asset.findMany({
      where: {
        status: {
          not: "DISPOSED",
        },
      },
      select: {
        id: true,
        assetCode: true,
        name: true,
        status: true,
      },
    });

    const auditedAssetIds = new Set(
      session.inspections.map((inspection) => inspection.assetId)
    );

    const unauditedAssets = allAssets.filter(
      (asset) => !auditedAssetIds.has(asset.id)
    );

    const getStatusText = (status: string) => {
      switch (status) {
        case "FOUND":
          return "Bình thường (FOUND)";
        case "DAMAGED":
          return "Hư hỏng (DAMAGED)";
        case "WRONG_LOCATION":
          return "Sai vị trí (WRONG LOCATION)";
        case "NOT_FOUND":
          return "Mất tích (NOT FOUND)";
        default:
          return status;
      }
    };

    const dataAudited = session.inspections.map((inspection, index) => ({
      STT: index + 1,
      "Mã Tài Sản": inspection.asset.assetCode,
      "Tên Thiết Bị": inspection.asset.name,
      "Kết Quả Kiểm Kê": getStatusText(inspection.status),
      "Thời Gian Quét": format(
        new Date(inspection.scannedAt),
        "HH:mm:ss dd/MM/yyyy"
      ),
      "Ghi Chú Chi Tiết": inspection.notes || "",
    }));

    const dataUnaudited = unauditedAssets.map((asset, index) => ({
      STT: index + 1,
      "Mã Tài Sản": asset.assetCode,
      "Tên Thiết Bị": asset.name,
      "Trạng Thái Hệ Thống": asset.status,
      "Cảnh Báo": "Chưa được quét trong đợt này (Nghi ngờ thất lạc)",
    }));

    const workbook = XLSX.utils.book_new();

    const auditedSheet = XLSX.utils.json_to_sheet(dataAudited);
    const unauditedSheet = XLSX.utils.json_to_sheet(dataUnaudited);

    const autoWidth = (rows: Record<string, unknown>[]) => {
      if (!rows.length) return [];

      return Object.keys(rows[0]).map((key) => ({
        wch: Math.max(
          key.length,
          ...rows.map((row) => String(row[key] ?? "").length)
        ) + 4,
      }));
    };

    auditedSheet["!cols"] = autoWidth(dataAudited);
    unauditedSheet["!cols"] = autoWidth(dataUnaudited);

    XLSX.utils.book_append_sheet(workbook, auditedSheet, "Đã kiểm kê");
    XLSX.utils.book_append_sheet(workbook, unauditedSheet, "Chưa kiểm kê");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    const fileName = `BaoCao_KiemKe_${sessionId}_${format(
      new Date(),
      "yyyyMMdd"
    )}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Export Excel Error:", error);

    return NextResponse.json(
      { message: "Lỗi máy chủ khi tạo file Excel" },
      { status: 500 }
    );
  }
}