// src/app/(dashboard)/documents/templates/page.tsx
import { getFormTemplates } from "@/actions/template.actions";
// Import file Editor (lưu ý đường dẫn lùi 1 cấp)
import TemplateEditor from "../TemplateEditor"; 
import { FileEdit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const res = await getFormTemplates();
  const initialTemplates = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileEdit className="h-6 w-6 text-samsung" />
          Cấu hình Phôi Biểu mẫu In ấn
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tùy chỉnh thông tin công ty, tiêu đề và các điều khoản pháp lý cho hệ thống xuất biên bản.
        </p>
      </div>

      <TemplateEditor initialTemplates={initialTemplates || []} />
    </div>
  );
}