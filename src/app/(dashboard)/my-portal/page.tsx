// src/app/(dashboard)/my-portal/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import UserPortalClient from "./UserPortalClient";
import { UserCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UserPortalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Kéo danh sách thiết bị ĐANG ĐƯỢC GIAO cho user này
  const myAssets = await prisma.asset.findMany({
    where: { 
      assignedUserId: session.user.id,
      status: "ASSIGNED"
    },
    select: {
      id: true,
      assetCode: true,
      name: true,
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-samsung" />
          Khu vực cá nhân
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Xin chào <span className="font-bold text-gray-800">{session.user.name}</span>. Quản lý yêu cầu hỗ trợ và bảo mật tài khoản tại đây.
        </p>
      </div>

      <UserPortalClient myAssets={myAssets} />
    </div>
  );
}