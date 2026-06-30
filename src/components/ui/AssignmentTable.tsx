// src/components/ui/AssignmentTable.tsx
"use client";

import { useState } from "react";
import { returnAsset } from "@/actions/assignment.actions";
import { CheckCircle, Clock, Undo2 } from "lucide-react";
import { format } from "date-fns";

export default function AssignmentTable({ assignments }: { assignments: any[] }) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleReturn = async (assignmentId: string, assetId: string, assetCode: string) => {
    if (window.confirm(`Bạn muốn thu hồi thiết bị ${assetCode} về kho?`)) {
      setIsLoading(assignmentId);
      const res = await returnAsset(assignmentId, assetId);
      if (res.success) {
        alert("Thu hồi thành công!");
      } else {
        alert(res.error);
      }
      setIsLoading(null);
    }
  };

  if (!assignments || assignments.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
        Chưa có lịch sử bàn giao nào.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Ngày giao</th>
              <th className="px-6 py-4">Thiết bị</th>
              <th className="px-6 py-4">Người nhận</th>
              <th className="px-6 py-4">Ghi chú</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map((record) => {
              const isReturned = !!record.returnDate;

              return (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-700">
                    {format(new Date(record.assignedDate), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-samsung">{record.asset?.assetCode}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{record.asset?.name}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {record.user?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs truncate max-w-150px ">
                    {record.remark || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isReturned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" /> Đã thu hồi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <Clock className="h-3.5 w-3.5" /> Đang sử dụng
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!isReturned ? (
                      <button
                        onClick={() => handleReturn(record.id, record.assetId, record.asset?.assetCode)}
                        disabled={isLoading === record.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        <Undo2 className="h-3.5 w-3.5 text-gray-500" />
                        {isLoading === record.id ? "Đang xử lý..." : "Thu hồi"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {format(new Date(record.returnDate), "dd/MM/yyyy")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}