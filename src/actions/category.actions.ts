// src/actions/category.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Lấy danh sách danh mục (kèm số lượng tài sản bên trong)
export async function getCategories() {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Lỗi tải danh mục:", error);
    return { success: false, error: "Không thể tải danh sách danh mục" };
  }
}

// 2. Thêm danh mục mới
export async function createCategory(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) return { success: false, error: "Tên danh mục không được để trống" };

    await prisma.assetCategory.create({
      data: { name }
    });

    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Lỗi tạo danh mục:", error);
    return { success: false, error: "Đã xảy ra lỗi khi tạo" };
  }
}

// 3. Xóa danh mục
export async function deleteCategory(id: string) {
  try {
    // Kiểm tra xem danh mục có đang chứa tài sản nào không
    const category = await prisma.assetCategory.findUnique({
      where: { id },
      include: { _count: { select: { assets: true } } }
    });

    if (category && category._count.assets > 0) {
      return { success: false, error: "Không thể xóa danh mục đang có chứa thiết bị!" };
    }

    await prisma.assetCategory.delete({ where: { id } });
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa danh mục:", error);
    return { success: false, error: "Lỗi hệ thống khi xóa" };
  }
}

export async function getCategoriesForForm() {
  return await prisma.assetCategory.findMany({ select: { id: true, name: true } });
}