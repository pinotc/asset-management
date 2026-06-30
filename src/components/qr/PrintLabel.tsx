"use client";

import { QRCodeSVG } from "qrcode.react";

export interface PrintAssetInfo {
  assetCode: string;
  name: string;
  model?: string | null;
  serialNumber?: string | null;
  departmentName?: string | null;
}

export default function PrintLabel({ asset }: { asset: PrintAssetInfo }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: 80mm 60mm; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      {/* Component Tem Thuần Túy */}
      <div className="w-[80mm] h-[60mm] bg-white p-4 flex flex-col justify-between border-2 border-black shadow-sm mx-auto print:border-none print:shadow-none print:m-0 print:p-3">
        
        <div className="text-center border-b border-black pb-1 mb-2">
          <h1 className="font-bold text-[13px] tracking-widest uppercase text-black">DAEHA CABLE VINA</h1>
        </div>

        <div className="flex gap-4 items-center flex-1">
          <div className="shrink-0 bg-white p-1 border border-gray-300 rounded print:border-black">
            <QRCodeSVG value={asset.assetCode} size={90} level={"H"} />
          </div>
          
          <div className="flex-1 flex flex-col justify-center text-xs space-y-1 overflow-hidden text-black">
  <p className="font-black text-[15px] truncate">{asset.assetCode}</p>

  <div className="flex items-center gap-1 text-[11px]">
    <span className="text-gray-500 uppercase">Thiết bị:</span>
    <span className="font-bold truncate">{asset.name}</span>
  </div>

  <div className="flex items-center gap-1 text-[11px]">
    <span className="text-gray-500 uppercase">Model:</span>
    <span className="font-semibold truncate">{asset.model || "N/A"}</span>
  </div>

  <div className="flex items-center gap-1 text-[11px]">
    <span className="text-gray-500 uppercase">SN:</span>
    <span className="font-semibold truncate">{asset.serialNumber || "N/A"}</span>
  </div>
</div>
        </div>

        <div className="mt-2 text-[9px] text-center font-bold text-black uppercase border-t border-dashed border-gray-400 pt-1.5">
          DO NOT REMOVE THE LABEL - CONTACT: MR.DAT(IT/MES)
        </div>
      </div>
    </>
  );
}