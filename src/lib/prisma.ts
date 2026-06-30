// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Bắt buộc cho môi trường Node.js khi dùng Neon
neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
  // 1. Đọc từ biến môi trường
  let connectionString = process.env.DATABASE_URL;

  // 2. Chốt chặn an toàn: Dán trực tiếp URL của bạn vào đây để phòng hờ Windows kẹt Cache
  const fallbackUrl = "postgresql://neondb_owner:npg_BeuDA5dKJ7oq@ep-morning-sound-aog9c24y-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=requires"; 
  
  if (!connectionString || connectionString.trim() === "") {
    console.warn("⚠️ Không đọc được process.env.DATABASE_URL, đang sử dụng Fallback URL...");
    connectionString = fallbackUrl;
  }

  // 3. Kết nối thông qua Neon Serverless
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)

  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma