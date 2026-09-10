"use client";
import { useState, useEffect } from "react";
import { consultarCartaoAction } from "@/app/caixa/comanda/nova/fidelidade-actions";
import LogoBCFinanceSVG from "./LogoBCFinanceSVG";

export default function CartaoFidelidadeMini({ clienteNome }: { clienteNome: string | null }) {
  const [cartao, setCartao] = useState<{ marcasAtuais: number; cartoesCompletos: number } | null>(null);

  useEffect(() => {
    if (!clienteNome?.trim()) return;
    consultarCartaoAction(clienteNome).then((c) => { if (c) setCartao(c); });
  }, [clienteNome]);

  if (!clienteNome?.trim() || !cartao) return null;

  return (
    <div className="border-t border-gold-dark/20 pt-3 mt-2">
      <p className="text-gold text-xs font-semibold mb-2">
        Cartão Fidelidade — {cartao.cartoesCompletos} completo(s)
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={`w-7 h-7 rounded-full border flex items-center justify-center ${i < cartao.marcasAtuais ? "border-gold bg-gold/10" : "border-gold-dark/30"}`}>
            {i < cartao.marcasAtuais && <div className="w-4 h-4"><LogoBCFinanceSVG /></div>}
          </div>
        ))}
      </div>
    </div>
  );
}