// src/actions/document.actions.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function getDocumentDataCenter() {
  try {
    // 1. Lấy toàn bộ dữ liệu phục vụ Biên bản Cấp phát (Lịch sử + Hiện tại)
    const handovers = await prisma.assetAssignment.findMany({
      include: {
        asset: {
          select: { assetCode: true, name: true, serialNumber: true, model: true, manufacturer: true }
        },
        user: {
          select: { name: true, email: true, department: { select: { name: true } } }
        }
      },
      orderBy: { assignedDate: "desc" }
    });

    // 2. Lấy dữ liệu phục vụ Biên bản Thu hồi (Những bản ghi đã có ngày trả returnDate)
    const recalls = await prisma.assetAssignment.findMany({
      where: {
        NOT: { returnDate: null }
      },
      include: {
        asset: {
          select: { assetCode: true, name: true, serialNumber: true, model: true }
        },
        user: {
          select: { name: true, department: { select: { name: true } } }
        }
      },
      orderBy: { returnDate: "desc" }
    });

    // 3. Lấy dữ liệu phục vụ Biên bản Sửa chữa thiết bị (AssetRepair)
    const repairs = await prisma.assetRepair.findMany({
      include: {
        asset: {
          select: { assetCode: true, name: true, serialNumber: true, model: true }
        },
        creator: {
          select: { name: true, department: { select: { name: true } } }
        },
        technician: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 4. LẤY DỮ LIỆU PHỤC VỤ BIÊN BẢN BÁO MẤT TÀI SẢN (Dựa vào AssetLog)
    const lostAssets = await prisma.assetLog.findMany({
      where: {
        action: "ASSET_LOST"
      },
      include: {
        asset: {
          select: { assetCode: true, name: true, serialNumber: true, model: true }
        },
        user: {
          select: { name: true, department: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: {
        handovers,
        recalls,
        repairs,
        lostAssets // Bổ sung dữ liệu báo mất vào luồng trả về
      }
    };
  } catch (error: any) {
    console.error("Lỗi trung tâm dữ liệu biểu mẫu:", error);
    return { success: false, error: "Không thể kết nối dữ liệu biểu mẫu hệ thống." };
  }
}