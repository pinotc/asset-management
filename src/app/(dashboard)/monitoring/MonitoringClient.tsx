// src/app/(dashboard)/monitoring/MonitoringClient.tsx
"use client";

import { useState } from "react";
import { Activity, Settings, Save, X, Link2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { updateGrafanaUrl } from "@/actions/setting.actions";
import { useRouter } from "next/navigation";

export default function MonitoringClient({ initialUrl }: { initialUrl: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN";

  const [grafanaUrl, setGrafanaUrl] = useState(initialUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editUrl, setEditUrl] = useState(initialUrl);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateGrafanaUrl(editUrl);
    
    if (result.success) {
      setGrafanaUrl(editUrl); // Cập nhật Iframe ngay lập tức
      setIsEditing(false);
      router.refresh();
    } else {
      alert("Lỗi: " + result.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-samsung animate-pulse" />
            Giám sát Hạ tầng & Thiết bị (Grafana)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hệ thống hiển thị trực quan tải lượng CPU, RAM, trạng thái kết nối IoT và thiết bị mạng trong nhà xưởng.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Đường truyền Realtime
          </div>
          
          {/* Nút Cấu hình chỉ hiện cho ADMIN */}
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Settings className="h-4 w-4" /> Cấu hình
            </button>
          )}
        </div>
      </div>

      {/* Modal Chỉnh sửa cấu hình URL Grafana */}
      {isEditing && (
        <div className="absolute top-20 right-0 z-50 w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-xl p-5 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-samsung" /> Nhúng Grafana Dashboard
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Embed URL (Đường dẫn nhúng)
              </label>
              <input 
                type="text" 
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="http://192.168.x.x:3000/d/..."
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-samsung text-gray-800 font-mono bg-gray-50" 
              />
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                Nên sử dụng địa chỉ IP tĩnh thay vì <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500">localhost</code> để các máy con trong xưởng có thể xem được. Thêm <code className="bg-gray-100 px-1 py-0.5 rounded text-samsung">&kiosk=1</code> ở cuối URL để ẩn thanh công cụ gốc.
              </p>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !editUrl.trim()}
                className="px-4 py-2 text-sm font-bold bg-samsung text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Khung nhúng Iframe Grafana Động */}
      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-2xl shadow-inner overflow-hidden relative min-h-500px">
        {grafanaUrl ? (
          <iframe
            src={grafanaUrl}
            className="w-full h-full border-0"
            allow="fullscreen"
            title="Grafana Realtime Dashboard"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Activity className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium">Chưa có kết nối đến máy chủ Grafana.</p>
            {isAdmin && <p className="text-sm mt-1">Bấm "Cấu hình" ở góc phải để thiết lập đường dẫn.</p>}
          </div>
        )}
      </div>
    </div>
  );
}