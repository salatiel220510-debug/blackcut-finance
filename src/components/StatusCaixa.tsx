"use client";
import { useState } from "react";
import ModalAbrirCaixa from "./ModalAbrirCaixa";
import ModalMovimentoCaixa from "./ModalMovimentoCaixa";
import ModalFecharCaixa from "./ModalFecharCaixa";

type SessaoInfo = { id: string; abertoPorNome: string; abertoEm: string; fundoTroco: number } | null;

export default function StatusCaixa({ sessao }: { sessao: SessaoInfo }) {
  const [modalAberto, setModalAberto] = useState<"abrir" | "sangria" | "suprimento" | "fechar" | null>(null);
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      <div className="border border-gold-dark/40 bg-black-soft rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        {sessao ? (
          <>
            <div>
              <p className="text-green-400 text-sm font-semibold">🟢 Caixa aberto</p>
              <p className="text-gray-400 text-xs">
                Por {sessao.abertoPorNome} — desde {new Date(sessao.abertoEm).toLocaleString("pt-BR")} — fundo de troco: {formatar(sessao.fundoTroco)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setModalAberto("sangria")} className="border border-gold-dark rounded-lg px-3 py-1.5 text-sm text-gold hover:border-gold transition-colors">
                Sangria
              </button>
              <button onClick={() => setModalAberto("suprimento")} className="border border-gold-dark rounded-lg px-3 py-1.5 text-sm text-gold hover:border-gold transition-colors">
                Suprimento
              </button>
              <button onClick={() => setModalAberto("fechar")} className="bg-gold text-black-deep font-semibold rounded-lg px-3 py-1.5 text-sm hover:bg-gold-light transition-colors">
                Fechar Caixa
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-red-300 text-sm font-semibold">🔴 Caixa fechado</p>
            <button onClick={() => setModalAberto("abrir")} className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 text-sm hover:bg-gold-light transition-colors">
              Abrir Caixa
            </button>
          </>
        )}
      </div>

      {modalAberto === "abrir" && <ModalAbrirCaixa onFechar={() => setModalAberto(null)} />}
      {modalAberto === "sangria" && <ModalMovimentoCaixa tipo="SANGRIA" onFechar={() => setModalAberto(null)} />}
      {modalAberto === "suprimento" && <ModalMovimentoCaixa tipo="SUPRIMENTO" onFechar={() => setModalAberto(null)} />}
      {modalAberto === "fechar" && sessao && <ModalFecharCaixa sessionId={sessao.id} onFechar={() => setModalAberto(null)} />}
    </>
  );
}