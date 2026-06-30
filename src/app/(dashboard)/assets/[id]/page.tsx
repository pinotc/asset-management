// src/app/(dashboard)/assets/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Cpu,
  Calendar,
  DollarSign,
  History,
  Package,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { updateAsset } from "@/actions/asset.actions";
import StatusOverrideForm from "./StatusOverrideForm";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      logs: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!asset) {
    notFound();
  }

  const categories = await prisma.assetCategory.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  async function handleUpdate(formData: FormData) {
    "use server";

    const result = await updateAsset(formData);

    if (result?.success) {
      redirect("/assets");
    }

    console.error(result?.error);
  }

  const formattedDate = asset.purchaseDate
    ? asset.purchaseDate.toISOString().split("T")[0]
    : "";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/assets"
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-samsung" />
            Chi tiết Thiết bị
          </h1>

          <p className="text-sm text-gray-500">
            Mã tài sản:
            <span className="font-semibold text-gray-800 ml-1">
              {asset.assetCode}
            </span>
          </p>
        </div>
      </div>

      {/* Thông tin nhanh */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500">Danh mục</div>
          <div className="font-semibold mt-1">
            {asset.category?.name || "-"}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500">Trạng thái</div>
          <div className="font-semibold mt-1">{asset.status}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500">Serial</div>
          <div className="font-semibold mt-1">
            {asset.serialNumber || "-"}
          </div>
        </div>
      </div>

      {/* Form chỉnh sửa */}
      <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-5 w-5 text-samsung" />
          <h2 className="text-lg font-bold">
            Cập nhật thông tin thiết bị
          </h2>
        </div>

        <form action={handleUpdate} className="space-y-6">
          <input type="hidden" name="id" value={asset.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Tên thiết bị *
              </label>

              <input
                required
                name="name"
                defaultValue={asset.name}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-samsung outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Danh mục *
              </label>

              <select
                name="categoryId"
                defaultValue={asset.categoryId}
                className="w-full p-2.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-samsung outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Serial Number
              </label>

              <input
                name="serialNumber"
                defaultValue={asset.serialNumber || ""}
                className="w-full p-2.5 border border-gray-300 rounded-md uppercase focus:ring-2 focus:ring-samsung outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nhà sản xuất
              </label>

              <input
                name="manufacturer"
                defaultValue={asset.manufacturer || ""}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-samsung outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Model
              </label>

              <input
                name="model"
                defaultValue={asset.model || ""}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-samsung outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm font-medium mb-1">
                <Calendar className="h-4 w-4" />
                Ngày nhập kho
              </label>

              <input
                type="date"
                name="purchaseDate"
                defaultValue={formattedDate}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-samsung outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm font-medium mb-1">
                <DollarSign className="h-4 w-4" />
                Giá trị (VNĐ)
              </label>

              <input
                type="number"
                name="price"
                defaultValue={asset.price ? Number(asset.price) : ""}
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-samsung outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Link
              href="/assets"
              className="px-5 py-2.5 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </Link>

            <button
              type="submit"
              className="flex items-center gap-2 bg-samsung text-white px-6 py-2.5 rounded-md hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Công cụ quản trị */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          Công cụ Quản trị
        </h2>

        <StatusOverrideForm
          assetId={asset.id}
          currentStatus={asset.status}
        />
      </div>

      {/* Nhật ký hoạt động */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
          <History className="h-5 w-5" />
          Nhật ký hoạt động
        </h2>

        {asset.logs.length === 0 ? (
          <div className="text-sm text-gray-500">
            Chưa có lịch sử hoạt động.
          </div>
        ) : (
          <div className="space-y-4">
            {asset.logs.map((log) => (
              <div
                key={log.id}
                className="border-l-2 border-gray-200 pl-4"
              >
                <div className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </div>

                <div className="text-sm mt-1">
                  <span className="font-semibold">
                    {log.action}
                  </span>

                  {log.details && (
                    <span className="text-gray-600">
                      {" "}
                      - {log.details}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}