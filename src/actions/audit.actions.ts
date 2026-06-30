// src/actions/audit.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type AuditStatus = "FOUND" | "NOT_FOUND" | "WRONG_LOCATION" | "DAMAGED";

// 1. Tạo phiên kiểm kê mới
export async function createAuditSession(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title) return { success: false, error: "Vui lòng nhập tên phiên!" };

  await prisma.auditSession.create({
    data: { title, status: "OPEN" }
  });

  revalidatePath("/audit");
  return { success: true };
}

// 2. Chốt/Khóa phiên kiểm kê
export async function closeAuditSession(sessionId: string) {
  await prisma.auditSession.update({
    where: { id: sessionId },
    data: { status: "CLOSED" }
  });
  revalidatePath("/audit");
  return { success: true };
}

// 3. Hàm ghi nhận quét (Đã đồng bộ tự động thu hồi và chốt log trách nhiệm)
export async function submitAuditScan(
  assetCode: string, 
  sessionId: string, 
  status: AuditStatus, 
  notes?: string
) {
  try {
    // Lấy thông tin tài khoản đang thực hiện thao tác kiểm kê
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || "system";

    // KIỂM TRA: Phiên có tồn tại và đang mở không?
    const targetSession = await prisma.auditSession.findUnique({ where: { id: sessionId } });
    if (!targetSession) throw new Error("Phiên kiểm kê không tồn tại!");
    if (targetSession.status === "CLOSED") throw new Error("Phiên này đã bị khóa, không thể ghi nhận thêm!");

    const result = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { assetCode } });
      if (!asset) throw new Error("Không tìm thấy mã tài sản này trong hệ thống!");

      // Kiểm tra xem máy này đã quét trong đợt này chưa
      const existingScan = await tx.assetInspection.findFirst({
        where: { sessionId, assetId: asset.id }
      });
      if (existingScan) throw new Error(`Tài sản ${assetCode} đã được quét trong phiên này rồi!`);

      // 1. Tạo bản ghi kiểm kê lịch sử
      const inspection = await tx.assetInspection.create({
        data: { sessionId, assetId: asset.id, status, notes },
      });

      // 2. Xử lý đồng bộ trạng thái vòng đời thiết bị
      if (status === "DAMAGED" || status === "NOT_FOUND") {
        const newStatus = status === "DAMAGED" ? "DAMAGED" : "LOST";

        // KỊCH BẢN ĐẶC BIỆT: Nếu báo MẤT TÍCH (NOT_FOUND) -> Chốt trách nhiệm bàn giao
        if (status === "NOT_FOUND") {
          // Tìm các phiếu mượn/cấp phát của thiết bị này đang treo (returnDate = null)
          const activeAssignments = await tx.assetAssignment.findMany({
            where: { assetId: asset.id, returnDate: null }
          });

          // Tiến hành đóng và chốt đóng tự động toàn bộ phiếu cấp phát
          if (activeAssignments.length > 0) {
            await tx.assetAssignment.updateMany({
              where: { assetId: asset.id, returnDate: null },
              data: {
                returnDate: new Date(),
                remark: `Hệ thống tự động đóng phiếu: Phát hiện mất tích (NOT_FOUND) tại đợt kiểm kê [${targetSession.title}]`
              }
            });
          }

          // Cập nhật trạng thái máy thành LOST và gỡ liên kết người giữ trực tiếp trên bảng Asset
          await tx.asset.update({
            where: { id: asset.id },
            data: { 
              status: newStatus as any,
              assignedUserId: null 
            },
          });
        } else {
          // Nếu báo HỎNG (DAMAGED), giữ nguyên thông tin cấp phát (nếu có) nhưng chuyển trạng thái tài sản
          await tx.asset.update({
            where: { id: asset.id },
            data: { status: newStatus as any },
          });
        }

        // 3. Ghi Sổ cái Nhật ký hệ thống (AssetLog) chốt vết sự cố
        await tx.assetLog.create({
          data: {
            assetId: asset.id,
            userId: currentUserId,
            action: "STATUS_CHANGED",
            details: `Phát hiện bất thường qua kiểm kê [${targetSession.title}] - Tình trạng: ${status}.${status === "NOT_FOUND" ? " Hệ thống đã thu hồi tự động các phiếu cấp phát đang mở." : ""}`,
          }
        });
      } else {
        // Ghi nhận lịch sử kiểm kê thông thường (FOUND hoặc WRONG_LOCATION) vào Sổ cái Log
        await tx.assetLog.create({
          data: {
            assetId: asset.id,
            userId: currentUserId,
            action: "AUDIT_SCANNED",
            details: `Kiểm kê đợt [${targetSession.title}] - Kết quả: ${status}. Ghi chú: ${notes || "Không có"}`,
          }
        });
      }

      return { inspection, assetName: asset.name };
    });

    // Làm mới cache dữ liệu toàn diện trên các view liên quan
    revalidatePath("/audit");
    revalidatePath("/assignments");
    revalidatePath("/recalls");
    revalidatePath("/assets");
    revalidatePath("/");

    return { success: true, assetName: result.assetName };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi hệ thống khi lưu dữ liệu." };
  }
}