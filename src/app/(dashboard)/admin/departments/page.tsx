// src/app/(dashboard)/admin/departments/page.tsx
import { prisma } from "@/lib/prisma";
import DepartmentClient from "./DepartmentClient";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  // Lấy danh sách phòng ban kèm đếm số lượng users và assets bên trong
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { users: true, assets: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return <DepartmentClient initialData={departments} />;
}