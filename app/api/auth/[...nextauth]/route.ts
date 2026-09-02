import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin"; // 🚀 1. Importamos LinkedIn
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { resolveBillingState } from '@/lib/billing/access';

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

        // 🛡️ ACCESO PARA REVISOR DE META — credenciales en variables de entorno
        // Requiere: META_REVIEWER_EMAIL y META_REVIEWER_HASHED_PWD (bcrypt).
        const reviewerEmail = process.env.META_REVIEWER_EMAIL;
        const reviewerHash = process.env.META_REVIEWER_HASHED_PWD;

        if (reviewerEmail && reviewerHash && credentials.email.toLowerCase() === reviewerEmail.toLowerCase()) {
          const isReviewerValid = await bcrypt.compare(credentials.password, reviewerHash);
          if (isReviewerValid) {
            return { id: 'meta-reviewer', name: 'Meta Reviewer', email: reviewerEmail };
          }
          throw new Error("Contraseña incorrecta");
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
          scope: "openid email profile"
        }
      }
    }),
    // 🚀 2. INYECTAMOS EL MOTOR DE LINKEDIN B2B
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'openid profile email' },
      },
      issuer: 'https://www.linkedin.com/oauth', // 🔥 EMISOR CORREGIDO
      jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
      profile(profile, tokens) {
        const defaultImage = 'https://cdn-icons-png.flaticon.com/512/174/174857.png';
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture || defaultImage,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // 🚀 3. Hacemos que la creación en BD funcione para Google Y para LinkedIn
      if (account?.provider === "google" || account?.provider === "linkedin") {
        if (!user.email) return false;

        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || `Usuario de ${account.provider}`,
              }
            });
            console.log(`✅ [${account.provider.toUpperCase()} Auth] Nuevo usuario creado en BD`);
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
            console.log(`✅ [${account.provider.toUpperCase()} Auth] Tienda retroactiva creada para: ${dbUser.email}`);
          }

        } catch (error) {
          console.error(`🚨 Error al sincronizar usuario de ${account.provider} en BD:`, error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // También guardamos el token si viene de Google o LinkedIn
      if (account && (account.provider === 'google' || account.provider === 'linkedin')) {
        token.accessToken = account.access_token;
      }

      const storedAccessState =
        (user as any)?.accessState ??
        (token as any)?.accessState ??
        (token as any)?.billingState ??
        process.env.DEFAULT_BILLING_STATE ??
        'trial';

      const accessState = resolveBillingState(storedAccessState);
      token.accessState = accessState;
      token.billingState = accessState;

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
      // 2. 🔥 SALVAVIDAS DE PERSISTENCIA
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
        session.user.accessState = (token.accessState as string) ?? 'trial';
        session.user.billingState = (token.billingState as string) ?? 'trial';
        session.user.role = (token.role as string) ?? 'clinic-admin';
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