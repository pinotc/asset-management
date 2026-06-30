// src/app/(dashboard)/scanner/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ScanLine, AlertCircle } from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const code = result[0].rawValue;
      setScannedCode(code);
      // Chuyển hướng đến trang tìm kiếm hoặc chi tiết tài sản
      // Giả sử URL chi tiết tài sản của bạn có dạng /assets/[assetCode]
      router.push(`/assets?search=${code}`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <ScanLine className="h-6 w-6 text-samsung" />
          Quét mã thiết bị
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Đưa camera vào tem QR trên máy móc để tra cứu hồ sơ hoặc báo hỏng.
        </p>
      </div>

      <div className="bg-black rounded-2xl overflow-hidden border-4 border-gray-800 shadow-xl relative aspect-4/3">
        <Scanner
          onScan={handleScan}
          onError={(err) => setError("Không thể kết nối camera. Vui lòng cấp quyền truy cập.")}
          components={{
            finder: true, // Hiển thị khung vuông định vị
          }}
          styles={{
            container: { width: '100%', height: '100%' }
          }}
        />
        
        {/* Lớp phủ hiệu ứng quét */}
        <div className="absolute inset-0 pointer-events-none border-samsung opacity-50 border-1px animate-pulse rounded-2xl"></div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {scannedCode && (
        <div className="text-center p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
          Đã nhận diện mã: <strong>{scannedCode}</strong>. Đang chuyển hướng...
        </div>
      )}
    </div>
  );
}