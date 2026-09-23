import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot"; 
import PwaRegister from "@/components/PwaRegister";
import Script from 'next/script'; // Importación correcta del componente Script de Next.js
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

/**
 * Fuente display premium para titulares (h1/h2/h3 con `font-display`).
 * Activa la clase `font-display` que antes era MUERTA en /terminos,
 * /privacy y Chatbot.
 *
 * Pesos EXPLÍCITOS (500–800): Plus Jakarta Sans llega hasta 800, no 900.
 * Al declarar los pesos reales evitamos que `font-black` (900) se recorte
 * silenciosamente a 800 por el eje variable y garantizamos que el navegador
 * sirva el archivo Bold/ExtraBold de verdad (contraste firme en titulares).
 */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

// 🚀 Metadatos Premium para SEO, Redes y PWA
export const metadata: Metadata = {
  title: "Upway Health — Recepcionista de voz con IA 24/7 para clínicas e IPS",
  description:
    "Sophie atiende las llamadas de tu clínica 24/7, agenda citas en tu propia agenda y captura la identidad del paciente conforme a la Resolución 866 de 2021, sin dejar nada sin contestar.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
};

// 🎨 Configuración visual para dispositivos móviles (Bloqueo de zoom)
export const viewport: Viewport = {
  // Alineado con el splash móvil (fondo negro) y la barra del navegador:
  // sin costura de color entre el chrome del celular y el primer frame
  // de la app. Negro puro para que la barra de sistema Android no asome
  // una tira clara por debajo del splash.
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // `viewportFit: cover`: habilita las variables env(safe-area-inset-*) que
  // usa el chat flotante, para no chocar con la barra gestual del iPhone.
  viewportFit: "cover",
  // `resizes-content`: en Android el teclado REDIMENSIONA el layout en vez de
  // superponerse; sin esto el campo de escritura de Sophie quedaba tapado
  // por el teclado al abrir el chat en el celular.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es" 
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} h-full antialiased`}
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