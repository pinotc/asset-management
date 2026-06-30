// src/app/(dashboard)/assets/new/page.tsx
import { prisma } from "@/lib/prisma";
import CreateAssetForm from "@/components/forms/CreateAssetForm";
import { PackagePlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  // Tối ưu hóa: Chỉ lấy id và name để truyền xuống Client Form, giúp trang tải nhanh hơn
  const categories = await prisma.assetCategory.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-12">
      {/* Header trang */}
      <div className="flex items-center gap-4">
        <Link 
          href="/assets" 
          className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-samsung" />
            Nhập kho Tài sản mới
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Khai báo thông tin cấu hình thiết bị để khởi tạo dữ liệu và sinh mã tem QR.
          </p>
        </div>
      </div>

      {/* Render Form (Đã chứa sẵn logic hiện nút In QR ở trong) */}
      <CreateAssetForm categories={categories} />
    </div>
  );
}