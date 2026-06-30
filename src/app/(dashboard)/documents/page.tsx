// src/app/(dashboard)/documents/page.tsx
import { getDocumentDataCenter } from "@/actions/document.actions";
// IMPORT THÊM HÀM LẤY TEMPLATE
import { getFormTemplates } from "@/actions/template.actions"; 
import DocumentClient from "./DocumentClient";
import { FileText, FileEdit } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  // GỌI SONG SONG 2 API
  const [docResponse, templateResponse] = await Promise.all([
    getDocumentDataCenter(),
    getFormTemplates()
  ]);
  
  const documentData = docResponse.data || { handovers: [], recalls: [], repairs: [] };
  const templatesData = templateResponse.success ? templateResponse.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-samsung" />
            Trung tâm Quản lý Văn bản & Biểu mẫu
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hệ thống tự động điền (Auto-populate) thông tin thiết bị, vị trí và nhân sự vận hành vào phôi văn bản ISO nhà máy.
          </p>
        </div>

        <Link 
          href="/documents/templates"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 transition shrink-0"
        >
          <FileEdit className="h-4 w-4 text-samsung" />
          Cấu hình Phôi in
        </Link>
      </div>

      {/* TRUYỀN THÊM PROPS TEMPLATES XUỐNG CLIENT */}
      <DocumentClient 
        initialData={documentData as any} 
        templates={templatesData} 
      />
    </div>
  );
}