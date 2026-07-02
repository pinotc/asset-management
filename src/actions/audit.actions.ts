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

// 3. Hàm ghi nhận quét (Đã tích hợp quy tắc nghiệp vụ tự động)
export async function submitAuditScan(
  assetCode: string, 
  sessionId: string, 
  status: AuditStatus, 
  notes?: string,
  locationId?: string // Bổ sung tham số locationId cho case WRONG_LOCATION
) {
  try {
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

      // 2. Xử lý nghiệp vụ theo từng loại Status
      if (status === "FOUND") {
        // Tài sản bình thường, ghi Log
        await tx.assetLog.create({
          data: {
            assetId: asset.id,
            userId: currentUserId,
            action: "AUDIT_SCANNED",
            details: `Kiểm kê ĐẠT [${targetSession.title}]. Ghi chú: ${notes || "Không có"}`,
          }
        });
      } 
      
      else if (status === "WRONG_LOCATION") {
        // Tài sản sai vị trí, tự động cập nhật vị trí mới nếu có truyền vào
        if (locationId) {
          await tx.asset.update({
            where: { id: asset.id },
            data: { locationId }
          });
        }
        
        await tx.assetLog.create({
          data: {
            assetId: asset.id,
            userId: currentUserId,
            action: "LOCATION_CHANGED",
            details: `Phát hiện sai vị trí qua kiểm kê [${targetSession.title}]. Đã cập nhật lại vị trí đúng. Ghi chú: ${notes || "Không có"}`,
          }
        });
      } 
      
      else if (status === "DAMAGED") {
        // Tài sản hư hỏng vật lý
        await tx.asset.update({
          where: { id: asset.id },
          data: { status: "DAMAGED" },
        });

        // TỰ ĐỘNG TẠO PHIẾU SỬA CHỮA
        const ticketNumber = `REP-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;
        await tx.assetRepair.create({
          data: {
            ticketNumber,
            assetId: asset.id,
            creatorId: currentUserId,
            description: `[TỰ ĐỘNG TẠO TỪ KIỂM KÊ - ${targetSession.title}]: Báo hỏng thiết bị. Lý do: ${notes || "Phát hiện hư hỏng vật lý."}`,
            status: "OPEN",
            issueType: "HARDWARE",
            priority: "HIGH", // Đặt mức ưu tiên cao vì phát hiện khi audit
          }
        });

        await tx.assetLog.create({
          data: {
            assetId: asset.id,
            userId: currentUserId,
            action: "STATUS_CHANGED",
            details: `Phát hiện hư hỏng qua kiểm kê [${targetSession.title}]. Hệ thống tự động tạo phiếu sửa chữa [${ticketNumber}].`,
          }
        });
      } 
      
      else if (status === "NOT_FOUND") {
        // KỊCH BẢN MẤT TÀI SẢN (LOST)
        const activeAssignments = await tx.assetAssignment.findMany({
          where: { assetId: asset.id, returnDate: null }
        });

        // Tự động đóng phiếu cấp phát
        if (activeAssignments.length > 0) {
          await tx.assetAssignment.updateMany({
            where: { assetId: asset.id, returnDate: null },
            data: {
              returnDate: new Date(),
              remark: `Hệ thống tự động đóng phiếu: Báo MẤT (NOT_FOUND) tại đợt kiểm kê [${targetSession.title}]`
            }
          });
        }

        // Cập nhật trạng thái máy thành LOST
        await tx.asset.update({
          where: { id: asset.id },
          data: { 
            status: "LOST",
            assignedUserId: null 
          },
        });

        // Ghi Sổ cái Nhật ký hệ thống (Làm cơ sở query cho Lost Asset Report)
        await tx.assetLog.create({
          data: {
            assetId: asset.id,
            userId: currentUserId,
            action: "ASSET_LOST",
            details: `Báo MẤT TÀI SẢN qua kiểm kê [${targetSession.title}]. Hệ thống đã thu hồi tự động và đưa vào danh sách Báo cáo mất tài sản. Lý do: ${notes || "Không có"}`,
          }
        });
      }

      return { inspection, assetName: asset.name };
    });

    // Làm mới cache toàn diện
    revalidatePath("/audit");
    revalidatePath("/assignments");
    revalidatePath("/recalls");
    revalidatePath("/assets");
    revalidatePath("/repairs");
    revalidatePath("/documents"); // Refresh module documents để nhận báo cáo mất
    revalidatePath("/");

    return { success: true, assetName: result.assetName };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi hệ thống khi lưu dữ liệu." };
  }
}