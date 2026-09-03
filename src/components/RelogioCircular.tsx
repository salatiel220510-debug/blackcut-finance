"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RelogioCircular() {
  const pathname = usePathname();
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    setAgora(new Date());
    const intervalo = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  if (pathname === "/login" || pathname === "/cadastro") return null;
  if (!agora) return <div className="w-32 h-32 mx-auto my-4" />;

  const segundosDoDia = agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds();
  const percentualDia = (segundosDoDia / 86400) * 100;

  const raio = 46;
  const circunferencia = 2 * Math.PI * raio;
  const offset = circunferencia - (percentualDia / 100) * circunferencia;

  const diaSemana = agora.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  const diaNumero = agora.getDate();
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const marcas = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <div className="relative w-32 h-32 mx-auto my-4">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="gradienteAnelRelogio" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C0912" />
            <stop offset="100%" stopColor="#E8394F" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r={raio} fill="none" stroke="#1C0D0F" strokeWidth="3" />

        <circle
          cx="50"
          cy="50"
          r={raio}
          fill="none"
          stroke="url(#gradienteAnelRelogio)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 4px rgba(196,30,58,0.9))", transition: "stroke-dashoffset 1s linear" }}
        />

        {marcas.map((graus) => {
          const rad = (graus * Math.PI) / 180;
          const x1 = 50 + 41 * Math.cos(rad);
          const y1 = 50 + 41 * Math.sin(rad);
          const x2 = 50 + 44 * Math.cos(rad);
          const y2 = 50 + 44 * Math.sin(rad);
          return <line key={graus} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5C0912" strokeWidth="1" />;
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          {diaSemana} <span className="text-gold">{diaNumero}</span>
        </p>
        <p
          className="font-display text-2xl font-bold text-white tabular-nums"
          style={{ textShadow: "0 0 8px rgba(196,30,58,0.6)" }}
        >
          {hora}
        </p>
      </div>
    </div>
  );
}