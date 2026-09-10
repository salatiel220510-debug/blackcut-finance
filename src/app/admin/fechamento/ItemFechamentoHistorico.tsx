"use client";
import { useState } from "react";
import { consultarTransacoesDoMes } from "./mes-actions";

type Item = { id: string; type: "INCOME" | "EXPENSE"; category: string; amount: number; barberNome: string | null };

export default function ItemFechamentoHistorico({
  mesLabel,
  ano,
  mesIndex0,
  faturamentoBruto,
  lucroLiquido,
}: {
  mesLabel: string;
  ano: number;
  mesIndex0: number;
  faturamentoBruto: number;
  lucroLiquido: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [itens, setItens] = useState<Item[] | null>(null);

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function abrir() {
    setAberto(true);
    setCarregando(true);
    const resultado = await consultarTransacoesDoMes(ano, mesIndex0);
    setItens(resultado);
    setCarregando(false);
  }

  return (
    <>
      <button onClick={abrir} className="w-full text-left border border-gold-dark/20 rounded-lg p-3 hover:border-gold transition-colors">
        <p className="text-white font-semibold mb-1">{mesLabel}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>Faturamento: <span className="text-white">{formatar(faturamentoBruto)}</span></span>
          <span>Lucro líquido: <span className="text-gold">{formatar(lucroLiquido)}</span></span>
        </div>
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-8" onClick={() => setAberto(false)}>
          <div className="bg-black-soft border border-gold rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl text-gold text-center mb-4">{mesLabel}</h2>

            {carregando && <p className="text-gray-400 text-sm text-center">Carregando...</p>}

            {!carregando && itens && itens.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">Desculpe, este mês foi tristemente vazio.</p>
            )}

            {!carregando && itens && itens.length > 0 && (
              <div className="flex flex-col gap-2">
                {itens.map((i) => (
                  <div key={i.id} className="flex justify-between text-sm py-1.5 border-b border-gold-dark/10">
                    <span className={i.type === "INCOME" ? "text-green-300" : "text-red-300"}>
                      {i.category}{i.barberNome ? ` — ${i.barberNome}` : ""}
                    </span>
                    <span className="text-white">{formatar(i.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setAberto(false)} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm mt-4">
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}