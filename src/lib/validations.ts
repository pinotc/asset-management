import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(2, "Tên thiết bị phải có ít nhất 2 ký tự"),
  model: z.string().min(2, "Vui lòng nhập Model thiết bị"),
  serialNumber: z.string().min(3, "Số Serial là bắt buộc"),
  manufacturer: z.string().min(2, "Vui lòng nhập nhà sản xuất"),
  
  // FIXED: Xử lý an toàn dữ liệu đầu vào từ HTML Input
  price: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().min(0, "Giá trị không hợp lệ").optional()
  ),
  
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  imageUrl: z.string().optional(),
});

export type AssetFormValues = z.infer<typeof assetSchema>;