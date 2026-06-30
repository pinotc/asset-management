import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assetCode, ipAddress, macAddress, batteryLevel, deviceVersion } = body;

    if (!assetCode) {
      return NextResponse.json({ error: "Missing assetCode" }, { status: 400 });
    }

    // 1. Tìm tài sản
    const asset = await prisma.asset.findUnique({
      where: { assetCode },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // 2. Cập nhật hoặc tạo mới bản ghi Monitoring
    const monitoringData = await prisma.assetMonitoring.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        ipAddress,
        macAddress,
        batteryLevel,
        deviceVersion,
        lastOnlineTime: new Date(),
        deviceStatus: "ONLINE",
      },
      update: {
        ipAddress,
        macAddress,
        batteryLevel,
        deviceVersion,
        lastOnlineTime: new Date(),
        deviceStatus: "ONLINE",
      },
      include: {
        asset: {
          select: { name: true, assetCode: true, model: true }
        }
      }
    });

    // 3. Bắn event qua WebSocket để cập nhật Dashboard ngay lập tức
    try {
      await pusherServer.trigger("mes-monitoring", "device-ping", monitoringData);
    } catch (pusherError) {
      console.warn("Pusher trigger failed, but DB updated:", pusherError);
    }

    return NextResponse.json({ success: true, data: monitoringData });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}