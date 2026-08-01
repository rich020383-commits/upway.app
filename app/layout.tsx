import type { Metadata, Viewport } from "next"; // ← Importamos Viewport para el color de la app
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/Chatbot"; 

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
  manifest: "/manifest.json", // ← ¡Aquí conectamos tu app instalable!
};

// 🎨 Configuración visual para dispositivos móviles
export const viewport: Viewport = {
  themeColor: "#00D1FF", // Pinta la barra superior del celular con tu cian neón
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
      <body className="min-h-full flex flex-col">
        {children}
        <Chatbot /> 
      </body>
    </html>
  );
}