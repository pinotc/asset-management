// src/app/(dashboard)/assets/[id]/qr/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import QRClientCard from "./QRClientCard"; // Đã sửa đường dẫn import

export const dynamic = "force-dynamic";

export default async function PrintSingleQRPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Nâng cấp: Cho phép tìm kiếm tài sản bằng cả ID (UUID) hoặc Mã tài sản (assetCode)
  const asset = await prisma.asset.findFirst({
    where: {
      OR: [
        { id: resolvedParams.id },
        { assetCode: resolvedParams.id }
      ]
    },
    include: { department: true }
  });

  if (!asset) redirect("/assets");

  const printData = {
    assetCode: asset.assetCode,
    name: asset.name,
    model: asset.model,
    serialNumber: asset.serialNumber,
    departmentName: asset.department?.name || null
  };

  return <QRClientCard asset={printData} />;
}