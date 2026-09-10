"use client";
import { useState } from "react";
import BotaoExcluirTransacao from "@/components/BotaoExcluirTransacao";
import type { ItemExibicao } from "@/lib/agruparTransacoes";
import CartaoFidelidadeMini from "./CartaoFidelidadeMini";

export type TransacaoView = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string | null;
  observacao: string |null;
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

export default function ListaTransacoesDia({ servicos, gastos }: { servicos: ItemExibicao[]; gastos: ItemExibicao[] }) {
  const [selecionado, setSelecionado] = useState<ItemExibicao | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h3 className="text-green-400 font-semibold text-sm mb-2 uppercase tracking-wide">
            Serviços ({servicos.length})
          </h3>
          {servicos.length === 0 && <p className="text-gray-500 text-sm">Nenhum serviço nesse dia.</p>}
          <div className="flex flex-col gap-2">
            {servicos.map((item) => (
              <button
                key={item.chave}
                onClick={() => setSelecionado(item)}
                className="text-left border border-gold-dark/30 bg-black-soft rounded-lg p-3 hover:border-gold transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {item.category}
                      {item.ehComanda && (
                        <span className="ml-1.5 text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">comanda</span>
                      )}
                    </p>
                    {item.barberNome && <p className="text-gray-400 text-xs">{item.barberNome}</p>}
                  </div>
                  <span className="text-white font-bold shrink-0">{formatar(item.amount)}</span>
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
            {gastos.map((item) => (
              <button
                key={item.chave}
                onClick={() => setSelecionado(item)}
                className="text-left border border-gold-dark/30 bg-black-soft rounded-lg p-3 hover:border-gold transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-white font-semibold truncate">{item.category}</p>
                  <span className="text-white font-bold shrink-0">{formatar(item.amount)}</span>
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

            {selecionado.ehComanda ? (
              <>
                <div className="flex flex-col gap-2 text-sm mb-4">
                  <Linha label="Total" valor={formatar(selecionado.amount)} destaque />
                  <Linha label="Data" valor={new Date(selecionado.date).toLocaleString("pt-BR")} />
                  {selecionado.barberNome && <Linha label="Barbeiro" valor={selecionado.barberNome} />}
                  {selecionado.itens[0]?.clienteNome && <Linha label="Cliente" valor={selecionado.itens[0].clienteNome!} />}
                                    {selecionado.itens[0]?.observacao && <Linha label="Observação" valor={selecionado.itens[0].observacao} />}
                  {selecionado.itens[0]?.paymentMethod && (
                    <Linha label="Pagamento" valor={PAGAMENTO_LABEL[selecionado.itens[0].paymentMethod!] ?? selecionado.itens[0].paymentMethod!} />
                  )}
                  {selecionado.itens[0]?.observacao && <Linha label="Observação" valor={selecionado.itens[0].observacao} />}
                                  <CartaoFidelidadeMini clienteNome={selecionado.itens[0]?.clienteNome ?? null} />
                </div>
                <div className="border-t border-gold-dark/20 pt-3">
                  <p className="text-gold text-xs font-semibold mb-2">Itens da comanda ({selecionado.itens.length}):</p>
                  <div className="flex flex-col gap-2">
                    {selecionado.itens.map((i) => (
                      <div key={i.id} className="flex items-center justify-between bg-black-deep border border-gold-dark/10 rounded-lg px-3 py-2">
                        <span className="text-gray-200 text-sm">{i.category} — {formatar(i.amount)}</span>
                        {i.podeExcluir && <BotaoExcluirTransacao id={i.id} onSucesso={() => setSelecionado(null)} />}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 text-sm mb-4">
                  <Linha label="Tipo" valor={selecionado.itens[0].type === "INCOME" ? "Entrada" : "Saída"} />
                  <Linha label="Valor" valor={formatar(selecionado.amount)} destaque />
                  <Linha label="Data" valor={new Date(selecionado.date).toLocaleString("pt-BR")} />
                  {selecionado.barberNome && <Linha label="Barbeiro" valor={selecionado.barberNome} />}
                  {selecionado.itens[0].commissionAmount != null && (
                    <Linha label="Comissão" valor={formatar(selecionado.itens[0].commissionAmount)} />
                  )}
                  {selecionado.itens[0].clienteNome && <Linha label="Cliente" valor={selecionado.itens[0].clienteNome} />}
                  {selecionado.itens[0].paymentMethod && (
                    <Linha label="Pagamento" valor={PAGAMENTO_LABEL[selecionado.itens[0].paymentMethod] ?? selecionado.itens[0].paymentMethod} />
                  )}
                  {selecionado.itens[0].description && <Linha label="Descrição" valor={selecionado.itens[0].description} />}
                  <Linha label="Lançado por" valor={selecionado.itens[0].criadoPorNome} />
                </div>

                {selecionado.itens[0].podeExcluir && (
                  <div className="border-t border-gold-dark/20 pt-3">
                    <BotaoExcluirTransacao id={selecionado.itens[0].id} onSucesso={() => setSelecionado(null)} />
                  </div>
                )}
              </>
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