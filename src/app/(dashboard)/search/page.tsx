// src/app/(dashboard)/search/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Monitor, Wrench, Search as SearchIcon, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

// Cập nhật kiểu dữ liệu cho searchParams là Promise
export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>; 
}) {
  // BẮT BUỘC: Sử dụng await để lấy giá trị từ searchParams
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  // Nếu không có từ khóa, hiển thị giao diện trống
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <SearchIcon className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Vui lòng nhập từ khóa tìm kiếm</h2>
      </div>
    );
  }

  // Truy vấn tìm kiếm (giữ nguyên logic của bạn)
  const [assets, repairs] = await Promise.all([
    prisma.asset.findMany({
      where: {
        OR: [
          { assetCode: { contains: query } },
          { name: { contains: query } },
          { serialNumber: { contains: query } },
        ]
      },
      take: 10
    }),
    prisma.assetRepair.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: query } },
          { description: { contains: query } },
        ]
      },
      include: { asset: { select: { assetCode: true } } },
      take: 10
    })
  ]);

  const totalResults = assets.length + repairs.length;

  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Kết quả tìm kiếm cho: <span className="text-samsung">"{query}"</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Tìm thấy {totalResults} kết quả phù hợp.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kết quả Thiết bị */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" /> Kho Thiết bị ({assets.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {assets.length > 0 ? (
              assets.map(asset => (
                <Link key={asset.id} href={`/assets/${asset.id}`} className="block p-4 hover:bg-blue-50/50">
                  <p className="font-bold text-gray-900">{asset.assetCode}</p>
                  <p className="text-sm text-gray-500">{asset.name}</p>
                </Link>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500">Không tìm thấy thiết bị.</p>
            )}
          </div>
        </div>

        {/* Kết quả Phiếu Sửa Chữa */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" /> Phiếu Sửa Chữa ({repairs.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {repairs.length > 0 ? (
              repairs.map(repair => (
                <Link key={repair.id} href={`/repairs/${repair.id}`} className="block p-4 hover:bg-amber-50/50">
                  <p className="font-bold text-gray-900">{repair.ticketNumber}</p>
                  <p className="text-sm text-gray-500">{repair.description}</p>
                </Link>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500">Không tìm thấy phiếu sửa chữa.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}