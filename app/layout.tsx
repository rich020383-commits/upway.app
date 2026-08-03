import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot"; 
import PwaRegister from "@/components/PwaRegister";
import Footer from "@/components/Footer"; // <--- 1. Importamos el Footer

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🚀 Metadatos Premium para SEO, Redes y PWA
export const metadata: Metadata = {
  title: "Upway Business",
  description: "Diseñamos agentes inteligentes y automatizaciones a la medida que optimizan tus procesos, reducen costos corporativos y multiplican tus ventas.",
  manifest: "/manifest.json",
};

// 🎨 Configuración visual para dispositivos móviles
export const viewport: Viewport = {
  themeColor: "#00D1FF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es" 
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        {/* Contenedor principal que empuja el footer hacia abajo */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* 2. El Footer global visible en todo el sitio web */}
        <Footer />

        <Chatbot /> 
        <PwaRegister />
      </body>
    </html>
  );
}