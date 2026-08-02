"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker registrado exitosamente."))
        .catch((err) => console.log("❌ Error al registrar el Service Worker:", err));
    }
  }, []);

  return null;
}