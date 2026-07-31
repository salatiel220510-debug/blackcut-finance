"use client";
import { useEffect, useState } from "react";
import TesouraAnimada from "./TesouraAnimada";

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
      className={`fixed inset-0 z-50 bg-black-deep flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        saindo ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <TesouraAnimada size={80} />
      <h1 className="font-display text-3xl text-gold tracking-wide animate-brilho-dourado">
        BlackCut Finance
      </h1>
      <p className="text-gray-400 text-sm animate-pulso-suave">Powered By Alpha Órbita Labs</p>
    </div>
  );
}