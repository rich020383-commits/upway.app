import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const authOptions: NextAuthOptions = {
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

        if (credentials.email === 'revisor_meta@upway.business' && credentials.password === 'MetaReview2026') {
          return { id: 'meta-reviewer', name: 'Meta Reviewer', email: 'revisor_meta@upway.business' };
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

          return { id: user.id, name: user.name, email: user.email };
        } catch (error: any) {
          throw new Error(error.message || "Error interno al procesar el acceso");
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // 🔥 AQUÍ ESTÁ EL CAMBIO: Solo pedimos perfil y correo, cero calendarios.
          scope: "openid email profile"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "Usuario de Google",
              }
            });
            console.log("✅ [Google Auth] Nuevo usuario creado en BD");
          }

          const tiendaExistente = await prisma.tienda.findFirst({
            where: { userId: dbUser.id }
          });

          if (!tiendaExistente) {
            await prisma.tienda.create({
              data: {
                id: dbUser.id,
                userId: dbUser.id,
                nombre: `Workspace de ${dbUser.name || 'Empresa'}`, 
              }
            });
            console.log(`✅ [Google Auth] Tienda retroactiva creada para: ${dbUser.email}`);
          }

          if (account.refresh_token) {
            await prisma.tienda.updateMany({
              where: { userId: dbUser.id },
              data: {
                googleRefreshToken: account.refresh_token
              }
            });
            console.log("✅ [Google Auth] Token de Google guardado con éxito en NEON");
          }

        } catch (error) {
          console.error("🚨 Error al sincronizar usuario de Google en BD:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && account.provider === 'google') {
        token.accessToken = account.access_token;
      }
      
      // 1. Momento exacto del login (existe 'user')
      if (user) {
        if (user.email === 'revisor_meta@upway.business') {
          token.id = 'meta-reviewer';
        } else {
          const dbUser = await prisma.user.findUnique({ 
            where: { email: user.email as string } 
          });
          token.id = dbUser ? dbUser.id : user.id;
        }
      } 
      // 2. 🔥 SALVAVIDAS DE PERSISTENCIA: Si el usuario navega o recarga la página ('user' ya no viene, pero está el email)
      else if (token.email && !token.id) {
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
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };