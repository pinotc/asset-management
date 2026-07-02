// src/actions/consumable.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. NHẬP KHO VẬT TƯ (Nhận hàng)
export async function receiveConsumable(data: { consumableId: string; quantity: number; notes?: string }) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.consumableTransaction.create({
        data: {
          consumableId: data.consumableId,
          type: "RECEIVED",
          quantity: data.quantity,
          notes: data.notes,
        }
      });
      await tx.consumable.update({
        where: { id: data.consumableId },
        data: { currentStock: { increment: data.quantity } }
      });
    });
    revalidatePath("/consumables");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi khi nhập kho vật tư." };
  }
}

// 2. XUẤT KHO CẤP PHÁT & TÍNH TOÁN DỰ BÁO TIÊU HAO
export async function allocateConsumable(data: { consumableId: string; quantity: number; departmentId: string; receiverName: string; notes?: string }) {
  try {
    const consumable = await prisma.consumable.findUnique({ where: { id: data.consumableId } });
    if (!consumable || consumable.currentStock < data.quantity) {
      return { success: false, error: "Tồn kho không đủ để cấp phát!" };
    }

    await prisma.$transaction(async (tx) => {
      // 2.1 Tạo lịch sử xuất kho
      await tx.consumableTransaction.create({
        data: {
          consumableId: data.consumableId,
          type: "ALLOCATED",
          quantity: data.quantity,
          departmentId: data.departmentId,
          receiverName: data.receiverName,
          notes: data.notes,
        }
      });

      // 2.2 Trừ tồn kho
      const updatedConsumable = await tx.consumable.update({
        where: { id: data.consumableId },
        data: { currentStock: { decrement: data.quantity } }
      });

      // 2.3 Chạy thuật toán dự báo (Dựa trên 30 ngày qua)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usageStats = await tx.consumableTransaction.aggregate({
        where: { consumableId: data.consumableId, type: "ALLOCATED", transactionDate: { gte: thirtyDaysAgo } },
        _sum: { quantity: true }
      });

      const totalUsed = usageStats._sum.quantity || 0;
      
      if (totalUsed > 0) {
        const avgDailyUsage = totalUsed / 30; 
        const daysUntilEmpty = updatedConsumable.currentStock / avgDailyUsage;
        
        const estimatedOutDate = new Date();
        estimatedOutDate.setDate(estimatedOutDate.getDate() + daysUntilEmpty);
        
        const nextReorderDate = new Date(estimatedOutDate);
        nextReorderDate.setDate(nextReorderDate.getDate() - updatedConsumable.leadTimeDays);

        await tx.consumable.update({
          where: { id: data.consumableId },
          data: { avgDailyUsage, estimatedOutDate, nextReorderDate }
        });
      }
    });

    revalidatePath("/consumables");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi xuất kho." };
  }
}

// 3. TẠO MỚI DANH MỤC VẬT TƯ
export async function createConsumable(data: { name: string; unit: string; minStockLevel: number; leadTimeDays: number }) {
  try {
    await prisma.consumable.create({
      data: {
        name: data.name,
        unit: data.unit,
        minStockLevel: data.minStockLevel,
        leadTimeDays: data.leadTimeDays,
        currentStock: 0, // Mặc định ban đầu là 0, chờ nhập kho
      }
    });
    revalidatePath("/consumables");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi tạo vật tư mới." };
  }
}