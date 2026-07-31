"use client";
import { useState } from "react";
import {
  atualizarComissao,
  criarServico,
  atualizarServico,
  desativarServico,
  definirDesconto,
  removerDesconto,
  atualizarSaldoBancario,
} from "./actions";

type Servico = {
  id: string;
  name: string;
  price: number | null;
  active: boolean;
  discountPercentage: number | null;
  discountValidUntil: string | null;
};

const inputClass = "bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full";

export default function ConfiguracoesForm({
  comissaoAtual,
  saldoAtual,
  servicos,
}: {
  comissaoAtual: number;
  saldoAtual: number;
  servicos: Servico[];
}) {
  const [mensagem, setMensagem] = useState("");

  async function handleComissao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = await atualizarComissao(new FormData(e.currentTarget));
    setMensagem(resultado?.erro || "Comissão atualizada com sucesso!");
  }

  async function handleSaldo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = await atualizarSaldoBancario(new FormData(e.currentTarget));
    setMensagem(resultado?.erro || "Saldo bancário atualizado!");
  }

  async function handleNovoServico(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = await criarServico(new FormData(e.currentTarget));
    if (resultado?.erro) setMensagem(resultado.erro);
    else window.location.reload();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
        <h2 className="font-display text-lg text-gold mb-4">Percentual de Comissão</h2>
        <form onSubmit={handleComissao} className="flex gap-2">
          <input name="commissionPercentage" type="number" step="0.01" min="0" max="100" defaultValue={comissaoAtual} required className={inputClass} />
          <button type="submit" className="bg-gold text-black-deep font-semibold rounded-lg px-4 hover:bg-gold-light transition-colors whitespace-nowrap">
            Salvar
          </button>
        </form>
      </section>

      <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
        <h2 className="font-display text-lg text-gold mb-4">Saldo Bancário Atual</h2>
        <p className="text-gray-400 text-sm mb-3">
          Valor real que a conta bancária da barbearia possui hoje — usado só como referência.
        </p>
        <form onSubmit={handleSaldo} className="flex gap-2">
          <input name="saldoBancario" type="number" step="0.01" min="0" defaultValue={saldoAtual} required className={inputClass} />
          <button type="submit" className="bg-gold text-black-deep font-semibold rounded-lg px-4 hover:bg-gold-light transition-colors whitespace-nowrap">
            Salvar
          </button>
        </form>
      </section>

      <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
        <h2 className="font-display text-lg text-gold mb-4">Serviços, Preços e Descontos</h2>
        <div className="flex flex-col gap-4">
          {servicos.filter((s) => s.active).map((s) => (
            <ServicoLinha key={s.id} servico={s} />
          ))}
        </div>

        <h3 className="font-display text-base text-gold mt-6 mb-3">Adicionar novo serviço</h3>
        <form onSubmit={handleNovoServico} className="flex flex-col sm:flex-row gap-2">
          <input name="name" placeholder="Nome do serviço" required className={inputClass} />
          <input name="price" type="number" step="0.01" min="0" placeholder="Preço (opcional)" className={inputClass} />
          <button type="submit" className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold-light transition-colors whitespace-nowrap">
            Adicionar
          </button>
        </form>
      </section>

      {mensagem && <p className="text-gold text-sm">{mensagem}</p>}
    </div>
  );
}

function ServicoLinha({ servico }: { servico: Servico }) {
  const [mostrarDesconto, setMostrarDesconto] = useState(false);
  const descontoAtivo =
    servico.discountPercentage != null &&
    (!servico.discountValidUntil || new Date(servico.discountValidUntil) >= new Date());

  return (
    <div className="border border-gold-dark/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <strong className="text-white">{servico.name}</strong>
        <button
          onClick={async () => { await desativarServico(servico.id); window.location.reload(); }}
          className="text-red-400 text-xs border border-red-400/50 rounded-full px-3 py-1 hover:bg-red-400 hover:text-black-deep transition-colors"
        >
          Remover
        </button>
      </div>

      <form
        className="flex gap-2 mb-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await atualizarServico(servico.id, new FormData(e.currentTarget));
          window.location.reload();
        }}
      >
        <input name="price" type="number" step="0.01" min="0" defaultValue={servico.price ?? ""} placeholder="Sem preço fixo" className={inputClass} />
        <button type="submit" className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 hover:bg-gold transition-colors whitespace-nowrap">
          Atualizar
        </button>
      </form>

      {descontoAtivo ? (
        <div className="flex items-center justify-between bg-gold/10 border border-gold rounded-lg px-3 py-2">
          <span className="text-gold text-sm">
            {Number(servico.discountPercentage)}% off
            {servico.discountValidUntil && ` até ${new Date(servico.discountValidUntil).toLocaleDateString("pt-BR")}`}
          </span>
          <button onClick={async () => { await removerDesconto(servico.id); window.location.reload(); }} className="text-red-400 text-xs underline">
            Remover desconto
          </button>
        </div>
      ) : mostrarDesconto ? (
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const resultado = await definirDesconto(servico.id, new FormData(e.currentTarget));
            if (!resultado?.erro) window.location.reload();
          }}
        >
          <input name="discountPercentage" type="number" step="0.01" min="1" max="100" placeholder="% de desconto" required className={inputClass} />
          <input name="discountValidUntil" type="date" className={inputClass} />
          <button type="submit" className="bg-gold text-black-deep font-semibold rounded-lg px-4 hover:bg-gold-light transition-colors whitespace-nowrap">
            Aplicar
          </button>
        </form>
      ) : (
        <button onClick={() => setMostrarDesconto(true)} className="text-gold text-sm underline">
          + Adicionar desconto
        </button>
      )}
    </div>
  );
}