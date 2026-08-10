import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔍 [INFORMANTE] 1. Intento de login recibido para:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor ingresa tu correo y contraseña");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            throw new Error("No se encontró ninguna cuenta con este correo");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta");
          }

          console.log("✅ [INFORMANTE] Autenticación exitosa para:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };

        } catch (error: any) {
          console.error("🚨 Error en authorize:", error.message || error);
          throw new Error(error.message || "Error interno al procesar el acceso");
        }
      }
    })
  ],
  // 🔥 ESTO ES LO QUE FALTABA: Asegura que el ID viaje a la sesión del navegador
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };