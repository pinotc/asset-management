// src/app/(dashboard)/consumables/ConsumableClient.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Minus, Loader2, ArrowDownToLine, ArrowUpRightFromSquare, CalendarClock, PackagePlus, History, X, BarChart3, ListOrdered } from "lucide-react";
import { allocateConsumable, receiveConsumable, createConsumable } from "@/actions/consumable.actions";

export default function ConsumableClient({ consumables, departments }: { consumables: any[], departments: any[] }) {
  const [activeModal, setActiveModal] = useState<"ALLOCATE" | "RECEIVE" | "CREATE" | "HISTORY" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalTab, setModalTab] = useState<"LOGS" | "ANALYTICS">("LOGS"); // Tab quản lý lịch sử
  const [isLoading, setIsLoading] = useState(false);

  // Form States chung
  const [quantity, setQuantity] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [notes, setNotes] = useState("");

  // Form States cho TẠO MỚI
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [minStockLevel, setMinStockLevel] = useState("10");
  const [leadTimeDays, setLeadTimeDays] = useState("7");

  const openModal = (type: "ALLOCATE" | "RECEIVE" | "CREATE" | "HISTORY", item?: any) => {
    setActiveModal(type);
    setSelectedItem(item || null);
    setModalTab("LOGS"); // Reset về tab log đầu tiên khi mở modal
    setQuantity("");
    setDepartmentId("");
    setReceiverName("");
    setNotes("");
    setName("");
    setUnit("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let res;

    if (activeModal === "CREATE") {
      res = await createConsumable({
        name,
        unit,
        minStockLevel: Number(minStockLevel),
        leadTimeDays: Number(leadTimeDays)
      });
    } else if (activeModal === "RECEIVE") {
      if (!quantity || Number(quantity) <= 0) { setIsLoading(false); return alert("Nhập số lượng hợp lệ!"); }
      res = await receiveConsumable({ consumableId: selectedItem.id, quantity: Number(quantity), notes });
    } else if (activeModal === "ALLOCATE") {
      if (!quantity || Number(quantity) <= 0) { setIsLoading(false); return alert("Nhập số lượng hợp lệ!"); }
      if (!departmentId || !receiverName) { setIsLoading(false); return alert("Vui lòng chọn phòng ban và người nhận!"); }
      res = await allocateConsumable({ consumableId: selectedItem.id, quantity: Number(quantity), departmentId, receiverName, notes });
    }

    if (res?.success) {
      setActiveModal(null);
    } else {
      alert(res?.error);
    }
    setIsLoading(false);
  };

  // THUẬT TOÁN DỰ BÁO CHU KỲ THEO PHÒNG BAN
  const calculateDepartmentPredictions = (transactions: any[]) => {
    const allocatedTx = transactions.filter(t => t.type === "ALLOCATED" && t.departmentId);
    const deptGroups: Record<string, { name: string, dates: Date[], quantities: number[] }> = {};

    // Nhóm lịch sử theo từng phòng ban
    allocatedTx.forEach(tx => {
      const dId = tx.departmentId;
      if (!deptGroups[dId]) {
        deptGroups[dId] = { name: tx.department?.name || "N/A", dates: [], quantities: [] };
      }
      deptGroups[dId].dates.push(new Date(tx.transactionDate));
      deptGroups[dId].quantities.push(tx.quantity);
    });

    return Object.keys(deptGroups).map(dId => {
      const group = deptGroups[dId];
      // Sắp xếp ngày từ cũ đến mới nhất
      group.dates.sort((a, b) => a.getTime() - b.getTime());
      
      let avgIntervalDays = 0;
      let nextPredictedDate: Date | null = null;

      if (group.dates.length >= 2) {
        // Tính khoảng cách thời gian giữa các lần yêu cầu liên tiếp
        let totalInterval = 0;
        for (let i = 1; i < group.dates.length; i++) {
          const diff = group.dates[i].getTime() - group.dates[i - 1].getTime();
          totalInterval += diff / (1000 * 60 * 60 * 24); // Đổi ra số ngày
        }
        avgIntervalDays = totalInterval / (group.dates.length - 1);
        
        // Ngày dự kiến tiếp theo = Lần cuối nhận hàng + Chu kỳ sử dụng trung bình
        const lastDate = group.dates[group.dates.length - 1];
        nextPredictedDate = new Date(lastDate);
        nextPredictedDate.setDate(nextPredictedDate.getDate() + Math.max(1, Math.round(avgIntervalDays)));
      } else if (group.dates.length === 1) {
        // Mặc định chu kỳ mẫu ban đầu là 7 ngày nếu phòng ban đó mới chỉ nhận 1 lần duy nhất
        const lastDate = group.dates[0];
        nextPredictedDate = new Date(lastDate);
        nextPredictedDate.setDate(nextPredictedDate.getDate() + 7);
        avgIntervalDays = 7;
      }

      const totalAllocatedQty = group.quantities.reduce((a, b) => a + b, 0);

      return {
        deptName: group.name,
        totalAllocations: group.dates.length,
        avgQuantity: Math.round(totalAllocatedQty / group.quantities.length),
        avgIntervalDays: avgIntervalDays.toFixed(1),
        lastDate: group.dates[group.dates.length - 1],
        nextPredictedDate
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* THANH CÔNG CỤ */}
      <div className="flex justify-end">
        <button 
          onClick={() => openModal("CREATE")}
          className="flex items-center gap-2 bg-samsung text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition"
        >
          <PackagePlus className="h-4 w-4" /> Thêm danh mục vật tư
        </button>
      </div>

      {/* BẢNG TỔNG QUAN CHÍNH */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên Vật Tư</th>
                <th className="px-6 py-4 text-center">Tồn Kho Total</th>
                <th className="px-6 py-4">Tốc độ tiêu hao (Xưởng)</th>
                <th className="px-6 py-4">Dự kiến cạn kho</th>
                <th className="px-6 py-4">Hạn đặt hàng tiếp</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {consumables.length > 0 ? consumables.map((item) => {
                const isLowStock = item.currentStock <= item.minStockLevel;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">Đơn vị: {item.unit} | Ngưỡng báo động: {item.minStockLevel}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full font-black text-xs ${isLowStock ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {item.avgDailyUsage ? `~${item.avgDailyUsage.toFixed(1)} ${item.unit}/ngày` : "Đang tính chu kỳ..."}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                      {item.estimatedOutDate ? format(new Date(item.estimatedOutDate), "dd/MM/yyyy") : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      {item.nextReorderDate ? (
                        <span className="flex items-center gap-1.5 text-amber-600">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {format(new Date(item.nextReorderDate), "dd/MM/yyyy")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal("HISTORY", item)} className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded border border-gray-200 transition" title="Lịch sử & Dự báo Phòng ban">
                          <History className="h-4 w-4" />
                        </button>
                        <button onClick={() => openModal("RECEIVE", item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition" title="Nhập kho (PO)">
                          <ArrowDownToLine className="h-4 w-4" />
                        </button>
                        <button onClick={() => openModal("ALLOCATE", item)} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded border border-amber-200 transition" title="Xuất cấp phát cho Line">
                          <ArrowUpRightFromSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Chưa có cấu hình danh mục vật tư nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL LỊCH SỬ & DỰ BÁO PHÒNG BAN (NÂNG CẤP TABS) */}
        {activeModal === "HISTORY" && selectedItem && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <div className="flex flex-col">
                  <h3 className="font-bold text-gray-900 text-base">Phân tích biến động: {selectedItem.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Dữ liệu telemetry đo lường và tính toán tự động.</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* THANH CHUYỂN TABS */}
              <div className="flex border-b border-gray-100 px-4 bg-gray-50/50">
                <button 
                  onClick={() => setModalTab("LOGS")}
                  className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition ${modalTab === "LOGS" ? "border-samsung text-samsung" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  <ListOrdered className="h-3.5 w-3.5" /> Nhật ký xuất nhập kho
                </button>
                <button 
                  onClick={() => setModalTab("ANALYTICS")}
                  className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition ${modalTab === "ANALYTICS" ? "border-samsung text-samsung" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Dự báo chu kỳ Phòng ban
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-4">
                {/* TAB 1: HIỂN THỊ LOG TRUYỀN THỐNG */}
                {modalTab === "LOGS" && (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 text-xs font-bold uppercase sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3">Loại lệnh</th>
                        <th className="px-4 py-3">Số lượng</th>
                        <th className="px-4 py-3">Đơn vị tiếp nhận</th>
                        <th className="px-4 py-3">Mã chứng từ / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {selectedItem.transactions && selectedItem.transactions.length > 0 ? (
                        selectedItem.transactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-xs font-medium">
                              {format(new Date(tx.transactionDate), "dd/MM/yyyy HH:mm")}
                            </td>
                            <td className="px-4 py-3">
                              {tx.type === "ALLOCATED" ? (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-100">CẤP PHÁT</span>
                              ) : (
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-bold border border-blue-100">NHẬP KHO</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900">
                              {tx.type === "ALLOCATED" ? "-" : "+"}{tx.quantity} {selectedItem.unit}
                            </td>
                            <td className="px-4 py-3">
                              {tx.type === "ALLOCATED" ? (
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-800">{tx.receiverName}</span>
                                  <span className="text-xs text-gray-500">{tx.department?.name || "N/A"}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-xs">Cung ứng (PO)</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 max-w-200px truncate" title={tx.notes || ""}>
                              {tx.notes || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chưa ghi nhận giao dịch phát sinh.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* TAB 2: THUẬT TOÁN ĐO CHU KỲ VÀ DỰ BÁO NGÀY CẤP TIẾP THEO CHO TỪNG PHÒNG BAN */}
                {modalTab === "ANALYTICS" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 leading-relaxed">
                      💡 **Nguyên lý phân tích:** Hệ thống tự động bóc tách lịch sử cấp phát riêng biệt của từng bộ phận trong phân xưởng, đo lường khoảng cách ngày giữa các lần rút kho để tìm ra **Chu kỳ nhu cầu (T)**. Từ chu kỳ này, AI ước tính ngày mà tổ trưởng của Line đó sẽ tiếp tục xuống xin cấp phát vật tư tiếp theo để bạn chủ động chuẩn bị.
                    </div>

                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 text-xs font-bold uppercase">
                        <tr>
                          <th className="px-4 py-3">Phòng ban vận hành</th>
                          <th className="px-4 py-3 text-center">Số lần đã lấy</th>
                          <th className="px-4 py-3">Lượng lấy TB / lần</th>
                          <th className="px-4 py-3">Chu kỳ lặp lại (Trung bình)</th>
                          <th className="px-4 py-3">Ngày nhận cuối</th>
                          <th className="px-4 py-3 text-amber-700 bg-amber-50/50">Dự kiến cấp phát tiếp theo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {calculateDepartmentPredictions(selectedItem.transactions).length > 0 ? (
                          calculateDepartmentPredictions(selectedItem.transactions).map((pred: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-900">{pred.deptName}</td>
                              <td className="px-4 py-3 text-center text-xs font-semibold">{pred.totalAllocations} lần</td>
                              <td className="px-4 py-3 text-xs font-medium">{pred.avgQuantity} {selectedItem.unit}</td>
                              <td className="px-4 py-3 text-xs font-bold text-blue-600">
                                {pred.avgIntervalDays} ngày một lần
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {format(pred.lastDate, "dd/MM/yyyy")}
                              </td>
                              <td className="px-4 py-3 text-xs font-black text-amber-700 bg-amber-50/30">
                                {pred.nextPredictedDate ? (
                                  <span className="flex items-center gap-1">
                                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                                    {format(pred.nextPredictedDate, "dd/MM/yyyy")}
                                  </span>
                                ) : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chưa có đủ dữ liệu cấp phát cho các phòng ban để tính chu kỳ dự báo.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODALS: TẠO MỚI / NHẬP / XUẤT */}
        {(activeModal === "CREATE" || activeModal === "RECEIVE" || activeModal === "ALLOCATE") && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className={`p-4 border-b flex items-center gap-2 ${
                activeModal === "CREATE" ? "bg-samsung/10 text-samsung" : 
                activeModal === "RECEIVE" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800"
              }`}>
                {activeModal === "CREATE" && <PackagePlus className="h-5 w-5" />}
                {activeModal === "RECEIVE" && <ArrowDownToLine className="h-5 w-5" />}
                {activeModal === "ALLOCATE" && <ArrowUpRightFromSquare className="h-5 w-5" />}
                <h3 className="font-bold">
                  {activeModal === "CREATE" ? "Thêm Danh Mục Vật Tư Mới" : 
                   activeModal === "RECEIVE" ? "Nhập Kho Vật Tư" : "Cấp Phát Vật Tư"}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {activeModal === "CREATE" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên vật tư</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="VD: Giấy in tem MES 100x150" className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đơn vị tính</label>
                      <input type="text" value={unit} onChange={e => setUnit(e.target.value)} required placeholder="VD: Cuộn, Hộp, Cái..." className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mức tồn tối thiểu</label>
                        <input type="number" value={minStockLevel} onChange={e => setMinStockLevel(e.target.value)} required min="1" className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lead Time (Ngày)</label>
                        <input type="number" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)} required min="1" className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm" />
                      </div>
                    </div>
                  </>
                )}

                {(activeModal === "RECEIVE" || activeModal === "ALLOCATE") && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vật tư thao tác</label>
                      <div className="p-3 bg-gray-50 border rounded-lg font-bold text-gray-700 text-sm">{selectedItem?.name}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng ({selectedItem?.unit})</label>
                      <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" max={activeModal === "ALLOCATE" ? selectedItem?.currentStock : undefined} className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm" />
                    </div>
                  </>
                )}

                {activeModal === "ALLOCATE" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phòng ban nhận</label>
                      <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} required className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm bg-white">
                        <option value="">-- Chọn phòng ban --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên người nhận trực tiếp</label>
                      <input type="text" value={receiverName} onChange={e => setReceiverName(e.target.value)} required placeholder="VD: Anh Tùng - Line SMT" className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm" />
                    </div>
                  </>
                )}

                {(activeModal === "RECEIVE" || activeModal === "ALLOCATE") && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú (Tùy chọn)</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mã PO hoặc lý do xuất..." className="w-full p-2.5 border rounded-lg outline-none focus:border-samsung text-sm" />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-lg transition">Hủy</button>
                  <button type="submit" disabled={isLoading} className={`flex-1 py-2.5 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 ${
                    activeModal === "CREATE" ? "bg-samsung hover:bg-blue-700" :
                    activeModal === "RECEIVE" ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-600 hover:bg-amber-700"
                  }`}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      activeModal === "CREATE" ? <PackagePlus className="h-4 w-4" /> :
                      activeModal === "RECEIVE" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />
                    )}
                    Xác nhận
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}