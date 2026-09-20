"use client";
import { useState } from "react";
import ComprovanteFechamento from "@/components/ComprovanteFechamento";
import CupomComanda from "@/components/CupomComanda";

type Previa = {
  fundoTroco: number; totalDinheiro: number; totalDigital: number; totalSaidasDinheiro: number;
  totalSangrias: number; totalSuprimentos: number; dinheiroEsperado: number; cartaoEsperado: number;
  clientesAtendidos: number; duracao: string;
};

type CupomFechamento = { tipo: "fechamento"; id: string; data: string; previa: Previa; contagemDinheiro: number; contagemCartao: number };
type CupomVenda = { tipo: "venda"; id: string; data: string; itens: { category: string; amount: number }[]; total: number; paymentMethod: string | null; clienteNome: string | null; barberNome: string | null };
type Cupom = CupomFechamento | CupomVenda;

function formatar(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ListaCupons({ cupons }: { cupons: Cupom[] }) {
  const [aberto, setAberto] = useState<Cupom | null>(null);

  if (cupons.length === 0) {
    return <p className="text-gray-500 text-sm">Nenhum cupom registrado este mês.</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {cupons.map((c) => (
          <button
            key={`${c.tipo}-${c.id}`}
            onClick={() => setAberto(c)}
            className="text-left border border-gold-dark/20 rounded-lg p-3 hover:border-gold transition-colors flex items-center justify-between"
          >
            <div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full mr-2 ${c.tipo === "fechamento" ? "bg-gold/20 text-gold" : "bg-green-400/20 text-green-300"}`}>
                {c.tipo === "fechamento" ? "Fechamento de Caixa" : "Venda"}
              </span>
              <span className="text-gray-300 text-sm">{new Date(c.data).toLocaleString("pt-BR")}</span>
            </div>
            {c.tipo === "venda" && <span className="text-white font-semibold text-sm">{formatar(c.total)}</span>}
          </button>
        ))}
      </div>

      {aberto?.tipo === "fechamento" && (
        <ComprovanteFechamento
          previa={aberto.previa}
          contagemDinheiro={aberto.contagemDinheiro}
          contagemCartao={aberto.contagemCartao}
          diferencaDinheiro={aberto.contagemDinheiro - aberto.previa.dinheiroEsperado}
          diferencaCartao={aberto.contagemCartao - aberto.previa.cartaoEsperado}
          onFechar={() => setAberto(null)}
        />
      )}

      {aberto?.tipo === "venda" && (
        <CupomComanda
          itens={aberto.itens}
          total={aberto.total}
          paymentMethod={aberto.paymentMethod}
          clienteNome={aberto.clienteNome}
          barberNome={aberto.barberNome}
          data={aberto.data}
          onFechar={() => setAberto(null)}
        />
      )}
    </>
  );
}