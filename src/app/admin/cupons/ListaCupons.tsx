"use client";
import { useState, useMemo } from "react";
import ComprovanteFechamento from "@/components/ComprovanteFechamento";
import CupomComanda from "@/components/CupomComanda";
import SeletorDataPopover from "@/components/SeletorDataPopover";
import { paraStringISO } from "@/components/Calendario";

type Previa = {
  fundoTroco: number; totalDinheiro: number; totalDigital: number; totalTaxas: number; totalSaidasDinheiro: number;
  totalSangrias: number; totalSuprimentos: number; dinheiroEsperado: number; cartaoEsperado: number;
  clientesAtendidos: number; duracao: string;
};

type CupomFechamento = { tipo: "fechamento"; id: string; data: string; previa: Previa; contagemDinheiro: number; contagemCartao: number };
type CupomVendaGasto = {
  tipo: "venda" | "despesa"; id: string; data: string;
  itens: { category: string; amount: number }[]; total: number;
  paymentMethod: string | null; nome: string | null; barberNome: string | null;
};

function formatar(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ListaCupons({
  cuponsFechamento,
  cuponsVendaGasto,
}: {
  cuponsFechamento: CupomFechamento[];
  cuponsVendaGasto: CupomVendaGasto[];
}) {
  const [diaFiltro, setDiaFiltro] = useState("");
  const [aberto, setAberto] = useState<CupomFechamento | CupomVendaGasto | null>(null);

  const fechamentosFiltrados = useMemo(() => {
    if (!diaFiltro) return cuponsFechamento;
    return cuponsFechamento.filter((c) => paraStringISO(new Date(c.data)) === diaFiltro);
  }, [cuponsFechamento, diaFiltro]);

  const vendasGastosFiltrados = useMemo(() => {
    if (!diaFiltro) return cuponsVendaGasto;
    return cuponsVendaGasto.filter((c) => paraStringISO(new Date(c.data)) === diaFiltro);
  }, [cuponsVendaGasto, diaFiltro]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 flex-wrap">
        <SeletorDataPopover valor={diaFiltro} onChange={setDiaFiltro} placeholder="Filtrar por dia" />
        {diaFiltro && (
          <button onClick={() => setDiaFiltro("")} className="text-gold text-sm underline whitespace-nowrap">
            Mês inteiro
          </button>
        )}
      </div>

      <section>
        <h3 className="font-display text-base text-gold mb-3">Fechamentos de Caixa ({fechamentosFiltrados.length})</h3>
        {fechamentosFiltrados.length === 0 && (
          <p className="text-gray-500 text-sm">Nenhum fechamento de caixa {diaFiltro ? "neste dia" : "este mês"}.</p>
        )}
        <div className="flex flex-col gap-2">
          {fechamentosFiltrados.map((c) => (
            <button
              key={c.id}
              onClick={() => setAberto(c)}
              className="text-left border border-gold-dark/20 rounded-lg p-3 hover:border-gold transition-colors flex items-center gap-2"
            >
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold shrink-0">Fechamento</span>
              <span className="text-gray-300 text-sm">{new Date(c.data).toLocaleString("pt-BR")}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-base text-gold mb-3">Vendas e Gastos ({vendasGastosFiltrados.length})</h3>
        {vendasGastosFiltrados.length === 0 && (
          <p className="text-gray-500 text-sm">Nenhuma venda ou gasto {diaFiltro ? "neste dia" : "este mês"}.</p>
        )}
        <div className="flex flex-col gap-2">
          {vendasGastosFiltrados.map((c) => (
            <button
              key={c.id}
              onClick={() => setAberto(c)}
              className="text-left border border-gold-dark/20 rounded-lg p-3 hover:border-gold transition-colors flex items-center justify-between"
            >
              <div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full mr-2 ${c.tipo === "venda" ? "bg-green-400/20 text-green-300" : "bg-red-400/20 text-red-300"}`}>
                  {c.tipo === "venda" ? "Venda" : "Despesa"}
                </span>
                <span className="text-gray-300 text-sm">{new Date(c.data).toLocaleString("pt-BR")}</span>
              </div>
              <span className="text-white font-semibold text-sm">{formatar(c.total)}</span>
            </button>
          ))}
        </div>
      </section>

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

      {(aberto?.tipo === "venda" || aberto?.tipo === "despesa") && (
        <CupomComanda
          tipo={aberto.tipo}
          itens={aberto.itens}
          total={aberto.total}
          paymentMethod={aberto.paymentMethod}
          clienteNome={aberto.nome}
          barberNome={aberto.barberNome}
          data={aberto.data}
          onFechar={() => setAberto(null)}
        />
      )}
    </div>
  );
}