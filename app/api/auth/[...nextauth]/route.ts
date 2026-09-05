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

      const email = (user?.email as string | undefined) ?? (token.email as string | undefined);

      if (email) {
        if (email === 'revisor_meta@upway.business') {
          token.id = 'meta-reviewer';
          token.role = 'admin';
          token.organizationName = 'Upway';
          token.clinicName = 'Operación central';
          token.organizationId = 'meta-reviewer-org';
          token.clinicId = 'meta-reviewer-clinic';
          token.vertical = 'general';
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            include: {
              ownedOrganizations: {
                include: {
                  clinics: {
                    orderBy: { createdAt: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          });

          token.id = dbUser ? dbUser.id : (user?.id as string | undefined) ?? token.id;

          const organization = dbUser?.ownedOrganizations?.[0];
          const clinic = organization?.clinics?.[0];

          token.organizationId = organization?.id ?? 'default-org';
          token.clinicId = clinic?.id ?? 'default-clinic';
          token.organizationName = organization?.name ?? 'Negocio general';
          token.clinicName = clinic?.name ?? 'Espacio operativo';
          token.role = organization ? 'owner' : 'admin';
          token.vertical = (organization?.vertical ? String(organization.vertical).toLowerCase() : 'general');
          token.businessType = token.vertical;
        }
      }

      if (user && !token.id && user.email && user.email !== 'revisor_meta@upway.business') {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string },
          include: {
            ownedOrganizations: {
              include: {
                clinics: {
                  orderBy: { createdAt: 'asc' },
                  take: 1,
                },
              },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          const organization = dbUser.ownedOrganizations?.[0];
          if (organization) {
            token.organizationId = organization.id;
            token.organizationName = organization.name;
            token.role = 'owner';
            token.vertical = String(organization.vertical).toLowerCase();
            token.businessType = token.vertical;
          }
          const clinic = organization?.clinics?.[0];
          if (clinic) {
            token.clinicId = clinic.id;
            token.clinicName = clinic.name;
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
        session.user.role = (token.role as string) ?? 'owner';
        session.user.organizationId = (token.organizationId as string) ?? 'default-org';
        session.user.clinicId = (token.clinicId as string) ?? 'default-clinic';
        session.user.organizationName = (token.organizationName as string) ?? 'Negocio general';
        session.user.clinicName = (token.clinicName as string) ?? 'Espacio operativo';
        session.user.vertical = (token.vertical as string) ?? 'general';
        session.user.businessType = (token.businessType as string) ?? 'general';
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