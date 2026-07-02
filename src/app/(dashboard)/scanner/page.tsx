// src/app/(dashboard)/audit/scanner/page.tsx
import { prisma } from "@/lib/prisma";
import ScannerClient from "./ScannerClient";

export const dynamic = "force-dynamic";

export default async function AuditScannerPage() {
  // Lấy danh sách Vị trí từ DB để truyền xuống Client cho chức năng WRONG_LOCATION
  // (Giả định bạn đang dùng model Location hoặc tương tự, điều chỉnh tên model nếu cần)
  const locations = await prisma.assetLocation.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  }).catch(() => []); // Fallback mảng rỗng nếu chưa có bảng Location

  return <ScannerClient locations={locations} />;
}