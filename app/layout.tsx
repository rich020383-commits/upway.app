import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot"; // ← Importación agrupada arriba

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🚀 Metadatos Premium para SEO y compartir en Redes/WhatsApp
export const metadata: Metadata = {
  title: "Upward AI | Transformación Empresarial con Inteligencia Artificial",
  description: "Diseñamos agentes inteligentes y automatizaciones a la medida que optimizan tus procesos, reducen costos corporativos y multiplican tus ventas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es" // ← Declarado en español
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Chatbot /> {/* ← El Chatbot debe vivir siempre dentro del body */}
      </body>
    </html>
  );
}
