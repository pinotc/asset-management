// src/actions/location.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLocation(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name?.trim()) return { success: false, error: "Tên vị trí không được để trống!" };

    // Kiểm tra trùng lặp tên
    const existing = await prisma.assetLocation.findUnique({ where: { name: name.trim() } });
    if (existing) return { success: false, error: "Tên vị trí này đã tồn tại trong hệ thống!" };

    await prisma.assetLocation.create({
      data: { name: name.trim() }
    });

    revalidatePath("/locations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi tạo vị trí." };
  }
}

export async function updateLocation(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name?.trim()) return { success: false, error: "Tên vị trí không được để trống!" };

    // Kiểm tra trùng lặp (ngoại trừ chính nó)
    const existing = await prisma.assetLocation.findFirst({ 
      where: { name: name.trim(), NOT: { id } } 
    });
    if (existing) return { success: false, error: "Tên vị trí này đã được sử dụng!" };

    await prisma.assetLocation.update({
      where: { id },
      data: { name: name.trim() }
    });

    revalidatePath("/locations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi cập nhật vị trí." };
  }
}

export async function deleteLocation(id: string) {
  try {
    // Ràng buộc an toàn: Kiểm tra xem có thiết bị nào đang dùng vị trí này không
    const location = await prisma.assetLocation.findUnique({
      where: { id },
      include: { _count: { select: { assets: true } } }
    });

    if (!location) return { success: false, error: "Không tìm thấy vị trí." };
    if (location._count.assets > 0) {
      return { 
        success: false, 
        error: `Không thể xóa! Đang có ${location._count.assets} thiết bị được gắn tại vị trí này.` 
      };
    }

    await prisma.assetLocation.delete({ where: { id } });
    revalidatePath("/locations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi xóa vị trí." };
  }
}