"use client";
import { useState } from "react";
import { liquidarComissao } from "./actions";

export default function FormComissao({ barberId, pendente }: { barberId: string; pendente: number }) {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await liquidarComissao(barberId, new FormData(e.currentTarget));
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
    } else {
      setMensagem("Comissão liquidada com sucesso!");
      setTimeout(() => window.location.reload(), 1000);
    }
  }

  if (pendente <= 0) {
    return <p className="text-gray-500 text-sm">Nenhuma comissão pendente.</p>;
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 text-sm hover:bg-gold-light transition-colors">
        Comissão Paga
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-gray-400 text-xs">Pendente: {formatar(pendente)}. Informe quanto está pagando agora — o restante é absorvido pelos Fundos.</p>
      <div className="flex gap-2">
        <input name="valorPago" type="number" step="0.01" min="0.01" max={pendente} defaultValue={pendente} required
          className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white flex-1" />
        <button type="submit" disabled={carregando} className="bg-gold text-black-deep font-semibold rounded-lg px-4 hover:bg-gold-light transition-colors disabled:opacity-50 whitespace-nowrap">
          {carregando ? "..." : "Confirmar"}
        </button>
      </div>
      {mensagem && <p className="text-gray-300 text-xs">{mensagem}</p>}
    </form>
  );
}