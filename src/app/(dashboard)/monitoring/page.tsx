// src/app/(dashboard)/monitoring/page.tsx
import { prisma } from "@/lib/prisma";
import MonitoringClient from "./MonitoringClient";

export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  // Lấy đường dẫn Grafana động từ cơ sở dữ liệu
  const config = await prisma.systemConfig.findUnique({
    where: { id: "GLOBAL" }
  });

  const initialUrl = config?.grafanaUrl || "";

  return (
    <MonitoringClient initialUrl={initialUrl} />
  );
}