// src/app/(dashboard)/repairs/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Wrench, Plus, FileSpreadsheet, Clock, Play, CheckCircle2, Settings2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RepairsPage() {
    const totalTickets = await prisma.assetRepair.count();
    const openCount = await prisma.assetRepair.count({ where: { status: "OPEN" } });
    const inProgressCount = await prisma.assetRepair.count({ where: { status: "IN_PROGRESS" } });
    const completedCount = await prisma.assetRepair.count({ where: { status: "COMPLETED" } });

    const tickets = await prisma.assetRepair.findMany({
        include: {
            asset: { select: { assetCode: true, name: true } },
            creator: { select: { name: true } },
            technician: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "OPEN": return <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold"><Clock className="h-3 w-3"/> ĐANG CHỜ</span>;
            case "IN_PROGRESS": return <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs font-bold"><Play className="h-3 w-3 fill-blue-600"/> ĐANG SỬA</span>;
            case "COMPLETED": return <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold"><CheckCircle2 className="h-3 w-3"/> ĐÃ XONG</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wrench className="h-6 w-6 text-amber-500" /> Trung tâm Sửa chữa
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <a href="/api/repairs/export" className="flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Xuất báo cáo
                    </a>
                    <Link href="/repairs/new" className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-amber-600 transition">
                        <Plus className="h-4 w-4" /> Báo hỏng thiết bị
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-medium text-gray-400">Tổng số yêu cầu</span>
                    <p className="text-xl font-black text-gray-800 mt-0.5">{totalTickets}</p>
                </div>
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 shadow-sm">
                    <span className="text-xs font-medium text-amber-600">Đang chờ (OPEN)</span>
                    <p className="text-xl font-black text-amber-600 mt-0.5">{openCount}</p>
                </div>
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 shadow-sm">
                    <span className="text-xs font-medium text-blue-600">Đang sửa (IN_PROGRESS)</span>
                    <p className="text-xl font-black text-blue-600 mt-0.5">{inProgressCount}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 shadow-sm">
                    <span className="text-xs font-medium text-emerald-600">Hoàn thành (COMPLETED)</span>
                    <p className="text-xl font-black text-emerald-600 mt-0.5">{completedCount}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                            <tr>
                                <th className="px-6 py-4">Mã tài sản & Thiết bị</th>
                                <th className="px-6 py-4">Người yêu cầu</th>
                                <th className="px-6 py-4">Mô tả sự cố</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4">Kỹ thuật viên</th>
                                <th className="px-6 py-4">Ngày báo</th>
                                {/* Thêm cột Thao tác */}
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tickets.length > 0 ? (
                                tickets.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-samsung">{t.asset?.assetCode || "N/A"}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-200px">{t.asset?.name || "Tài sản đã xóa"}</p>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">
                                            {t.creator?.name || "Hệ thống"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="truncate max-w-250px text-gray-600" title={t.description || ""}>
                                                {t.description || "Không có mô tả"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(t.status)}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                            {t.technician?.name || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                            {new Date(t.createdAt).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </td>
                                        {/* Thêm nội dung nút Xử lý */}
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                href={`/repairs/${t.id}`} 
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-samsung hover:text-white text-gray-700 rounded-lg text-xs font-bold transition-colors shadow-sm"
                                            >
                                                <Settings2 className="h-3.5 w-3.5" /> Xử lý
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    {/* Cập nhật lại colSpan thành 7 */}
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Chưa có phiếu báo hỏng nào trong hệ thống.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}