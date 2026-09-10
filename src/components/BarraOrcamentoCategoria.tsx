"use client";
import { useState, useEffect } from "react";
import { consultarOrcamentoCategoria } from "@/app/caixa/comanda/nova/budget-actions";
import BarraProgresso from "./BarraProgresso";

export default function BarraOrcamentoCategoria({ categoriaId }: { categoriaId: string }) {
  const [dados, setDados] = useState<{ nome: string; limite: number | null; gastoAtual: number } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    if (!categoriaId) { setDados(null); setCarregando(false); return; }

    consultarOrcamentoCategoria(categoriaId).then((resultado) => {
      if (!cancelado) { setDados(resultado); setCarregando(false); }
    });

    return () => { cancelado = true; };
  }, [categoriaId]);

  if (carregando) return <p className="text-gray-500 text-xs">Carregando orçamento...</p>;
  if (!dados) return null;

  return (
    <div className="border border-gold-dark/30 rounded-lg p-3 bg-black-deep">
      <BarraProgresso label={`Orçamento — ${dados.nome} (mês)`} valor={dados.gastoAtual} meta={dados.limite} />
    </div>
  );
}