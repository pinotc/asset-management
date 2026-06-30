// src/actions/recall.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// BỔ SUNG THÊM THAM SỐ locationId VÀO ĐÂY
export async function processRecall(assignmentId: string, locationId: string, remark?: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // Lấy giao dịch kèm theo trạng thái tài sản hiện tại
      const assignment = await tx.assetAssignment.findUnique({
        where: { id: assignmentId },
        include: { asset: true }
      });

      if (!assignment || assignment.returnDate) {
        throw new Error("Giao dịch không hợp lệ hoặc thiết bị đã được thu hồi trước đó.");
      }

      // 1. Chốt ngày thu hồi và cập nhật ghi chú (nếu có)
      await tx.assetAssignment.update({
        where: { id: assignmentId },
        data: {
          returnDate: new Date(),
          remark: remark ? `${assignment.remark ? assignment.remark + ' | ' : ''}Thu hồi: ${remark}` : assignment.remark
        }
      });

      // 2. Logic cập nhật trạng thái thông minh
      const currentStatus = assignment.asset.status as string;
      const isDamagedStatus = ["DAMAGED", "UNDER_REPAIR", "LOST"].includes(currentStatus);
      const newStatus = isDamagedStatus ? currentStatus : "IN_STOCK";

      // Trả trạng thái thiết bị VÀ CẬP NHẬT VỊ TRÍ MỚI
      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { 
          status: newStatus as any,
          locationId: locationId // LƯU VỊ TRÍ MỚI VÀO KHO
        }
      });
    });

    revalidatePath("/recalls");
    revalidatePath("/assignments");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}