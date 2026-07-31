"use client";
import { useState } from "react";
import { registrarTransacao } from "./actions";

type Barbeiro = { id: string; name: string };
type Servico = {
  name: string;
  price: number | null;
  discountedPrice: number | null;
  discountPercentage: number | null;
};

const CATEGORIAS_DESPESA = ["Aluguel", "Insumos", "Contas", "Manutenção", "Outros"];
const inputClass = "bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full";

export default function NovaTransacaoForm({
  role,
  barbeiros,
  servicos,
}: {
  role: string;
  barbeiros: Barbeiro[];
  servicos: Servico[];
}) {
  const [tipo, setTipo] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [categoria, setCategoria] = useState(servicos[0]?.name ?? "");
  const [valor, setValor] = useState(
    (servicos[0]?.discountedPrice ?? servicos[0]?.price)?.toString() ?? ""
  );
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const servicoSelecionado = servicos.find((s) => s.name === categoria);
  const temDesconto = tipo === "INCOME" && servicoSelecionado?.discountPercentage != null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const formData = new FormData(e.currentTarget);
    formData.set("type", tipo);

    const resultado = await registrarTransacao(formData);
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
      setSucesso(false);
    } else {
      setSucesso(true);
      setMensagem("Lançamento registrado com sucesso!");
      setTimeout(() => { window.location.href = "/caixa"; }, 800);
    }
  }

  function preencherValorPadrao(nome: string, tipoAtual: "INCOME" | "EXPENSE") {
    if (tipoAtual !== "INCOME") return "";
    const servico = servicos.find((s) => s.name === nome);
    const preco = servico?.discountedPrice ?? servico?.price;
    return preco != null ? preco.toString() : "";
  }

  function handleCategoriaChange(nome: string) {
    setCategoria(nome);
    setValor(preencherValorPadrao(nome, tipo));
  }

  const categorias = tipo === "INCOME" ? servicos.map((s) => s.name) : CATEGORIAS_DESPESA;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-gold-dark/40 bg-black-soft rounded-xl p-6">
      {role === "OWNER" && (
        <div>
          <label className="text-sm text-gray-400 block mb-1">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => {
              const novoTipo = e.target.value as "INCOME" | "EXPENSE";
              setTipo(novoTipo);
              const novaCategoria = novoTipo === "INCOME" ? (servicos[0]?.name ?? "") : (CATEGORIAS_DESPESA[0] ?? "");
              setCategoria(novaCategoria);
              setValor(preencherValorPadrao(novaCategoria, novoTipo));
            }}
            className={inputClass}
          >
            <option value="INCOME">Entrada (serviço)</option>
            <option value="EXPENSE">Saída (despesa)</option>
          </select>
        </div>
      )}

      {tipo === "INCOME" && role === "OWNER" && (
        <div>
          <label className="text-sm text-gray-400 block mb-1">Barbeiro</label>
          <select name="barberId" required className={inputClass}>
            <option value="">Selecione...</option>
            {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 block mb-1">Categoria</label>
        <select name="category" value={categoria} onChange={(e) => handleCategoriaChange(e.target.value)} required className={inputClass}>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {temDesconto && (
          <p className="text-gold text-xs mt-1">
            🏷️ {servicoSelecionado?.discountPercentage}% de desconto aplicado automaticamente
          </p>
        )}
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Valor (R$)</label>
        <input name="amount" type="number" step="0.01" min="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Descrição (opcional)</label>
        <input name="description" type="text" className={inputClass} />
      </div>

      <button type="submit" disabled={carregando} className="bg-gold text-black-deep font-semibold rounded-lg py-2 hover:bg-gold-light transition-colors disabled:opacity-50">
        {carregando ? "Registrando..." : "Registrar"}
      </button>
      {mensagem && <p className={sucesso ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{mensagem}</p>}
    </form>
  );
}