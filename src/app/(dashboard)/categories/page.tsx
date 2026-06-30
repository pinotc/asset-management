// src/app/(dashboard)/categories/page.tsx
import { getCategories, createCategory, deleteCategory } from "@/actions/category.actions";
import { Tags, PlusCircle, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// Định nghĩa Type chuẩn cho Category (Khớp 100% với Schema)
type CategoryType = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { assets: number };
};

export default async function CategoriesPage() {
  const response = await getCategories();
  const categories: CategoryType[] = (response.data as CategoryType[]) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Tags className="h-6 w-6 text-samsung" />
          Phân loại Danh mục
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý các nhóm thiết bị và máy móc trong nhà máy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Form thêm mới */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-gray-500" /> Thêm danh mục mới
            </h2>
            <form action={async (formData) => {
              "use server";
              await createCategory(formData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tên danh mục *</label>
                <input required name="name" type="text" className="w-full px-3 py-2 border rounded-md text-sm focus:ring-1 focus:ring-samsung outline-none" placeholder="VD: Thiết bị CNTT, Máy CNC..." />
              </div>
              <button type="submit" className="w-full bg-samsung text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition">
                Lưu danh mục
              </button>
            </form>
          </div>
        </div>

        {/* Cột phải: Bảng danh sách */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Tên danh mục</th>
                    <th className="px-4 py-3 text-center">Số lượng TB</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-800 bg-blue-100 rounded-full">
                          {cat._count.assets}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {/* Form Xóa danh mục (Chỉ xóa được nếu chưa có tài sản) */}
                        <form action={async () => {
                          "use server";
                          await deleteCategory(cat.id);
                        }}>
                          <button 
                            type="submit" 
                            disabled={cat._count.assets > 0}
                            title={cat._count.assets > 0 ? "Không thể xóa vì đang có thiết bị" : "Xóa danh mục"}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {categories.length === 0 && (
              <div className="text-center p-8 text-gray-500 flex flex-col items-center">
                <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                Chưa có danh mục nào được tạo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}