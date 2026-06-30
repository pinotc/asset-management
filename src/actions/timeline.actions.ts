// src/actions/timeline.actions.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function getAssetTimelineByCode(assetCode: string) {
  try {
    if (!assetCode?.trim()) return { success: false, error: "Vui lòng nhập mã tài sản!" };

    // Tìm thiết bị dựa trên mã code nhập vào hoặc quét được
    const asset = await prisma.asset.findUnique({
      where: { assetCode: assetCode.trim().toUpperCase() },
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
        logs: {
          include: {
            user: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" } // Mới nhất xếp lên đầu
        }
      }
    });

    if (!asset) return { success: false, error: "Không tìm thấy mã thiết bị này trong hệ thống!" };

    return { success: true, data: asset };
  } catch (error) {
    console.error("Lỗi tra cứu dòng thời gian:", error);
    return { success: false, error: "Lỗi hệ thống khi tra cứu dữ liệu." };
  }
}