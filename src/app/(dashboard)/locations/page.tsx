// src/app/(dashboard)/locations/page.tsx
import { prisma } from "@/lib/prisma";
import LocationClient from "./LocationClient";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  // Lấy danh sách vị trí kèm theo số lượng tài sản đang có tại đó
  const locations = await prisma.assetLocation.findMany({
    include: {
      _count: { select: { assets: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return <LocationClient initialData={locations} />;
}