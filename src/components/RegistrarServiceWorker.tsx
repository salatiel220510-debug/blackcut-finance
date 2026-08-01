"use client";
import { useEffect } from "react";

export default function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.error("[sw] erro ao registrar:", e));
    }
  }, []);

  return null;
}