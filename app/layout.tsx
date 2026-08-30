import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot"; 
import PwaRegister from "@/components/PwaRegister";
import { iniciarOidoNeon } from '@/lib/listener';
import Script from 'next/script'; // Importación correcta del componente Script de Next.js

// Iniciamos el oído en segundo plano (solo del lado del servidor)
if (typeof window === 'undefined') {
  iniciarOidoNeon();
}
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
      <head>
        {/* GOOGLE TAG MANAGER (SCRIPT) - Inyectado de forma segura en Next.js */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WTLF5LLC');
            `,
          }}
        />
      </head>
      
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        
        {/* GOOGLE TAG MANAGER (NOSCRIPT) - Respaldo inyectado justo al abrir el body */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WTLF5LLC"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

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