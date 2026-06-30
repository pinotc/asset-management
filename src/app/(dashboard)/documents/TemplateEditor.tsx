// src/app/(dashboard)/documents/TemplateEditor.tsx
"use client";

import { useState } from "react";
import { FileText, Save, Eye, Edit3, Loader2 } from "lucide-react";
import { updateFormTemplate } from "@/actions/template.actions";

export default function TemplateEditor({ initialTemplates }: { initialTemplates: any[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  const activeTemplate = templates.find(t => t.id === selectedId);

  const handleFieldChange = (field: string, value: string) => {
    setTemplates(prev => prev.map(t => t.id === selectedId ? { ...t, [field]: value } : t));
  };

  const handleSave = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    const res = await updateFormTemplate(selectedId, activeTemplate);
    if (res.success) {
      alert(`Đã lưu cấu trúc tùy chỉnh cho [${activeTemplate.name}] thành công!`);
    } else {
      alert("Lỗi: " + res.error);
    }
    setIsSaving(false);
  };

  if (!activeTemplate) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* 1. THANH CHỌN BIỂU MẪU & BỘ NHẬP LIỆU (CỘT TRÁI - TO) */}
      <div className="xl:col-span-2 space-y-6">
        {/* Bộ chọn loại biểu mẫu */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chọn mẫu biên bản chỉnh sửa</label>
          <div className="flex flex-col gap-1">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${selectedId === t.id ? "bg-blue-50 text-samsung font-bold border border-blue-100" : "text-gray-600 hover:bg-gray-50 border border-transparent"}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form nhập liệu cấu hình nội dung */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5 border-b pb-2 text-sm">
            <Edit3 className="h-4 w-4 text-samsung" /> Tùy chỉnh tham số văn bản
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Tên Tiêu Đề Công Ty (Góc Trái)</label>
            <input type="text" value={activeTemplate.companyName} onChange={e => handleFieldChange("companyName", e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-samsung outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Tiêu Đề Biên Bản (Chính Giữa)</label>
            <input type="text" value={activeTemplate.title} onChange={e => handleFieldChange("title", e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-800 focus:ring-1 focus:ring-samsung outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Căn cứ / Ghi chú phụ dưới tiêu đề</label>
            <textarea value={activeTemplate.subHeader} onChange={e => handleFieldChange("subHeader", e.target.value)} className="w-full h-16 p-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-1 focus:ring-samsung outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nhãn Bên Giao (Bên A)</label>
              <input type="text" value={activeTemplate.partyALabel} onChange={e => handleFieldChange("partyALabel", e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-samsung outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nhãn Bên Nhận (Bên B)</label>
              <input type="text" value={activeTemplate.partyBLabel} onChange={e => handleFieldChange("partyBLabel", e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-samsung outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Điều khoản cam kết pháp lý cuối trang</label>
            <textarea value={activeTemplate.legalTerms} onChange={e => handleFieldChange("legalTerms", e.target.value)} className="w-full h-24 p-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-1 focus:ring-samsung outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Chuỗi Footer định danh dưới đáy giấy</label>
            <input type="text" value={activeTemplate.footerText} onChange={e => handleFieldChange("footerText", e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-400 focus:ring-1 focus:ring-samsung outline-none" />
          </div>

          <div className="pt-2 flex justify-end">
            <button onClick={handleSave} disabled={isSaving} className="bg-samsung text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Lưu Cấu Hình Form
            </button>
          </div>
        </div>
      </div>

      {/* 2. KHUNG LIVE PREVIEW TRỰC QUAN (CỘT PHẢI - NHỎ HƠN THEO TỶ LỆ) */}
      <div className="xl:col-span-3 space-y-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 px-1">
          <Eye className="h-3.5 w-3.5" /> Xem trước hiển thị thực tế khi in (A4 Simulation)
        </span>
        
        <div className="border border-gray-300 rounded-xl shadow-inner bg-gray-100 p-4 max-h-700px overflow-y-auto">
          {/* Tờ giấy A4 thu nhỏ mô phỏng */}
          <div className="w-full bg-white p-8 shadow-md border text-gray-800 text-[12px] leading-relaxed space-y-6 font-serif">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-2">
              <div className="text-center">
                <h4 className="font-bold uppercase text-[10px] text-gray-900">{activeTemplate.companyName}</h4>
                <p className="text-[9px] text-gray-500 mt-0.5">Số: BB-{selectedId}-2026_XXXX</p>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-[10px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
                <p className="font-bold text-[9px] mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{activeTemplate.title}</h2>
              <p className="text-[10px] italic text-gray-400 mt-1">{activeTemplate.subHeader}</p>
            </div>

            {/* Content Mockup */}
            <div className="space-y-3 font-sans text-gray-600 text-[11px]">
              <p>Hôm nay, ngày ... tháng ... năm 2026, chúng tôi tiến hành ký xác nhận gồm:</p>
              <div className="grid grid-cols-2 gap-4 border p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-bold text-gray-800 uppercase text-[9px]">{activeTemplate.partyALabel}</p>
                  <p className="mt-1">Đại diện: Nguyễn Văn A (IT)</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800 uppercase text-[9px]">{activeTemplate.partyBLabel}</p>
                  <p className="mt-1">Đại diện: [Tên nhân sự được chọn...]</p>
                </div>
              </div>
              
              <div className="border border-gray-400 text-center py-4 my-2 bg-gray-50/50 text-gray-400 font-mono text-[10px]">
                [ Khung chứa Bảng chi tiết danh sách Mã thiết bị & Serial tương tác động ]
              </div>

              <p className="italic text-gray-500 leading-snug">{activeTemplate.legalTerms}</p>
            </div>

            {/* Ký tên */}
            <div className="grid grid-cols-2 text-center pt-4 text-[11px] font-sans">
              <div className="font-bold">{activeTemplate.partyALabel}</div>
              <div className="font-bold">{activeTemplate.partyBLabel}</div>
            </div>

            <div className="h-12"></div>
            
            <div className="text-center text-[9px] text-gray-300 font-mono pt-4 border-t border-dashed">
              {activeTemplate.footerText}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}