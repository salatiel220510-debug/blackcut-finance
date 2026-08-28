"use client";
import { useState } from "react";

type ItemResumo = { category: string; amount: number; barberNome?: string | null };

export default function BotaoFecharBarbearia({
  data,
  totalEntradas,
  totalSaidas,
  totalComissoes,
  servicos,
  gastos,
}: {
  data: string;
  totalEntradas: number;
  totalSaidas: number;
  totalComissoes: number;
  servicos: ItemResumo[];
  gastos: ItemResumo[];
}) {
  const [aberto, setAberto] = useState(false);
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const saldoDia = totalEntradas - totalSaidas;
  const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 text-sm hover:bg-gold-light transition-colors whitespace-nowrap"
      >
        Fechar Barbearia
      </button>

      {aberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-8" onClick={() => setAberto(false)}>
          <div
            className="bg-black-soft border border-gold rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl text-gold text-center mb-1">Resumo do Dia</h2>
            <p className="text-gray-400 text-sm text-center mb-5">{dataFormatada}</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <ResumoItem label="Entradas" valor={formatar(totalEntradas)} />
              <ResumoItem label="Saídas" valor={formatar(totalSaidas)} />
              <ResumoItem label="Comissões" valor={formatar(totalComissoes)} />
              <ResumoItem label="Saldo do dia" valor={formatar(saldoDia)} destaque />
            </div>

            <div className="mb-4">
              <p className="text-green-400 text-xs font-semibold uppercase mb-2">Serviços ({servicos.length})</p>
              {servicos.length === 0 && <p className="text-gray-500 text-xs">Nenhum serviço hoje.</p>}
              {servicos.map((s, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-200 py-1 border-b border-gold-dark/10">
                  <span>{s.category}{s.barberNome ? ` — ${s.barberNome}` : ""}</span>
                  <span>{formatar(s.amount)}</span>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <p className="text-red-400 text-xs font-semibold uppercase mb-2">Gastos ({gastos.length})</p>
              {gastos.length === 0 && <p className="text-gray-500 text-xs">Nenhum gasto hoje.</p>}
              {gastos.map((g, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-200 py-1 border-b border-gold-dark/10">
                  <span>{g.category}</span>
                  <span>{formatar(g.amount)}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setAberto(false)} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm">
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ResumoItem({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`border rounded-lg p-3 ${destaque ? "border-gold bg-gold/10" : "border-gold-dark/20"}`}>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`font-bold ${destaque ? "text-gold" : "text-white"}`}>{valor}</p>
    </div>
  );
}