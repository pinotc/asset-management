// src/actions/user.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

// 1. Hàm tạo User mới (Giữ nguyên)
export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const departmentId = formData.get("departmentId") as string;

    if (!name || !email || !password) {
      return { success: false, error: "Vui lòng nhập đầy đủ Tên, Email và Mật khẩu!" };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, error: "Email này đã được sử dụng!" };

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as any,
        departmentId: departmentId === "NONE" ? null : departmentId,
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi tạo tài khoản." };
  }
}

// 2. Hàm Cập nhật vai trò phân quyền nhanh trên danh sách (Giữ nguyên)
export async function updateUserPermissions(userId: string, role: string, departmentId: string | null) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = session?.user?.id || "system";

    if (userId === adminId && role !== "ADMIN") {
      return { success: false, error: "Bạn không thể tự hạ quyền ADMIN của chính mình!" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role as any, departmentId }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi phân quyền." };
  }
}

// 3. BỔ SUNG: Hàm sửa thông tin cá nhân (Tên & Email)
export async function updateUserAdmin(userId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name?.trim() || !email?.trim()) {
      return { success: false, error: "Tên và Email không được để trống!" };
    }

    // Kiểm tra trùng email với tài khoản khác
    const existing = await prisma.user.findFirst({
      where: { email: email.trim(), NOT: { id: userId } }
    });
    if (existing) return { success: false, error: "Email này đã được sử dụng bởi tài khoản khác!" };

    await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim(), email: email.trim() }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi cập nhật thông tin." };
  }
}

// 4. BỔ SUNG: Hàm Ép đặt lại mật khẩu mới (Reset Password)
export async function resetUserPasswordAdmin(userId: string, formData: FormData) {
  try {
    const newPassword = formData.get("password") as string;

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Mật khẩu mới phải có độ dài tối thiểu từ 6 ký tự trở lên!" };
    }

    // Mã hóa mật khẩu an toàn
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi đặt lại mật khẩu." };
  }
}

//5. Đổi mật khẩu người dùng
export async function changePassword(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập." };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Mật khẩu xác nhận không khớp!" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
    }

    // Lấy thông tin user hiện tại
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Lỗi dữ liệu tài khoản." };
    }

    // Kiểm tra mật khẩu cũ
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Mật khẩu hiện tại không đúng." };
    }

    // Mã hóa và cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Lỗi đổi mật khẩu:", error);
    return { success: false, error: "Lỗi hệ thống khi đổi mật khẩu." };
  }
}

// Hàm lấy danh sách người dùng (Khôi phục lại cho trang /users)
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: { name: true }
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: users };
  } catch (error: any) {
    console.error("Lỗi lấy danh sách người dùng:", error);
    return { success: false, error: "Không thể lấy dữ liệu người dùng." };
  }
}