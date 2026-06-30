// src/actions/assignment.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 1. Lấy danh sách toàn bộ lịch sử bàn giao
export async function getAssignments() {
  try {
    const assignments = await prisma.assetAssignment.findMany({
      include: {
        asset: { select: { assetCode: true, name: true, status: true } },
        user: { select: { name: true } },
      },
      orderBy: { assignedDate: "desc" },
    });
    return { success: true, data: assignments };
  } catch (error) {
    console.error("Lỗi lấy danh sách bàn giao:", error);
    return { success: false, error: "Không thể tải lịch sử bàn giao." };
  }
}

// 2. Hàm Bàn giao thiết bị (Đã khóa chéo, ghi Log và cập nhật Vị trí)
export async function assignAsset(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = session?.user?.id || "system"; 

    const assetId = formData.get("assetId") as string;
    const userId = formData.get("userId") as string;
    const departmentId = formData.get("departmentId") as string; 
    const locationId = formData.get("locationId") as string;    
    const remark = formData.get("remark") as string;

    if (!assetId || !userId) {
      return { success: false, error: "Thiếu thông tin thiết bị hoặc người nhận." };
    }

    let newAssignmentId = ""; // Thêm biến để hứng ID

    await prisma.$transaction(async (tx) => {
      // BƯỚC 1: KHÓA CHÉO 
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new Error("Thiết bị không tồn tại trên hệ thống!");
      if (asset.status !== "IN_STOCK") {
        throw new Error(`Từ chối cấp phát! Thiết bị đang ở trạng thái: ${asset.status}`);
      }

      const activeAssignment = await tx.assetAssignment.findFirst({
        where: { assetId, returnDate: null }
      });
      if (activeAssignment) {
        throw new Error("Lỗi dữ liệu: Thiết bị này vẫn chưa được thu hồi trên hệ thống!");
      }

      // BƯỚC 2: Đổi trạng thái thiết bị thành ASSIGNED
      await tx.asset.update({
        where: { id: assetId },
        data: {
          assignedUserId: userId,
          departmentId: departmentId || null,
          locationId: locationId || null,
          status: "ASSIGNED",
        },
      });

      // BƯỚC 3: Tạo bản ghi lịch sử bàn giao (SỬA Ở ĐÂY ĐỂ LẤY ID)
      const newAssignment = await tx.assetAssignment.create({
        data: {
          assetId,
          userId,
          remark,
        },
      });
      newAssignmentId = newAssignment.id; // Lưu lại ID thật của Database

      // BƯỚC 4: Ghi nhật ký vào Sổ cái
      const targetUser = await tx.user.findUnique({ where: { id: userId } });
      await tx.assetLog.create({
        data: {
          assetId,
          userId: adminId,
          action: "ASSIGNED",
          details: `Cấp phát cho nhân sự: ${targetUser?.name || userId}. Ghi chú: ${remark || "Không có"}`,
        }
      });
    });

    revalidatePath("/assets");
    revalidatePath("/assignments");
    revalidatePath("/");
    
    // TRẢ VỀ ID THẬT CHO FRONTEND MỞ TAB IN
    return { success: true, data: { id: newAssignmentId } };
  } catch (error: any) {
    console.error("Lỗi bàn giao tài sản:", error);
    return { success: false, error: error.message || "Lỗi hệ thống khi bàn giao thiết bị." };
  }
}

// 3. Hàm Thu hồi thiết bị (Đã chuẩn hóa trạng thái thông minh và ghi Log)
export async function returnAsset(assignmentId: string, assetId: string, remark?: string) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = session?.user?.id || "system";

    await prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({
        where: { id: assignmentId },
        include: { asset: true }
      });

      if (!assignment || assignment.returnDate) {
        throw new Error("Giao dịch không hợp lệ hoặc thiết bị đã được thu hồi trước đó.");
      }

      // BƯỚC 1: Cập nhật ngày trả và ghi chú bổ sung trong bảng Assignment
      await tx.assetAssignment.update({
        where: { id: assignmentId },
        data: { 
          returnDate: new Date(),
          remark: remark ? `${assignment.remark ? assignment.remark + ' | ' : ''}Thu hồi: ${remark}` : assignment.remark
        },
      });

      // BƯỚC 2: Logic giữ trạng thái lỗi. 
      // Nếu máy đang hỏng/sửa chữa/mất tích thì KHÔNG đưa về kho (IN_STOCK).
      const currentStatus = assignment.asset.status as string;
      const isDamagedStatus = ["DAMAGED", "UNDER_REPAIR", "LOST"].includes(currentStatus);
      const newStatus = isDamagedStatus ? currentStatus : "IN_STOCK";

      // BƯỚC 3: Gỡ người giữ, xóa vị trí/phòng ban và cập nhật trạng thái thiết bị
      await tx.asset.update({
        where: { id: assetId },
        data: {
          assignedUserId: null,
          departmentId: null, // Xóa phòng ban để trả về trạng thái "Trong kho"
          locationId: null,   // Xóa vị trí để trả về trạng thái "Trong kho"
          status: newStatus as any,
        },
      });

      // BƯỚC 4: Ghi nhật ký vào Sổ cái
      await tx.assetLog.create({
        data: {
          assetId,
          userId: adminId,
          action: "RECALLED",
          details: `Đã thu hồi thiết bị. Trạng thái sau thu hồi: ${newStatus}`,
        }
      });
    });

    revalidatePath("/assets");
    revalidatePath("/assignments");
    revalidatePath("/recalls");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi thu hồi tài sản:", error);
    return { success: false, error: error.message || "Không thể thu hồi thiết bị này." };
  }
}