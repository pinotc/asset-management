// src/app/(dashboard)/documents/print/[type]/[id]/page.tsx
import ProtocolDocument from "@/components/assets/ProtocolDocument";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getDocumentDataCenter } from "@/actions/document.actions"; 

interface PrintPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function PrintProtocolPage({ params }: PrintPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const typeStr = resolvedParams.type.toLowerCase();

  // 1. Xác định mẫu phôi Template tương ứng từ DB
  const templateId = typeStr === "repair" ? "MAINTENANCE" : typeStr.toUpperCase();
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId }
  });

  // 2. LẤY DỮ LIỆU TỪ HÀM ĐÃ CÓ SẴN 
  const response = await getDocumentDataCenter();
  const allData = response.data || { handovers: [], recalls: [], repairs: [] };

  let recordData = null;

  // Lọc ra đúng bản ghi cần in từ mảng dữ liệu trả về
  if (typeStr === "handover") {
    recordData = allData.handovers.find((item: any) => item.id === id);
  } else if (typeStr === "recall") {
    recordData = allData.recalls.find((item: any) => item.id === id);
  } else if (typeStr === "repair" || typeStr === "maintenance") {
    recordData = allData.repairs.find((item: any) => item.id === id);
  }

  // 3. FIX 404: NẾU KHÔNG TÌM THẤY BẢN GHI (DO DÙNG ID GIẢ LẬP), TẠO DỮ LIỆU MẪU ĐỂ XEM TRƯỚC
  if (!recordData) {
    // Nếu là ID thật từ DB mà không có thì mới trả về 404, còn ID giả lập thì cho phép render
    if (id.startsWith("MOCK") || id.startsWith("RECALL")) {
      recordData = {
        id: id,
        createdAt: new Date(),
        remark: "Dữ liệu mô phỏng (Mock Data) dùng để xem trước giao diện in ấn.",
        user: { name: "Tên nhân sự mẫu", department: { name: "Phòng ban mẫu" } },
        creator: { name: "Kỹ thuật viên mẫu", department: { name: "IT" } },
        asset: { assetCode: "AST-MOCK", name: "Thiết bị xem trước", serialNumber: "SN-MOCK" }
      };
    } else {
      return notFound();
    }
  }

  // Chuẩn hóa Enum cho Component giao diện
  const protocolType = typeStr === "repair" ? "MAINTENANCE" : (typeStr.toUpperCase() as any);

  return (
    <div className="bg-gray-200 min-h-screen -m-6 p-6 flex justify-center print:p-0 print:m-0 print:bg-white">
      <ProtocolDocument 
        type={protocolType} 
        recordId={id} 
        templateData={template} 
        dbRecord={recordData} 
      />
    </div>
  );
}