// src/actions/department.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name?.trim()) return { success: false, error: "Tên phòng ban không được để trống!" };

    // Kiểm tra trùng tên phòng ban
    const existing = await prisma.department.findUnique({ where: { name: name.trim() } });
    if (existing) return { success: false, error: "Tên phòng ban này đã tồn tại!" };

    await prisma.department.create({
      data: { name: name.trim() }
    });

    revalidatePath("/admin/departments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi tạo phòng ban." };
  }
}

export async function updateDepartment(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name?.trim()) return { success: false, error: "Tên phòng ban không được để trống!" };

    // Kiểm tra trùng tên với các phòng ban khác ngoại trừ chính nó
    const existing = await prisma.department.findFirst({ 
      where: { name: name.trim(), NOT: { id } } 
    });
    if (existing) return { success: false, error: "Tên phòng ban này đã được sử dụng!" };

    await prisma.department.update({
      where: { id },
      data: { name: name.trim() }
    });

    revalidatePath("/admin/departments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi cập nhật phòng ban." };
  }
}

export async function deleteDepartment(id: string) {
  try {
    // Ràng buộc an toàn: Đếm số lượng nhân sự và tài sản gắn liền với phòng ban này
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { 
        _count: { 
          select: { users: true, assets: true } 
        } 
      }
    });

    if (!dept) return { success: false, error: "Không tìm thấy phòng ban." };
    
    if (dept._count.users > 0 || dept._count.assets > 0) {
      return { 
        success: false, 
        error: `Không thể xóa! Phòng ban này đang quản lý ${dept._count.users} nhân sự và ${dept._count.assets} tài sản.` 
      };
    }

    await prisma.department.delete({ where: { id } });
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống khi xóa phòng ban." };
  }
}