// src/app/(dashboard)/consumables/page.tsx
import { prisma } from "@/lib/prisma";
import { Package, AlertTriangle } from "lucide-react";
import ConsumableClient from "./ConsumableClient";

export const dynamic = "force-dynamic";

export default async function ConsumablesPage() {
  const [consumables, departments] = await Promise.all([
    prisma.consumable.findMany({
      orderBy: { currentStock: 'asc' }, // Ưu tiên hiện các món sắp hết lên đầu
      include: {
        // Kéo thêm 50 giao dịch gần nhất của mỗi vật tư để hiển thị lịch sử
        transactions: {
          include: { department: true },
          orderBy: { transactionDate: 'desc' },
          take: 50
        }
      }
    }),
    prisma.department.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  const lowStockCount = consumables.filter(c => c.currentStock <= c.minStockLevel).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-samsung" />
            Kho Vật Tư Tiêu Hao
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý giấy in tem MES, mực in, linh kiện hao mòn và dự báo mua hàng.
          </p>
        </div>
        
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
            <AlertTriangle className="h-4 w-4" /> Có {lowStockCount} vật tư sắp cạn kiệt!
          </div>
        )}
      </div>

      <ConsumableClient consumables={consumables} departments={departments} />
    </div>
  );
}