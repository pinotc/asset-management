// src/app/(dashboard)/assignments/page.tsx
import { prisma } from "@/lib/prisma";
import { getAssignments } from "@/actions/assignment.actions";
import AssignmentTable from "@/components/ui/AssignmentTable";
import AssignmentClientForm from "./AssignmentClientForm";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const [availableAssets, users, departments, locations] = await Promise.all([
    // 1. Thiết bị sẵn sàng cấp phát
    prisma.asset.findMany({
      where: {
        status: "IN_STOCK",
      },
      select: {
        id: true,
        assetCode: true,
        name: true,
        serialNumber: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    // 2. User kèm ID Phòng ban (Dùng để logic auto-fill tự động chọn phòng ban)
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        departmentId: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    // 3. Danh sách TẤT CẢ phòng ban (Bắt buộc phải có để render danh sách thả xuống <select>)
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    // 4. Danh sách vị trí sử dụng
    prisma.assetLocation.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc", // Sắp xếp theo tên cho dễ tìm
      },
    }),
  ]);

  const response = await getAssignments();
  const assignments = response.success ? response.data : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-samsung" />
            Quản lý Bàn giao
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Giao thiết bị, in biên bản A4 tự động và theo dõi quá trình thu hồi tài sản.
          </p>
        </div>
      </div>

      {/* Form cấp phát (Truyền đủ 4 biến) */}
      <AssignmentClientForm
        assets={availableAssets}
        users={users}
        departments={departments}
        locations={locations}
      />

      {/* Lịch sử giao nhận */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Lịch sử giao nhận
        </h2>

        <AssignmentTable assignments={assignments || []} />
      </div>
    </div>
  );
}