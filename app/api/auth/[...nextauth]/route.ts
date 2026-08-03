import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Inicializamos Prisma
const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        // 1. Verificamos que lleguen los datos
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor ingresa tu correo y contraseña");
        }

        // 2. Buscamos al usuario en Neon
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("No se encontró ninguna cuenta con este correo");
        }

        // 3. Comparamos la contraseña encriptada (el $2b$10$...)
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Contraseña incorrecta");
        }

        // 4. Si todo está perfecto, devolvemos el usuario para crear la sesión
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
    })
  ],
  pages: {
    signIn: '/login', // Redirige a tu diseño bonito si hay error
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secreto-temporal", // Asegúrate de tener NEXTAUTH_SECRET en tu .env
});

// Next.js App Router requiere exportar los métodos HTTP así:
export { handler as GET, handler as POST };