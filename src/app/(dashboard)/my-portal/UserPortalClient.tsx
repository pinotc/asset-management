// src/app/(dashboard)/my-portal/UserPortalClient.tsx
"use client";

import { useState } from "react";
import { Wrench, ShieldCheck, Loader2, CheckCircle2, Send } from "lucide-react";
import { changePassword } from "@/actions/user.actions";
// Import action tạo ticket của bạn (giả định bạn đã có action này)
// import { createRepairTicket } from "@/actions/ticket.actions"; 

interface UserPortalProps {
  myAssets: { id: string; assetCode: string; name: string }[];
}

export default function UserPortalClient({ myAssets }: UserPortalProps) {
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: "", text: "" });
  const [ticketMessage, setTicketMessage] = useState({ type: "", text: "" });

  // Xử lý Gửi Báo Cáo Sự Cố
  const handleReportIssue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingTicket(true);
    setTicketMessage({ type: "", text: "" });

    const formData = new FormData(e.currentTarget);
    
    try {
      // GỌI ACTION TẠO TICKET Ở ĐÂY
      // const res = await createRepairTicket(formData);
      // Giả lập API gọi thành công
      await new Promise(resolve => setTimeout(resolve, 800));
      const res = { success: true };

      if (res.success) {
        setTicketMessage({ type: "success", text: "Đã gửi báo cáo sự cố tới bộ phận IT thành công!" });
        (e.target as HTMLFormElement).reset();
      } else {
        setTicketMessage({ type: "error", text: "Không thể gửi báo cáo. Vui lòng thử lại." });
      }
    } catch (error) {
      setTicketMessage({ type: "error", text: "Lỗi kết nối hệ thống." });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Xử lý Đổi Mật Khẩu
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPwd(true);
    setPwdMessage({ type: "", text: "" });

    const formData = new FormData(e.currentTarget);
    const res = await changePassword(formData);

    if (res.success) {
      setPwdMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      (e.target as HTMLFormElement).reset();
    } else {
      setPwdMessage({ type: "error", text: res.error || "Lỗi đổi mật khẩu." });
    }
    setIsChangingPwd(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* FORM 2: ĐỔI MẬT KHẨU */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 bg-gray-50 border-b flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="font-bold text-gray-800">Bảo mật tài khoản</h2>
        </div>
        
        <div className="p-6 flex-1">
          {pwdMessage.text && (
            <div className={`p-3 mb-4 rounded-lg text-sm font-medium flex items-center gap-2 ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {pwdMessage.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {pwdMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Mật khẩu hiện tại *</label>
              <input 
                type="password" 
                name="currentPassword" 
                required 
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-samsung text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Mật khẩu mới *</label>
              <input 
                type="password" 
                name="newPassword" 
                required 
                minLength={6}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-samsung text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Xác nhận mật khẩu mới *</label>
              <input 
                type="password" 
                name="confirmPassword" 
                required 
                minLength={6}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-samsung text-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={isChangingPwd}
              className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 transition disabled:opacity-70"
            >
              {isChangingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cập Nhật Mật Khẩu"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}