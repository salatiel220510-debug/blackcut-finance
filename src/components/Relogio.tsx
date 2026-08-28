"use client";
import { useEffect, useState } from "react";

export default function Relogio() {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const intervalo = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  if (!agora) return null;

  return (
    <span className="text-xs text-gray-400 tabular-nums">
      {agora.toLocaleDateString("pt-BR")} — {agora.toLocaleTimeString("pt-BR")}
    </span>
  );
}