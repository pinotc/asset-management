// src/components/forms/CreateAssetForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetSchema, AssetFormValues } from "@/lib/validations";
import { createAsset } from "@/actions/asset.actions";
import { createCategory } from "@/actions/category.actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Save, Loader2, Printer, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateAssetFormProps {
  categories: { id: string; name: string; }[];
}

export default function CreateAssetForm({ categories }: CreateAssetFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [createdAsset, setCreatedAsset] = useState<{ id: string; code: string } | null>(null);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema) as any,
  });

  const selectedCategory = watch("categoryId");

  useEffect(() => {
    if (selectedCategory === "ADD_NEW") {
      setIsAddingCategory(true);
      setValue("categoryId", ""); 
    }
  }, [selectedCategory, setValue]);

  const handleCreateQuickCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCat(true);
    const formData = new FormData();
    formData.append("name", newCategoryName);
    const res = await createCategory(formData);

    if (res?.success) {
      setNewCategoryName("");
      setIsAddingCategory(false);
      router.refresh(); 
    } else {
      alert("Lỗi tạo danh mục!");
    }
    setIsCreatingCat(false);
  };

  const onSubmit = async (data: AssetFormValues) => {
    setIsLoading(true);
    const rawPurchaseDate = getValues("purchaseDate" as any);
    const payload = { ...data, purchaseDate: rawPurchaseDate, imageUrl };
    
    const result = await createAsset(payload);
    
    // FIX TYPESCRIPT LỖI Ở ĐÂY: Đã kiểm tra rõ result.success và result.assetCode
    if (result.success && result.assetCode) {
      // Dùng luôn assetCode làm ID truyền lên URL
      setCreatedAsset({ id: result.assetCode, code: result.assetCode });
      reset();
      setImageUrl("");
    } else {
      alert("Lỗi: " + result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-4xl overflow-hidden mx-auto mt-6">
      <div className="border-b border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Đăng ký Tài sản mới</h2>
          <p className="text-xs text-gray-500 mt-1">Hệ thống cấp mã AST và mã QR tự động sau khi lưu.</p>
        </div>
      </div>

      {createdAsset ? (
        <div className="p-12 text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Đã nhập kho tài sản thành công!</h3>
            <p className="text-sm text-gray-500 mt-1">Mã định danh: <span className="font-black text-samsung">{createdAsset.code}</span></p>
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <button 
              // ĐÃ FIX URL TRỎ ĐÚNG VỀ CẤU TRÚC MỚI CỦA BẠN: /assets/[id]/qr
              onClick={() => window.open(`/assets/${createdAsset.id}/qr`, "_blank")}
              className="flex items-center gap-2 bg-samsung text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition"
            >
              <Printer className="h-4 w-4" /> In Tem QR Tài Sản
            </button>
            <button 
              onClick={() => setCreatedAsset(null)}
              className="px-6 py-2.5 text-sm font-bold border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-gray-600"
            >
              Tiếp tục tạo mới
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Tên thiết bị *</label>
                <input {...register("name")} className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-samsung outline-none text-sm font-medium" placeholder="VD: Màn hình Dell UltraSharp" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Danh mục *</label>
                <select {...register("categoryId")} className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-samsung outline-none bg-white text-sm font-medium">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="ADD_NEW" className="font-bold text-samsung bg-blue-50">+ Thêm danh mục mới...</option>
                </select>
                {isAddingCategory && (
                  <div className="mt-2 flex gap-2 p-2 bg-gray-50 border rounded-lg">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Tên danh mục..." className="flex-1 p-2 text-sm border rounded-md" autoFocus />
                    <button type="button" onClick={handleCreateQuickCategory} className="px-3 bg-samsung text-white text-sm rounded-md font-bold">Lưu</button>
                    <button type="button" onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }} className="px-3 bg-gray-200 text-gray-700 text-sm rounded-md font-bold">Hủy</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Nhà sản xuất *</label>
                  <input {...register("manufacturer")} className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium" placeholder="VD: Dell" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Model *</label>
                  <input {...register("model")} className="w-full p-2.5 border rounded-lg outline-none text-sm font-medium" placeholder="VD: U2720Q" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Số Serial / Service Tag *</label>
                <input {...register("serialNumber")} className="w-full p-2.5 border rounded-lg outline-none uppercase text-sm font-bold" placeholder="VD: SN-123456789" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Giá trị (VNĐ)</label>
                  <input type="number" {...register("price")} className="w-full p-2.5 border rounded-lg outline-none text-sm font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Ngày nhập kho</label>
                  <input type="date" {...register("purchaseDate" as any)} className="w-full p-2.5 border rounded-lg outline-none text-gray-700 text-sm font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Ảnh (Tùy chọn)</label>
                <ImageUpload value={imageUrl} onChange={(url) => setImageUrl(url)} onRemove={() => setImageUrl("")} />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={isLoading} className="flex items-center gap-2 bg-samsung text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isLoading ? "Đang xử lý..." : "Lưu Tài sản"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}