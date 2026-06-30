"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import PrintLabel, { PrintAssetInfo } from "@/components/qr/PrintLabel";

export default function QRClientCard({ asset }: { asset: PrintAssetInfo }) {
  // Tự động gọi in sau 0.8s chờ QR load
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* CSS ĐẶC BIỆT CHỈ DÀNH CHO IN ĐƠN LẺ */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* 1. Tàng hình toàn bộ layout của Dashboard (Sidebar, Header...) */
          body * { 
            visibility: hidden; 
          }
          /* Ngăn trình duyệt tạo trang trắng thứ 2 */
          html, body { 
            height: 100vh; 
            overflow: hidden; 
          }
          /* 2. Chỉ hiện nguyên cái khung chứa tem */
          #single-print-wrapper, #single-print-wrapper * { 
            visibility: visible; 
          }
          /* 3. Ép khung tem dính chặt vào góc trên cùng bên trái của tờ giấy */
          #single-print-wrapper {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            height: 60mm !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 99999;
            background: white !important;
          }
        }
      `}} />

      <div className="bg-gray-100 min-h-screen flex flex-col items-center pt-10 print:bg-transparent">
        
        {/* Thanh công cụ điều khiển (Sẽ bị ẩn lúc in nhờ print:hidden) */}
        <div className="w-[80mm] p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-3 mb-8 print:hidden">
          <div className="text-center">
            <h1 className="font-bold text-gray-900">In Tem Đơn Lẻ</h1>
            <p className="text-xs text-gray-500">Mã: {asset.assetCode}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => window.close()} 
              className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-200"
            >
              Đóng tab
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex-1 py-2 bg-samsung text-white font-bold rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4"/> In Tem
            </button>
          </div>
        </div>

        {/* Khung chứa tem in (Đã gắn ID để CSS nhắm tới) */}
        <div id="single-print-wrapper">
          <PrintLabel asset={asset} />
        </div>
      </div>
    </>
  );
}