import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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

        // 🚀 ACCESO DIRECTO PARA EL REVISOR DE META
        if (credentials.email === 'revisor_meta@upway.business' && credentials.password === 'MetaReview2026') {
          console.log("🤖 [META REVIEW] Acceso concedido al revisor de Meta");
          return { 
            id: 'meta-reviewer', 
            name: 'Meta Reviewer', 
            email: 'revisor_meta@upway.business' 
          };
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
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "Usuario de Google",
              }
            });
            console.log("✅ [Google Auth] Nuevo usuario creado en BD:", user.email);
          }
        } catch (error) {
          console.error("🚨 Error al sincronizar usuario de Google en BD:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      } else if (token.email && !token.id) {
        if (token.email === 'revisor_meta@upway.business') {
          token.id = 'meta-reviewer';
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string }
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
        }
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