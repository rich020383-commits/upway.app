import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot"; 
import PwaRegister from "@/components/PwaRegister";
import { iniciarOidoNeon } from '@/lib/listener';
import Script from 'next/script'; // Importación correcta del componente Script de Next.js

// Iniciamos el oído en segundo plano solo cuando exista la conexión configurada
if (typeof window === 'undefined' && process.env.DIRECT_URL) {
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

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

// 🚀 Metadatos Premium para SEO, Redes y PWA
export const metadata: Metadata = {
  title: "Upway | Premium Intelligence Platform",
  description: "Upway powers premium operations, care workflows and AI orchestration for high-touch businesses and clinics.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

// 🎨 Configuración visual para dispositivos móviles (Bloqueo de zoom)
export const viewport: Viewport = {
  themeColor: "#0d1727",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        {gtmId ? (
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
        ) : null}
      </head>
      
      <body className="min-h-full flex flex-col bg-[#f7faff] text-slate-900">
        
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        ) : null}

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