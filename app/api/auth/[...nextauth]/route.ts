import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Patrón Singleton para proteger las conexiones con Neon
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
          console.log("❌ [INFORMANTE] Faltan credenciales");
          throw new Error("Por favor ingresa tu correo y contraseña");
        }

        try {
          console.log("🔍 [INFORMANTE] 2. Consultando usuario en Neon...");
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            console.log("❌ [INFORMANTE] El correo no existe en la base de datos");
            throw new Error("No se encontró ninguna cuenta con este correo");
          }

          if (!user.password) {
            console.log("❌ [INFORMANTE] El usuario existe pero no tiene contraseña registrada");
            throw new Error("Cuenta sin contraseña configurada");
          }

          console.log("🔍 [INFORMANTE] 3. Usuario encontrado. Verificando contraseña con bcrypt...");
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log("❌ [INFORMANTE] La contraseña es incorrecta");
            throw new Error("Contraseña incorrecta");
          }

          console.log("✅ [INFORMANTE] 4. ¡Contraseña válida! Autenticación exitosa para:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };

        } catch (error: any) {
          console.error("🚨 [INFORMANTE] EXCEPCIÓN CAPTURADA EN AUTHORIZE:", error.message || error);
          throw new Error(error.message || "Error interno al procesar el acceso");
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };