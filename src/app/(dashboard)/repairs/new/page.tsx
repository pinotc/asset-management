import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Wrench, ArrowLeft } from "lucide-react";
import Link from "next/link";
import RepairForm from "./RepairForm";

export const dynamic = "force-dynamic";

export default async function NewRepairPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const activeAssignments = await prisma.assetAssignment.findMany({
    where: {
      userId: session.user.id,
      returnDate: null, 
    },
    include: { 
      asset: {
        select: {
          id: true,
          assetCode: true,
          name: true,
        }
      } 
    }
  });

  const assignedAssets = activeAssignments.map(a => a.asset);

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/repairs" className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-sm">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-500" />
            Gửi yêu cầu Sửa chữa
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Báo hỏng cho các thiết bị mà bạn đang trực tiếp sử dụng.</p>
        </div>
      </div>

      <RepairForm assets={assignedAssets} />
    </div>
  );
}