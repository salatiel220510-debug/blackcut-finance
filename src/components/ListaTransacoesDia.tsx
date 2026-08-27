"use client";
import { useState } from "react";
import BotaoExcluirTransacao from "@/components/BotaoExcluirTransacao";

export type TransacaoView = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string | null;
  amount: number;
  date: string;
  barberNome: string | null;
  commissionAmount: number | null;
  paymentMethod: string | null;
  clienteNome: string | null;
  comandaId: string | null;
  criadoPorNome: string;
  podeExcluir: boolean;
};

const PAGAMENTO_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  CARTAO_DEBITO: "Cartão de Débito",
  CARTAO_CREDITO: "Cartão de Crédito",
};

function formatar(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ListaTransacoesDia({
  servicos,
  gastos,
  itensPorComanda,
}: {
  servicos: TransacaoView[];
  gastos: TransacaoView[];
  itensPorComanda: Record<string, TransacaoView[]>;
}) {
  const [selecionado, setSelecionado] = useState<TransacaoView | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-green-400 font-semibold text-sm mb-2 uppercase tracking-wide">
            Serviços ({servicos.length})
          </h3>
          {servicos.length === 0 && <p className="text-gray-500 text-sm">Nenhum serviço nesse dia.</p>}
          <div className="flex flex-col gap-2">
            {servicos.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelecionado(t)}
                className="text-left border border-gold-dark/30 bg-black-soft rounded-lg p-3 hover:border-gold transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{t.category}</p>
                    {t.barberNome && <p className="text-gray-400 text-xs">{t.barberNome}</p>}
                  </div>
                  <span className="text-white font-bold shrink-0">{formatar(t.amount)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-red-400 font-semibold text-sm mb-2 uppercase tracking-wide">
            Gastos ({gastos.length})
          </h3>
          {gastos.length === 0 && <p className="text-gray-500 text-sm">Nenhum gasto nesse dia.</p>}
          <div className="flex flex-col gap-2">
            {gastos.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelecionado(t)}
                className="text-left border border-gold-dark/30 bg-black-soft rounded-lg p-3 hover:border-gold transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-white font-semibold truncate">{t.category}</p>
                  <span className="text-white font-bold shrink-0">{formatar(t.amount)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selecionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setSelecionado(null)}>
          <div
            className="bg-black-soft border border-gold-dark rounded-xl p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display text-lg text-gold">{selecionado.category}</h3>
              <button onClick={() => setSelecionado(null)} className="text-gray-400 text-xl leading-none">×</button>
            </div>

            <div className="flex flex-col gap-2 text-sm mb-4">
              <Linha label="Tipo" valor={selecionado.type === "INCOME" ? "Entrada" : "Saída"} />
              <Linha label="Valor" valor={formatar(selecionado.amount)} destaque />
              <Linha label="Data" valor={new Date(selecionado.date).toLocaleString("pt-BR")} />
              {selecionado.barberNome && <Linha label="Barbeiro" valor={selecionado.barberNome} />}
              {selecionado.commissionAmount != null && <Linha label="Comissão" valor={formatar(selecionado.commissionAmount)} />}
              {selecionado.clienteNome && <Linha label="Cliente" valor={selecionado.clienteNome} />}
              {selecionado.paymentMethod && <Linha label="Pagamento" valor={PAGAMENTO_LABEL[selecionado.paymentMethod] ?? selecionado.paymentMethod} />}
              {selecionado.description && <Linha label="Descrição" valor={selecionado.description} />}
              <Linha label="Lançado por" valor={selecionado.criadoPorNome} />
            </div>

            {selecionado.comandaId && (itensPorComanda[selecionado.comandaId]?.length ?? 0) > 1 && (
              <div className="border-t border-gold-dark/20 pt-3 mb-4">
                <p className="text-gold text-xs font-semibold mb-2">Outros itens dessa comanda:</p>
                <div className="flex flex-col gap-1">
                  {itensPorComanda[selecionado.comandaId]
                    .filter((i) => i.id !== selecionado.id)
                    .map((i) => (
                      <div key={i.id} className="flex justify-between text-xs text-gray-300">
                        <span>{i.category}</span>
                        <span>{formatar(i.amount)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {selecionado.podeExcluir && (
              <div className="border-t border-gold-dark/20 pt-3">
                <BotaoExcluirTransacao id={selecionado.id} onSucesso={() => setSelecionado(null)} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Linha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={destaque ? "text-gold font-bold" : "text-white"}>{valor}</span>
    </div>
  );
}