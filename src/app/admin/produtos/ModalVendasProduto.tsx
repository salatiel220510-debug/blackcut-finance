"use client";
import { useState, useEffect } from "react";
import { listarVendasProduto } from "./actions";
import CupomComanda from "@/components/CupomComanda";

type Venda = { id: string; data: string; amount: number; paymentMethod: string | null; barberNome: string | null; clienteNome: string | null; category: string };

function formatar(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ModalVendasProduto({ produtoId, produtoNome, onFechar }: { produtoId: string; produtoNome: string; onFechar: () => void }) {
  const [vendas, setVendas] = useState<Venda[] | null>(null);
  const [cupomAberto, setCupomAberto] = useState<Venda | null>(null);

  useEffect(() => {
    listarVendasProduto(produtoId).then(setVendas);
  }, [produtoId]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-8" onClick={onFechar}>
      <div className="bg-black-soft border border-gold rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl text-gold text-center mb-4">Vendas — {produtoNome}</h2>

        {!vendas && <p className="text-gray-400 text-sm text-center">Carregando...</p>}
        {vendas && vendas.length === 0 && <p className="text-gray-400 text-sm text-center">Nenhuma venda registrada ainda.</p>}

        <div className="flex flex-col gap-2">
          {vendas?.map((v) => (
            <button
              key={v.id}
              onClick={() => setCupomAberto(v)}
              className="text-left border border-gold-dark/20 rounded-lg p-3 hover:border-gold transition-colors flex items-center justify-between"
            >
              <span className="text-gray-300 text-sm">{new Date(v.data).toLocaleString("pt-BR")}</span>
              <span className="text-white font-semibold text-sm">{formatar(v.amount)}</span>
            </button>
          ))}
        </div>

        <button onClick={onFechar} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm mt-4">Fechar</button>
      </div>

      {cupomAberto && (
        <CupomComanda
          tipo="venda"
          itens={[{ category: cupomAberto.category, amount: cupomAberto.amount }]}
          total={cupomAberto.amount}
          paymentMethod={cupomAberto.paymentMethod}
          clienteNome={cupomAberto.clienteNome}
          barberNome={cupomAberto.barberNome}
          data={cupomAberto.data}
          onFechar={() => setCupomAberto(null)}
        />
      )}
    </div>
  );
}