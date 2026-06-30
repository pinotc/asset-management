// src/components/ui/RepairTable.tsx
"use client";

import Link from "next/link";
import { Wrench, CheckCircle2, Eye } from "lucide-react";

export default function RepairTable({ repairs }: { repairs: any[] }) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH": 
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-bold">Cao (Gấp)</span>;
      case "MEDIUM": 
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded font-medium">Trung bình</span>;
      default: 
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">Thấp</span>;
    }
  };

  if (!repairs || repairs.length === 0) {
    return <div className="p-8 text-center bg-white border rounded-xl text-gray-500 shadow-sm">Chưa có dữ liệu sửa chữa.</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Mã Phiếu</th>
              <th className="px-6 py-4">Thiết bị</th>
              <th className="px-6 py-4">Lỗi & Mức độ</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {repairs.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-samsung">{r.ticketNumber}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{r.asset?.assetCode}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.asset?.name}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    {getPriorityBadge(r.priority)}
                    <span className="text-xs font-semibold text-gray-700 uppercase">{r.issueType}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate max-w-200px" title={r.description}>
                    {r.description}
                  </p>
                </td>
                <td className="px-6 py-4">
                  {r.status === "COMPLETED" ? (
                    <span className="text-emerald-600 flex items-center gap-1.5 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4"/> Đã xong
                    </span>
                  ) : (
                    <span className="text-blue-600 flex items-center gap-1.5 text-xs font-bold">
                      <Wrench className="h-4 w-4"/> Đang xử lý
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/repairs/${r.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-medium transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {r.status === "COMPLETED" ? "Xem chi tiết" : "Cập nhật"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}