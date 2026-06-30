// src/app/(dashboard)/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import UserClient from "./UserClient";

export const dynamic = "force-dynamic";

export default async function UsersManagementPage() {
  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      // BỔ SUNG LỆNH SELECT: Chỉ lấy thông tin công khai, TUYỆT ĐỐI KHÔNG lấy passwordHash
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        _count: {
          select: {
            assignedAssets: true, 
            repairTickets: true,   
          }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);

  return <UserClient initialUsers={users} departments={departments} />;
}