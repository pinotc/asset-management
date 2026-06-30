"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import RepairStatusModal from "./RepairStatusModal";

export default function RepairStatusButton({ repair, locations }: { repair: any, locations: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 flex items-center gap-1.5 transition"
      >
        <Settings className="h-3.5 w-3.5" /> Xử lý
      </button>

      {isOpen && (
        <RepairStatusModal 
          repair={repair} 
          locations={locations} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}