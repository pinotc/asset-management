// src/actions/permission.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function getUsersPermissions() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, allowedModules: true, department: { select: { name: true } } },
      orderBy: { name: "asc" }
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: "Lỗi lấy dữ liệu người dùng" };
  }
}

// ĐỔI TÊN VÀ NÂNG CẤP HÀM NÀY
export async function updateUserPermissions(userId: string, role: string, modules: string[]) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên MES mới có quyền cấu hình tài khoản." };
    }

    // Cập nhật cả Role và Module vào DB
    await prisma.user.update({
      where: { id: userId },
      data: { 
        role: role as any, // Ép kiểu an toàn cho Enum Role của Prisma
        allowedModules: modules 
      }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Lỗi cập nhật quyền:", error);
    return { success: false, error: "Không thể cập nhật quyền và chức vụ." };
  }
}