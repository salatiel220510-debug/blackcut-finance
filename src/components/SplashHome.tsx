"use client";
import { useEffect, useState } from "react";
import LogoBCFinanceSVG from "./LogoBCFinanceSVG";

export default function SplashHome() {
  const [visivel, setVisivel] = useState(true);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const timerSaida = setTimeout(() => setSaindo(true), 4500);
    const timerOculto = setTimeout(() => setVisivel(false), 5000);
    return () => {
      clearTimeout(timerSaida);
      clearTimeout(timerOculto);
    };
  }, []);

  if (!visivel) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black-deep flex flex-col items-center justify-center transition-opacity duration-500 ${
        saindo ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-64 h-64 sm:w-80 sm:h-80">
        <LogoBCFinanceSVG />
      </div>
      <p className="text-gray-500 text-xs mt-2 animate-pulso-suave">Powered By Alpha Órbita Labs</p>
    </div>
  );
}