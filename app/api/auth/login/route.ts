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
        if (!credentials?.email || !credentials?.password) return null;

        // 🛡️ 1. ACCESO PARA REVISOR DE META — credenciales en variables de entorno
        // Requiere: META_REVIEWER_EMAIL y META_REVIEWER_HASHED_PWD (bcrypt).
        // Si no están configuradas, este camino se ignora y sigue la validación normal.
        const reviewerEmail = process.env.META_REVIEWER_EMAIL;
        const reviewerHash = process.env.META_REVIEWER_HASHED_PWD;

        if (reviewerEmail && reviewerHash && credentials.email.toLowerCase() === reviewerEmail.toLowerCase()) {
          const isReviewerValid = await bcrypt.compare(credentials.password, reviewerHash);
          if (isReviewerValid) {
            console.log("🤖 [META REVIEW] Acceso concedido al revisor");
            return { id: 'meta-reviewer', name: 'Meta Reviewer', email: reviewerEmail };
          }
          return null; // Email del revisor existe pero contraseña incorrecta: no revelar si es el email del revisor
        }

        // 2. VALIDACIÓN NORMAL CONTRA NEON (Tu DB)
        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user || !user.password) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          return { id: user.id, name: user.name, email: user.email };
        } catch (error) {
          return null;
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
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existingUser) {
          await prisma.user.create({ data: { email: user.email, name: user.name || "Usuario Google" } });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };