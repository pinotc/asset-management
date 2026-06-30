// src/actions/asset.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { assetSchema, AssetFormValues } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Sửa đổi hàm createAsset trong file src/actions/asset.actions.ts
export async function createAsset(data: any) { // Dùng any để nhận payload linh hoạt
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || "system";

    const currentYear = new Date().getFullYear();
    const count = await prisma.asset.count();
    const nextNumber = String(count + 1).padStart(6, "0");
    const assetCode = `AST-${currentYear}-${nextNumber}`;

    // Xử lý Ngày nhập kho (được map vào DB là purchaseDate)
    const pDate = (data as any).purchaseDate ? new Date((data as any).purchaseDate) : null;

    const result = await prisma.$transaction(async (tx) => {
      const newAsset = await tx.asset.create({
        data: {
          assetCode,
          name: data.name,
          model: data.model,
          serialNumber: data.serialNumber,
          manufacturer: data.manufacturer,
          price: data.price ? Number(data.price) : 0, // Đảm bảo lưu đúng định dạng số
          categoryId: data.categoryId,
          imageUrl: data.imageUrl,
          purchaseDate: pDate, // Lưu ngày nhập kho vào DB
          status: "IN_STOCK",
        },
      });

      const formattedDateStr = pDate ? pDate.toLocaleDateString("vi-VN") : "N/A";
      await tx.assetLog.create({
        data: {
          assetId: newAsset.id,
          userId: currentUserId,
          action: "CREATED",
          details: `Nhập mới thiết bị vào hệ thống. Ngày nhập kho: ${formattedDateStr}`,
        }
      });

      return newAsset;
    });

    revalidatePath("/assets");
    revalidatePath("/");
    
    // KHẮC PHỤC LỖI DECIMAL: Chỉ trả về chuỗi text an toàn, không trả về object prisma chứa Decimal
    return { success: true, assetCode: result.assetCode };
  } catch (error: any) {
    console.error("Lỗi khi tạo tài sản:", error);
    return { success: false, error: error.message || "Không thể tạo tài sản" };
  }
}

export async function getAssets() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        department: true,
      },
    });
    return { success: true, data: assets };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài sản:", error);
    return { success: false, error: "Không thể lấy dữ liệu" };
  }
}

export async function assignAssetToUser(
  assetId: string, 
  userId: string,
  remark: string
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || "system";

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.create({
        data: {
          assetId,
          userId,
          remark,
        }
      });

      const updatedAsset = await tx.asset.update({
        where: { id: assetId },
        data: { 
          status: "ASSIGNED",
          assignedUserId: userId 
        }
      });

      await tx.assetLog.create({
        data: {
          assetId,
          userId: currentUserId,
          action: "ASSIGNED",
          details: `Cấp phát cho: ${userId}. Ghi chú: ${remark}`
        }
      });

      return updatedAsset;
    });

    revalidatePath("/assets");
    revalidatePath("/assignments");
    revalidatePath("/");
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Lỗi khi cấp phát:", error);
    return { success: false, error: "Không thể thực hiện cấp phát" };
  }
}

export async function getAssetDetails(assetId: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        category: true,
        department: true,
        logs: {
          orderBy: { createdAt: 'desc' }
        },
        assignments: {
          orderBy: { assignedDate: 'desc' },
          take: 5
        },
        inspections: {
          orderBy: { id: 'desc' },
          take: 5
        }
      }
    });
    
    return { success: true, data: asset };
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết tài sản:", error);
    return { success: false, error: "Không thể lấy dữ liệu" };
  }
}

export async function updateAsset(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || "system";

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const categoryId = formData.get("categoryId") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const manufacturer = formData.get("manufacturer") as string;
    const model = formData.get("model") as string;
    const priceStr = formData.get("price") as string;
    const purchaseDate = formData.get("purchaseDate") as string;

    if (!id || !name || !categoryId) {
      return { success: false, error: "Thiếu thông tin bắt buộc!" };
    }

    const price = priceStr ? parseFloat(priceStr) : 0;
    const pDate = purchaseDate ? new Date(purchaseDate) : null;

    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id } });
      if (!asset) throw new Error("Không tìm thấy thiết bị!");

      await tx.asset.update({
        where: { id },
        data: {
          name,
          categoryId,
          serialNumber,
          manufacturer,
          model,
          price: price,
          purchaseDate: pDate,
        },
      });

      await tx.assetLog.create({
        data: {
          assetId: id,
          userId: currentUserId,
          action: "UPDATED",
          details: `Cập nhật thông tin cấu hình/hành chính của thiết bị.`,
        }
      });
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Lỗi cập nhật tài sản:", error);
    return { success: false, error: "Không thể cập nhật tài sản." };
  }
}

export async function deleteAsset(id: string) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || "system";

    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id },
      });

      if (!asset) {
        throw new Error("Không tìm thấy tài sản để xóa.");
      }

      if (asset.assignedUserId) {
        throw new Error("Không thể thanh lý! Thiết bị này đang được cấp phát cho nhân sự.");
      }

      await tx.asset.update({
        where: { id },
        data: { status: "DISPOSED" },
      });

      await tx.assetLog.create({
        data: {
          assetId: id,
          userId: currentUserId,
          action: "DISPOSED",
          details: `Đã xuất thanh lý / Tiêu hủy thiết bị ra khỏi hệ thống xưởng.`,
        }
      });
    });

    revalidatePath("/assets");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi xóa tài sản:", error);
    return { success: false, error: error.message || "Không thể thanh lý tài sản này." };
  }
}

export async function updateAssetStatus(assetId: string, newStatus: string, remark: string) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || "system";

    if (!newStatus || !remark) {
      return { success: false, error: "Vui lòng chọn trạng thái mới và nhập lý do!" };
    }

    await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new Error("Không tìm thấy thiết bị!");

      if (asset.status === newStatus) {
        throw new Error("Thiết bị đang ở trạng thái này rồi!");
      }

      await tx.asset.update({
        where: { id: assetId },
        data: { status: newStatus as any },
      });

      await tx.assetLog.create({
        data: {
          assetId,
          userId: currentUserId,
          action: "STATUS_CHANGED",
          details: `Admin cập nhật trạng thái thủ công: [${asset.status}] ➡️ [${newStatus}]. Lý do: ${remark}`,
        }
      });
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi cập nhật trạng thái thủ công:", error);
    return { success: false, error: error.message || "Không thể chuyển đổi trạng thái tài sản." };
  }
}