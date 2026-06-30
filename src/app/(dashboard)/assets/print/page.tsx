"use client";

import { useEffect, useState } from "react";
import { getAssets } from "@/actions/asset.actions";
import { Printer, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import PrintLabel from "@/components/qr/PrintLabel";

export default function PrintLabelsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAssets().then((res) => {
      if (res.success) {
        const allAssets = res.data || [];
        const selectedIdsStr = sessionStorage.getItem("print_qr_ids");
        
        if (selectedIdsStr) {
          try {
            const selectedIds = JSON.parse(selectedIdsStr);
            const filteredAssets = allAssets.filter(a => selectedIds.includes(a.id));
            setAssets(filteredAssets.length > 0 ? filteredAssets : allAssets);
          } catch (e) { setAssets(allAssets); }
        } else {
          setAssets(allAssets);
        }
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-samsung mr-2" /> Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* CSS CỐ ĐỊNH CHO MÁY IN NHIỆT - BẮT BUỘC ĐỂ KHÔNG BỊ TRANG TRẮNG */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-container, #print-container * { visibility: visible; }
          #print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Ép mỗi tem là 1 trang in riêng */
          .print-item {
            page-break-after: always;
            display: flex !important;
            justify-content: center;
            align-items: center;
          }
        }
      `}} />

      {/* Control Bar (Ẩn khi in) */}
      <div className="p-5 bg-white border-b print:hidden shadow-sm flex justify-between items-center">
        <div>
          <h1 className="font-bold text-gray-900">In QR Hàng Loạt</h1>
          <p className="text-xs text-gray-500">Số lượng: {assets.length} tem</p>
        </div>
        <div className="flex gap-2">
          <Link href="/assets" className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600">Quay lại</Link>
          <button onClick={() => window.print()} className="bg-samsung text-white px-6 py-2 rounded-lg font-bold text-sm">
            Bắt đầu in
          </button>
        </div>
      </div>

      {/* Khu vực chứa tem (ID này dùng để CSS in ấn bắt lấy) */}
      <div id="print-container" className="p-8 print:p-0">
        <div className="flex flex-wrap gap-4 justify-center">
          {assets.map((asset) => (
            <div key={asset.id} className="print-item">
              <PrintLabel 
                asset={{
                  assetCode: asset.assetCode,
                  name: asset.name,
                  model: asset.model,
                  serialNumber: asset.serialNumber,
                  departmentName: asset.department?.name || null
                }} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}