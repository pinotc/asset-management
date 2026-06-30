// src/app/unauthorized/page.tsx
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Truy cập bị từ chối</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Tài khoản của bạn không có đủ thẩm quyền để truy cập vào phân hệ này. Vui lòng liên hệ Quản trị viên hệ thống (Admin) nếu bạn cần cấp quyền bổ sung.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại Trang chủ
        </Link>
      </div>
    </div>
  );
}