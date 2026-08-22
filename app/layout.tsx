import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot"; 
import PwaRegister from "@/components/PwaRegister";

// 🔥 1. IMPORTAMOS EL CEREBRO DEL IDIOMA
import { LanguageProvider } from "@/context/LanguageContext";

// 🔥 2. IMPORTAMOS EL CEREBRO DE LA SESIÓN (NEXTAUTH)
import { Providers } from "./providers";

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
        
        {/* 🔥 3. ENVOLVEMOS TODA LA APP CON EL PROVEEDOR DE SESIÓN PRIMERO */}
        <Providers>
          {/* 🔥 4. LUEGO EL PROVEEDOR DE IDIOMA */}
          <LanguageProvider>
            
            {/* Contenedor principal libre de elementos duplicados */}
            <main className="flex-grow">
              {children}
            </main>

            {/* Componentes Globales */}
            <Chatbot /> 
            <PwaRegister />
            
          </LanguageProvider>
        </Providers>

      </body>
    </html>
  );
}