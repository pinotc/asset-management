// src/components/ui/AssetQRCode.tsx
"use client";

import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";

interface AssetQRCodeProps {
  assetCode: string;
}

export default function AssetQRCode({ assetCode }: AssetQRCodeProps) {
  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg as Node);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${assetCode}-QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="inline-flex flex-col items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <QRCodeSVG
        id="qr-code-svg"
        value={assetCode}
        size={150}
        level={"H"}
        includeMargin={true}
      />
      <div className="mt-3 text-sm font-bold text-gray-800">{assetCode}</div>
      <button
        onClick={downloadQR}
        className="mt-3 flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-md transition"
      >
        <Download className="h-3 w-3" /> Tải mã QR
      </button>
    </div>
  );
}