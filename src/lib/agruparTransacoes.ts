import type { TransacaoView } from "@/components/ListaTransacoesDia";

export type ItemExibicao = {
  chave: string;
  ehComanda: boolean;
  category: string;
  amount: number;
  barberNome: string | null;
  date: string;
  itens: TransacaoView[];
};

export function agruparPorComanda(transacoes: TransacaoView[]): ItemExibicao[] {
  const semComanda = transacoes.filter((t) => !t.comandaId);
  const comComanda = transacoes.filter((t) => t.comandaId);

  const grupos: Record<string, TransacaoView[]> = {};
  for (const t of comComanda) {
    const chave = t.comandaId as string;
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(t);
  }

  const resultado: ItemExibicao[] = semComanda.map((t) => ({
    chave: t.id,
    ehComanda: false,
    category: t.category,
    amount: t.amount,
    barberNome: t.barberNome,
    date: t.date,
    itens: [t],
  }));

  for (const [comandaId, itens] of Object.entries(grupos)) {
    const total = itens.reduce((s, i) => s + i.amount, 0);
    const nomeCliente = itens.find((i) => i.clienteNome)?.clienteNome;
    resultado.push({
      chave: comandaId,
      ehComanda: true,
      category: nomeCliente ? `Comanda — ${nomeCliente}` : `Comanda (${itens.length} itens)`,
      amount: total,
      barberNome: itens[0]?.barberNome ?? null,
      date: itens[0]?.date,
      itens,
    });
  }

  return resultado.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}