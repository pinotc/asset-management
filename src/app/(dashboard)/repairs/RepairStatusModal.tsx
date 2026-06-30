"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Wrench, Printer, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { startRepairWorkflow, completeRepairWorkflow } from "@/actions/repair.actions";

interface RepairStatusModalProps {
  repair: any;
  locations: any[];
  onClose: () => void;
}

export default function RepairStatusModal({ repair, locations, onClose }: RepairStatusModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(repair.status === "OPEN" ? "START_FORM" : "COMPLETE_FORM");
  
  const [shouldRecall, setShouldRecall] = useState(true);
  const [locationId, setLocationId] = useState("");
  const [remark, setRemark] = useState("");
  
  // Đổi từ cost sang completeNote
  const [completeNote, setCompleteNote] = useState(""); 
  
  const [printConfig, setPrintConfig] = useState<{ type: "recall" | "handover"; id: string } | null>(null);

  const handleStartRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shouldRecall && !locationId) return alert("Vui lòng chọn kho lưu giữ máy khi thu hồi!");

    setIsSubmitting(true);
    const res = await startRepairWorkflow(repair.id, shouldRecall, locationId, remark);

    if (res.success) {
      if (shouldRecall && res.data?.assignmentId) {
        setPrintConfig({ type: "recall", id: res.data.assignmentId });
        window.open(`/documents/print/recall/${res.data.assignmentId}`, "_blank");
        setStep("SUCCESS_SCREEN");
      } else {
        alert("Đã duyệt! Đang tiến hành sửa chữa tại chỗ.");
        handleClose();
      }
    } else {
      alert("Lỗi: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleCompleteRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Truyền ghi chú (completeNote) vào Server Action thay vì số tiền
    const res = await completeRepairWorkflow(repair.id, completeNote);

    if (res.success) {
      if (repair.hasRecall && res.data?.newAssignmentId) {
        setPrintConfig({ type: "handover", id: res.data.newAssignmentId });
        window.open(`/documents/print/handover/${res.data.newAssignmentId}`, "_blank");
        setStep("SUCCESS_SCREEN");
      } else {
        alert("Đã hoàn thành sửa chữa thiết bị!");
        handleClose();
      }
    } else {
      alert("Lỗi: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        
        <div className="flex justify-between items-center p-4 border-b bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
            <Wrench className="h-4 w-4 text-samsung" /> Mã phiếu: {repair.ticketNumber}
          </h3>
          <button onClick={handleClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {step === "SUCCESS_SCREEN" && printConfig && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-1">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">Đã cập nhật hệ thống!</h3>
              <p className="text-xs text-gray-400 mt-1">
                {printConfig.type === "recall" ? "Đã mở tab in biên bản thu hồi." : "Đã tái cấp phát & mở tab in bàn giao."}
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <button onClick={() => window.open(`/documents/print/${printConfig.type}/${printConfig.id}`, "_blank")} className="w-full flex items-center justify-center gap-2 bg-samsung text-white px-5 py-2.5 rounded-xl text-sm font-bold">
                <Printer className="h-4 w-4" /> In lại biên bản (A4)
              </button>
              <button onClick={handleClose} className="w-full px-5 py-2.5 text-xs font-semibold border rounded-xl hover:bg-gray-50">Xác nhận & Đóng</button>
            </div>
          </div>
        )}

        {step === "START_FORM" && (
          <form onSubmit={handleStartRepair} className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              <label className="text-xs font-bold text-gray-800">Thu hồi máy về kho sửa chữa?</label>
              <input type="checkbox" checked={shouldRecall} onChange={e => setShouldRecall(e.target.checked)} className="w-4 h-4 accent-samsung" />
            </div>
            {shouldRecall && (
              <div className="space-y-3">
                <select required value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full p-2.5 border rounded-lg text-xs outline-none bg-white font-semibold">
                  <option value="">-- Chọn kho kỹ thuật lưu giữ --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="Ghi chú điều động..." className="w-full h-16 p-2 border rounded-lg text-xs outline-none resize-none" />
              </div>
            )}
            <div className="pt-2 border-t">
              <button type="submit" disabled={isSubmitting} className="w-full bg-samsung text-white py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Tiếp nhận & Sửa chữa <ArrowRight className="h-3 w-3" /></>}
              </button>
            </div>
          </form>
        )}

        {step === "COMPLETE_FORM" && (
          <form onSubmit={handleCompleteRepair} className="p-5 space-y-4">
            <div className="bg-purple-50 border p-3 rounded-xl text-xs space-y-1 text-gray-600">
              <p>Luồng ban đầu: {repair.hasRecall ? <span className="text-red-600 font-bold">Có thu hồi</span> : <span className="text-emerald-600 font-bold">Không thu hồi</span>}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Ghi chú nghiệm thu hoàn thành</label>
              <textarea 
                value={completeNote} 
                onChange={e => setCompleteNote(e.target.value)} 
                placeholder="Ví dụ: Đã thay linh kiện A, test máy hoạt động tốt..."
                className="w-full h-24 p-2.5 border rounded-lg text-sm outline-none resize-none" 
              />
            </div>
            <div className="pt-2 border-t">
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold flex justify-center">
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Nghiệm thu hoàn thành"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}