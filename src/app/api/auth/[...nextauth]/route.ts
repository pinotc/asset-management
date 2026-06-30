// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Tài khoản nội bộ",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "a.nguyen@daeha.com" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) return null;

        // Trả về thông tin user (Bao gồm role và allowedModules)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, 
          allowedModules: user.allowedModules, // Bổ sung trường phần quyền
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.allowedModules = (user as any).allowedModules; // Lưu vào chuỗi JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        // Bơm mảng quyền từ JWT xuống Session (Mặc định luôn có DASHBOARD)
        (session.user as any).allowedModules = token.allowedModules || ["DASHBOARD"]; 
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", 
  },
  session: { strategy: "jwt" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };