// src/actions/repair.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function createRepairTicket(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Vui lòng đăng nhập!" };

    const assetId = formData.get("assetId") as string;
    const description = formData.get("description") as string; 

    if (!assetId || !description) return { success: false, error: "Vui lòng nhập đầy đủ thông tin!" };

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return { success: false, error: "Không tìm thấy thiết bị này!" };

    const ticketNumber = `REP-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`;

    await prisma.$transaction(async (tx) => {
      await tx.assetRepair.create({
        data: {
          ticketNumber,
          assetId: asset.id,
          creatorId: session.user.id,
          description: description,
          status: "OPEN",
          issueType: "HARDWARE",
          priority: "MEDIUM",
        }
      });

      // Lưu ý: Chưa update trạng thái thiết bị ở đây nếu muốn đợi Admin xác nhận thu hồi qua workflow
      await tx.assetLog.create({
        data: {
          assetId: asset.id,
          userId: session.user.id,
          action: "REPAIR_REQUESTED",
          details: `Báo hỏng thiết bị. Mã phiếu: ${ticketNumber}. Nội dung: ${description}`,
        }
      });
    });

    revalidatePath("/repairs");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 1. Luồng bắt đầu sửa chữa (Tích hợp Thu hồi)
export async function startRepairWorkflow(ticketId: string, shouldRecall: boolean, locationId?: string, remark?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Vui lòng đăng nhập!" };

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.assetRepair.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new Error("Không tìm thấy phiếu sửa chữa!");

      let assignmentIdForPrint = null;

      if (shouldRecall) {
        const activeAssignment = await tx.assetAssignment.findFirst({
          where: { assetId: ticket.assetId, returnDate: null }
        });

        if (activeAssignment) {
          assignmentIdForPrint = activeAssignment.id;
          await tx.assetAssignment.update({
            where: { id: activeAssignment.id },
            data: { returnDate: new Date(), remark: remark || "Thu hồi sửa chữa" }
          });
        }
        await tx.asset.update({ where: { id: ticket.assetId }, data: { status: "UNDER_REPAIR", locationId: locationId } });
      } else {
        await tx.asset.update({ where: { id: ticket.assetId }, data: { status: "UNDER_REPAIR" } });
      }

      await tx.assetRepair.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS", technicianId: session.user.id, hasRecall: shouldRecall, assignmentId: assignmentIdForPrint }
      });

      return { assignmentId: assignmentIdForPrint };
    });

    revalidatePath("/repairs");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. IT Nghiệm thu hoàn thành (Chuyển sang lưu Ghi chú thay vì Chi phí)
export async function completeRepairWorkflow(ticketId: string, note?: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.assetRepair.findUnique({ 
        where: { id: ticketId }, 
        include: { asset: true } 
      });
      if (!ticket) throw new Error("Không tìm thấy phiếu sửa chữa!");

      let newAssignmentId = null;
      const completionRemark = note ? `Ghi chú xử lý: ${note}` : `Bàn giao trả lại máy sau sửa chữa phiếu: ${ticket.ticketNumber}`;

      if (ticket.hasRecall) {
        // Đưa máy về trạng thái hoạt động bình thường
        await tx.asset.update({ where: { id: ticket.assetId }, data: { status: "ASSIGNED" } });
        
        // Tạo lệnh tái cấp phát với ghi chú nghiệm thu
        const lastAssignment = await tx.assetAssignment.findFirst({
          where: { assetId: ticket.assetId },
          orderBy: { createdAt: "desc" }
        });

        if (lastAssignment) {
          const newAssignment = await tx.assetAssignment.create({
            data: { 
              assetId: ticket.assetId, 
              userId: lastAssignment.userId, 
              assignedDate: new Date(), 
              remark: completionRemark
            }
          });
          newAssignmentId = newAssignment.id;
        }
      } else {
        await tx.asset.update({ where: { id: ticket.assetId }, data: { status: "ASSIGNED" } });
      }

      // Đóng phiếu sửa chữa, nối ghi chú mới vào cuối phần description hiện tại
      await tx.assetRepair.update({
        where: { id: ticketId },
        data: { 
          status: "COMPLETED", 
          completedAt: new Date(), 
          assignmentId: newAssignmentId,
          description: note ? `${ticket.description}\n\n[NGHIỆM THU]: ${note}` : ticket.description
        }
      });

      return { newAssignmentId };
    });

    revalidatePath("/repairs");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}