"use client";
import { useState } from "react";
import { registrarComanda } from "./actions";

type Barbeiro = { id: string; name: string };
type Servico = { name: string; price: number | null; discountedPrice: number | null; discountPercentage: number | null };
type Item = { category: string; amount: number };

const METODOS_PAGAMENTO = [
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "PIX", label: "Pix" },
  { valor: "CARTAO_DEBITO", label: "Débito" },
  { valor: "CARTAO_CREDITO", label: "Crédito" },
] as const;

const inputClass = "bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full";

export default function FormComanda({ role, barbeiros, servicos }: { role: string; barbeiros: Barbeiro[]; servicos: Servico[] }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(servicos[0]?.name ?? "");
  const [valorItem, setValorItem] = useState((servicos[0]?.discountedPrice ?? servicos[0]?.price)?.toString() ?? "");
  const [barberId, setBarberId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<typeof METODOS_PAGAMENTO[number]["valor"]>("DINHEIRO");
  const [clienteNome, setClienteNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const total = itens.reduce((s, i) => s + i.amount, 0);
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function handleCategoriaChange(nome: string) {
    setCategoriaSelecionada(nome);
    const servico = servicos.find((s) => s.name === nome);
    const preco = servico?.discountedPrice ?? servico?.price;
    setValorItem(preco != null ? preco.toString() : "");
  }

  function adicionarItem() {
    const valorNumerico = parseFloat(valorItem.replace(",", "."));
    if (!categoriaSelecionada || isNaN(valorNumerico) || valorNumerico <= 0) {
      setMensagem("Selecione um serviço e informe um valor válido antes de adicionar.");
      return;
    }
    setItens([...itens, { category: categoriaSelecionada, amount: valorNumerico }]);
    setMensagem("");
  }

  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index));
  }

  async function handleFechar() {
    if (itens.length === 0) {
      setMensagem("Adicione pelo menos um item à comanda.");
      return;
    }
    if (role === "OWNER" && !barberId) {
      setMensagem("Selecione o barbeiro responsável.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await registrarComanda({
        barberId: role === "OWNER" ? barberId : undefined,
        paymentMethod,
        clienteNome: clienteNome || undefined,
        itens,
      });

      if (resultado?.erro) {
        setMensagem(resultado.erro);
        setSucesso(false);
      } else {
        setSucesso(true);
        setMensagem("Comanda fechada com sucesso!");
        setTimeout(() => { window.location.href = "/caixa"; }, 800);
      }
    } catch (err) {
      console.error(err);
      setMensagem("Ocorreu um erro inesperado. Tente novamente.");
      setSucesso(false);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 border border-gold-dark/40 bg-black-soft rounded-xl p-6">
      {role === "OWNER" && (
        <div>
          <label className="text-sm text-gray-400 block mb-1">Barbeiro</label>
          <select value={barberId} onChange={(e) => setBarberId(e.target.value)} className={inputClass}>
            <option value="">Selecione...</option>
            {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 block mb-1">Cliente (opcional)</label>
        <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" className={inputClass} />
      </div>

      <div className="border-t border-gold-dark/20 pt-4">
        <label className="text-sm text-gray-400 block mb-2">Adicionar item</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={categoriaSelecionada} onChange={(e) => handleCategoriaChange(e.target.value)} className={inputClass}>
            {servicos.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <input type="number" step="0.01" min="0.01" value={valorItem} onChange={(e) => setValorItem(e.target.value)} placeholder="Valor" className={inputClass} />
          <button type="button" onClick={adicionarItem} className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold transition-colors whitespace-nowrap">
            + Adicionar
          </button>
        </div>
      </div>

      {itens.length > 0 && (
        <div className="flex flex-col gap-2">
          {itens.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-black-deep border border-gold-dark/20 rounded-lg px-3 py-2">
              <span className="text-white text-sm">{item.category} — {formatar(item.amount)}</span>
              <button type="button" onClick={() => removerItem(i)} className="text-red-400 text-xs">Remover</button>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-gold-dark/20">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-gold font-bold text-lg">{formatar(total)}</span>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 block mb-2">Forma de pagamento</label>
        <div className="grid grid-cols-2 gap-2">
          {METODOS_PAGAMENTO.map((m) => (
            <button
              key={m.valor}
              type="button"
              onClick={() => setPaymentMethod(m.valor)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${
                paymentMethod === m.valor
                  ? "bg-gold text-black-deep border-gold"
                  : "bg-black-deep text-gray-300 border-gold-dark/40 hover:border-gold"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleFechar}
        disabled={carregando || itens.length === 0}
        className="bg-gold text-black-deep font-semibold rounded-lg py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50 mt-2"
      >
        {carregando ? "Fechando..." : `Fechar Comanda${itens.length > 0 ? ` — ${formatar(total)}` : ""}`}
      </button>
      {mensagem && <p className={sucesso ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{mensagem}</p>}
    </div>
  );
}