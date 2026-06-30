"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ImageUploadProps {
  value: string; // URL ảnh hiện tại
  onChange: (value: string) => void; // Hàm trigger khi upload xong
  onRemove: () => void; // Hàm xóa ảnh
}

export default function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onUpload = (result: any) => {
    // result.info.secure_url chứa link ảnh Cloudinary trả về
    onChange(result.info.secure_url);
    setIsUploading(false);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Hiển thị ảnh nếu đã có */}
      {value && (
        <div className="relative w-50 h-50 rounded-md overflow-hidden border border-gray-200 shadow-sm">
          <Image fill style={{ objectFit: "cover" }} alt="Asset Image" src={value} />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nút Upload / Mở Camera */}
      <CldUploadWidget
        uploadPreset="mes_assets"
        onQueuesStart={() => setIsUploading(true)}
        onSuccess={onUpload}
        options={{ maxFiles: 1, sources: ["local", "camera"], resourceType: "image" }}
        >
        {({ open }: { open: () => void }) => {
            return (
            <button
                type="button"
                disabled={isUploading}
                onClick={() => open()}
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-#1428A0 text-#1428A0 rounded-md hover:bg-blue-50 transition-colors w-full sm:w-auto"
            >
                {/* ... */}
            </button>
            );
        }}
        </CldUploadWidget>
    </div>
  );
}