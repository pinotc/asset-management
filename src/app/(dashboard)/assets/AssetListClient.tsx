// src/app/(dashboard)/assets/AssetListClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, User, Calendar, Cpu, Settings2, Monitor, Building2, Printer, CheckSquare, Filter } from "lucide-react";
import { format } from "date-fns";

interface AssetData {
  id: string;
  assetCode: string;
  name: string;
  serialNumber: string;
  categoryName: string;
  departmentName: string;
  locationName: string;
  status: string;
  stockInDate: Date;
  purchaseDate: Date | null;
  assigneeName: string | null;
}

export default function AssetListClient({ data }: { data: AssetData[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // STATE CHO CÁC BỘ LỌC MỚI
  const [categoryFilter, setCategoryFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // STATE QUẢN LÝ THIẾT BỊ ĐƯỢC CHỌN
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // TỰ ĐỘNG TRÍCH XUẤT CÁC GIÁ TRỊ DUY NHẤT CHO DROPDOWN
  const uniqueCategories = useMemo(() => Array.from(new Set(data.map(a => a.categoryName))), [data]);
  const uniqueDepartments = useMemo(() => Array.from(new Set(data.map(a => a.departmentName))), [data]);
  const uniqueLocations = useMemo(() => Array.from(new Set(data.map(a => a.locationName))), [data]);

  const filteredData = data.filter((asset) => {
    const matchesSearch = 
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "" || asset.status === statusFilter;
    const matchesCategory = categoryFilter === "" || asset.categoryName === categoryFilter;
    const matchesDepartment = departmentFilter === "" || asset.departmentName === departmentFilter;
    const matchesLocation = locationFilter === "" || asset.locationName === locationFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesLocation;
  });

  // Xử lý In Hàng Loạt
  const handlePrintSelected = () => {
    if (selectedIds.length === 0) return;
    sessionStorage.setItem("print_qr_ids", JSON.stringify(selectedIds));
    window.open("/assets/print", "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_STOCK": return <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded border border-blue-200">SẴN SÀNG</span>;
      case "ASSIGNED": return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded border border-emerald-200">ĐANG DÙNG</span>;
      case "UNDER_REPAIR": return <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded border border-amber-200">ĐANG SỬA</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR NỔI */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium px-2">
          <CheckSquare className="h-4 w-4 text-samsung" />
          Đã chọn: <span className="font-bold text-gray-900">{selectedIds.length}</span> thiết bị
        </div>
        <button
          onClick={handlePrintSelected}
          disabled={selectedIds.length === 0}
          className="flex items-center gap-2 bg-samsung text-white px-5 py-2 rounded-lg font-bold text-sm disabled:opacity-50 disabled:bg-gray-400 hover:bg-blue-700 transition shadow-sm"
        >
          <Printer className="h-4 w-4" /> In Tem Đã Chọn ({selectedIds.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar Lọc */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
          
          {/* Hàng 1: Tìm kiếm */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm mã thiết bị, tên máy hoặc số Serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung bg-white font-medium text-gray-800 shadow-sm"
            />
          </div>

          {/* Hàng 2: Các Dropdown Lọc */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung bg-white font-medium text-gray-700 shadow-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="IN_STOCK">Sẵn sàng</option>
              <option value="ASSIGNED">Đang sử dụng</option>
              <option value="UNDER_REPAIR">Đang sửa chữa</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung bg-white font-medium text-gray-700 shadow-sm"
            >
              <option value="">Tất cả danh mục</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung bg-white font-medium text-gray-700 shadow-sm"
            >
              <option value="">Tất cả phòng ban</option>
              {uniqueDepartments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-samsung bg-white font-medium text-gray-700 shadow-sm"
            >
              <option value="">Tất cả vị trí</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="accent-samsung w-4 h-4 rounded cursor-pointer"
                    onChange={(e) => setSelectedIds(e.target.checked ? filteredData.map(a => a.id) : [])}
                    checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                  />
                </th>
                <th className="px-6 py-4">Thông tin Thiết bị</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Vị trí & Sử dụng</th>
                <th className="px-6 py-4">Thời gian quản lý</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredData.length > 0 ? (
                filteredData.map((asset) => (
                  <tr key={asset.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="accent-samsung w-4 h-4 rounded cursor-pointer"
                        checked={selectedIds.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, asset.id]);
                          else setSelectedIds(selectedIds.filter(id => id !== asset.id));
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-samsung text-sm">{asset.assetCode}</span>
                        <span className="font-semibold text-gray-800 mt-0.5">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{asset.categoryName}</td>
                    <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1 text-xs font-medium">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-400" /> {asset.locationName}</span>
                        <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-gray-400" /> {asset.departmentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      Ngày nhập: {asset.purchaseDate ? format(new Date(asset.purchaseDate), "dd/MM/yyyy") : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/assets/${asset.id}`} className="px-4 py-2 bg-gray-100 hover:bg-samsung hover:text-white rounded-lg text-xs font-bold transition shadow-sm">
                        Quản lý
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Không tìm thấy thiết bị nào khớp với bộ lọc.
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