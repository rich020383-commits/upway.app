"use client";

import { motion } from "framer-motion";

export default function AnimatedLogo() {
  return (
    <div className="relative flex items-center justify-center w-14 h-14 group cursor-pointer">
      
      {/* 🌟 1. EL NÚCLEO DE ENERGÍA NEÓN (Aura reactiva al mouse) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-400 blur-[18px] rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-500"
        animate={{ scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 📐 2. EL LOGO HOLOGRÁFICO (Diseño fiel a tu imagen original) */}
      <motion.svg
        viewBox="0 0 100 100"
        className="relative z-10 w-full h-full drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]"
        whileHover={{ scale: 1.1, rotate: 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <defs>
          {/* Degradado metálico-digital para el cuerpo */}
          <linearGradient id="bodyGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E3A8A" /> {/* Azul ultra oscuro */}
            <stop offset="40%" stopColor="#2563EB" /> {/* Azul medio */}
            <stop offset="100%" stopColor="#38BDF8" /> {/* Azul cielo (luz) */}
          </linearGradient>
          
          {/* Degradado para la flecha superior */}
          <linearGradient id="arrowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>

        {/* --- CAPA A: La Sombra (Efecto de profundidad) --- */}
        <path
          d="M 25 25 V 65 A 25 25 0 0 0 75 65 V 45"
          fill="none"
          stroke="#0f172a"
          strokeWidth="20"
          strokeLinecap="round"
          className="opacity-50"
          transform="translate(2, 4)"
        />

        {/* --- CAPA B: El Cuerpo Principal de la 'U' --- */}
        <motion.path
          d="M 25 25 V 65 A 25 25 0 0 0 75 65 V 45"
          fill="none"
          stroke="url(#bodyGradient)"
          strokeWidth="18"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* --- CAPA C: El Flujo de Datos (Línea de luz moviéndose por dentro) --- */}
        <motion.path
          d="M 25 25 V 65 A 25 25 0 0 0 75 65 V 45"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 24"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="opacity-70"
        />

        {/* --- CAPA D: La Flecha (Desconectada y levitando como en tu diseño) --- */}
        <motion.g
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: [0, -4, 0], opacity: 1 }}
          transition={{ 
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 1, delay: 0.5 }
          }}
        >
          {/* Cuerpo de la flecha */}
          <path
            d="M 52 35 L 75 12 L 98 35"
            fill="none"
            stroke="url(#arrowGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Brillo central en la punta */}
          <motion.circle
            cx="75"
            cy="12"
            r="4"
            fill="#FFFFFF"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>

      </motion.svg>
    </div>
  );
}