"use client";
import { useState } from "react";
import { registrarComanda } from "./actions";
import { buscarProdutoPorCodigoBarras } from "@/app/admin/produtos/actions";
import CartaoFidelidade from "@/components/CartaoFidelidade";
import BarraOrcamentoCategoria from "@/components/BarraOrcamentoCategoria";
import LeitorCodigoBarras from "@/components/LeitorCodigoBarras";

type Barbeiro = { id: string; name: string };
type Servico = { name: string; price: number | null; discountedPrice: number | null; discountPercentage: number | null };
type Produto = { id: string; name: string; price: number; quantidade: number; barcode: string | null };
type CategoriaDespesa = { id: string; name: string };
type Item = {
  tipo: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  expenseCategoryId?: string;
  descricao?: string;
  productId?: string;
  quantidadeProduto?: number;
};

const METODOS_PAGAMENTO = [
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "PIX", label: "Pix" },
  { valor: "CARTAO_DEBITO", label: "Débito" },
  { valor: "CARTAO_CREDITO", label: "Crédito" },
] as const;

const inputClass = "bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full";

export default function FormComanda({
  role,
  podeDespesas,
  barbeiros,
  servicos,
  produtos,
  categoriasDespesa,
}: {
  role: string;
  podeDespesas: boolean;
  barbeiros: Barbeiro[];
  servicos: Servico[];
  produtos: Produto[];
  categoriasDespesa: CategoriaDespesa[];
}) {
  const [itens, setItens] = useState<Item[]>([]);
  const [tipoItemAtual, setTipoItemAtual] = useState<"INCOME" | "EXPENSE" | "PRODUCT">("INCOME");
  const [categoriaServico, setCategoriaServico] = useState(servicos[0]?.name ?? "");
  const [categoriaDespesaId, setCategoriaDespesaId] = useState(categoriasDespesa[0]?.id ?? "");
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [quantidadeProduto, setQuantidadeProduto] = useState("1");
  const [valorItem, setValorItem] = useState((servicos[0]?.discountedPrice ?? servicos[0]?.price)?.toString() ?? "");
  const [nomeDespesa, setNomeDespesa] = useState("");
  const [barberId, setBarberId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<typeof METODOS_PAGAMENTO[number]["valor"]>("DINHEIRO");
  const [clienteNome, setClienteNome] = useState("");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mostrarLeitor, setMostrarLeitor] = useState(false);

  const total = itens.reduce((s, i) => s + i.amount, 0);
  const temIncomeNaLista = itens.some((i) => i.tipo === "INCOME");
  const mostrarFormaPagamento = tipoItemAtual !== "EXPENSE" || temIncomeNaLista;
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const produtoSelecionado = produtos.find((p) => p.id === produtoId);

  function handleServicoChange(nome: string) {
    setCategoriaServico(nome);
    const servico = servicos.find((s) => s.name === nome);
    const preco = servico?.discountedPrice ?? servico?.price;
    setValorItem(preco != null ? preco.toString() : "");
  }

  async function handleLeituraCodigoBarras(codigo: string) {
    setMostrarLeitor(false);
    const encontradoLocal = produtos.find((p) => p.barcode === codigo);
    if (encontradoLocal) {
      setProdutoId(encontradoLocal.id);
      setMensagem("");
      return;
    }
    const produto = await buscarProdutoPorCodigoBarras(codigo);
    if (produto) {
      setMensagem(`Produto "${produto.name}" encontrado, mas está sem estoque disponível.`);
    } else {
      setMensagem("Nenhum produto cadastrado com esse código de barras.");
    }
  }

  function adicionarItem() {
    if (tipoItemAtual === "PRODUCT") {
      if (!produtoSelecionado) { setMensagem("Selecione um produto."); return; }
      const qtd = parseInt(quantidadeProduto, 10);
      if (isNaN(qtd) || qtd <= 0) { setMensagem("Informe uma quantidade válida."); return; }
      if (qtd > produtoSelecionado.quantidade) { setMensagem(`Estoque insuficiente (disponível: ${produtoSelecionado.quantidade}).`); return; }

      setItens([...itens, {
        tipo: "INCOME",
        category: produtoSelecionado.name,
        amount: Number((produtoSelecionado.price * qtd).toFixed(2)),
        productId: produtoSelecionado.id,
        quantidadeProduto: qtd,
      }]);
      setQuantidadeProduto("1");
      setMensagem("");
      return;
    }

    const valorNumerico = parseFloat(valorItem.replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setMensagem("Informe um valor válido antes de adicionar.");
      return;
    }

    if (tipoItemAtual === "INCOME") {
      if (!categoriaServico) { setMensagem("Selecione um serviço."); return; }
      setItens([...itens, { tipo: "INCOME", category: categoriaServico, amount: valorNumerico }]);
    } else {
      const categoria = categoriasDespesa.find((c) => c.id === categoriaDespesaId);
      if (!categoria) { setMensagem("Selecione uma categoria de despesa."); return; }
      setItens([...itens, { tipo: "EXPENSE", category: categoria.name, amount: valorNumerico, expenseCategoryId: categoria.id, descricao: nomeDespesa || undefined }]);
      setNomeDespesa("");
    }
    setMensagem("");
  }

  function removerItem(index: number) {
    setItens(itens.filter((_, i) => i !== index));
  }

  async function handleFechar() {
    if (itens.length === 0) { setMensagem("Adicione pelo menos um item à comanda."); return; }
    if (role === "OWNER" && temIncomeNaLista && !barberId) { setMensagem("Selecione o barbeiro responsável pelos serviços."); return; }
    if (temIncomeNaLista && !paymentMethod) { setMensagem("Selecione a forma de pagamento."); return; }

    setCarregando(true);
    setMensagem("");

    try {
      const resultado = await registrarComanda({
        barberId: role === "OWNER" ? barberId : undefined,
        paymentMethod: temIncomeNaLista ? paymentMethod : undefined,
        clienteNome: clienteNome || undefined,
        observacao: observacao || undefined,
        itens: itens.map((i) => ({
          tipo: i.tipo, category: i.category, amount: i.amount,
          expenseCategoryId: i.expenseCategoryId, descricao: i.descricao,
          productId: i.productId, quantidadeProduto: i.quantidadeProduto,
        })),
      });

      if (resultado?.erro) {
        setMensagem(resultado.erro);
        setSucesso(false);
      } else {
        setSucesso(true);
        setMensagem(resultado?.demo ? "Simulado (Modo Demo ativo)!" : "Comanda fechada com sucesso!");
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
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setTipoItemAtual("INCOME")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold border ${tipoItemAtual === "INCOME" ? "bg-gold text-black-deep border-gold" : "bg-black-deep text-gray-300 border-gold-dark/40"}`}>
          Serviço
        </button>
        {produtos.length > 0 && (
          <button type="button" onClick={() => setTipoItemAtual("PRODUCT")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold border ${tipoItemAtual === "PRODUCT" ? "bg-gold text-black-deep border-gold" : "bg-black-deep text-gray-300 border-gold-dark/40"}`}>
            Produto
          </button>
        )}
        {podeDespesas && (
          <button type="button" onClick={() => setTipoItemAtual("EXPENSE")}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold border ${tipoItemAtual === "EXPENSE" ? "bg-gold text-black-deep border-gold" : "bg-black-deep text-gray-300 border-gold-dark/40"}`}>
            Despesa
          </button>
        )}
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Adicionar item</label>

        {tipoItemAtual === "INCOME" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={categoriaServico} onChange={(e) => handleServicoChange(e.target.value)} className={inputClass}>
              {servicos.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <input type="number" step="0.01" min="0.01" value={valorItem} onChange={(e) => setValorItem(e.target.value)} placeholder="Valor" className={inputClass} />
            <button type="button" onClick={adicionarItem} className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold transition-colors whitespace-nowrap">
              + Adicionar
            </button>
          </div>
        )}

        {tipoItemAtual === "PRODUCT" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} className={inputClass}>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatar(p.price)} ({p.quantidade} em estoque)</option>
                ))}
              </select>
              <button type="button" onClick={() => setMostrarLeitor(true)} className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 hover:bg-gold transition-colors whitespace-nowrap">
                📷
              </button>
            </div>
            <div className="flex gap-2">
              <input type="number" min="1" value={quantidadeProduto} onChange={(e) => setQuantidadeProduto(e.target.value)} placeholder="Quantidade" className={inputClass} />
              <button type="button" onClick={adicionarItem} className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold transition-colors whitespace-nowrap">
                + Adicionar
              </button>
            </div>
          </div>
        )}

        {tipoItemAtual === "EXPENSE" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={categoriaDespesaId} onChange={(e) => setCategoriaDespesaId(e.target.value)} className={inputClass}>
              {categoriasDespesa.length === 0 && <option value="">Nenhuma categoria cadastrada</option>}
              {categoriasDespesa.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" step="0.01" min="0.01" value={valorItem} onChange={(e) => setValorItem(e.target.value)} placeholder="Valor" className={inputClass} />
            <button type="button" onClick={adicionarItem} className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold transition-colors whitespace-nowrap">
              + Adicionar
            </button>
          </div>
        )}
      </div>

      {tipoItemAtual !== "EXPENSE" && role === "OWNER" && (
        <div>
          <label className="text-sm text-gray-400 block mb-1">Barbeiro (para os serviços)</label>
          <select value={barberId} onChange={(e) => setBarberId(e.target.value)} className={inputClass}>
            <option value="">Selecione...</option>
            {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 block mb-1">
          {tipoItemAtual === "EXPENSE" ? "Nome da despesa" : "Cliente"}
        </label>
        <input
          value={tipoItemAtual === "EXPENSE" ? nomeDespesa : clienteNome}
          onChange={(e) => (tipoItemAtual === "EXPENSE" ? setNomeDespesa(e.target.value) : setClienteNome(e.target.value))}
          placeholder={tipoItemAtual === "EXPENSE" ? "Ex: Compra de toalhas" : "Nome do cliente"}
          className={inputClass}
        />
      </div>

      {tipoItemAtual === "EXPENSE" ? (
        <BarraOrcamentoCategoria categoriaId={categoriaDespesaId} />
      ) : (
        <div>
          <label className="text-sm text-gray-400 block mb-1">Observação (opcional)</label>
          <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} placeholder="Alguma observação sobre o atendimento" className={inputClass} />
        </div>
      )}

      {tipoItemAtual === "INCOME" && <CartaoFidelidade clienteNome={clienteNome} />}

      {itens.length > 0 && (
        <div className="flex flex-col gap-2">
          {itens.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-black-deep border border-gold-dark/20 rounded-lg px-3 py-2">
              <span className="text-white text-sm">
                <span className={`mr-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${item.tipo === "INCOME" ? "bg-green-400/20 text-green-400" : "bg-red-400/20 text-red-400"}`}>
                  {item.productId ? "Produto" : item.tipo === "INCOME" ? "Serviço" : "Despesa"}
                </span>
                {item.category}{item.quantidadeProduto ? ` (x${item.quantidadeProduto})` : ""}{item.descricao ? ` (${item.descricao})` : ""} — {formatar(item.amount)}
              </span>
              <button type="button" onClick={() => removerItem(i)} className="text-red-400 text-xs">Remover</button>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-gold-dark/20">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-gold font-bold text-lg">{formatar(total)}</span>
          </div>
        </div>
      )}

      {mostrarFormaPagamento && (
        <div>
          <label className="text-sm text-gray-400 block mb-2">Forma de pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {METODOS_PAGAMENTO.map((m) => (
              <button key={m.valor} type="button" onClick={() => setPaymentMethod(m.valor)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${paymentMethod === m.valor ? "bg-gold text-black-deep border-gold" : "bg-black-deep text-gray-300 border-gold-dark/40 hover:border-gold"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={handleFechar} disabled={carregando || itens.length === 0}
        className="bg-gold text-black-deep font-semibold rounded-lg py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50 mt-2">
        {carregando ? "Fechando..." : `Fechar Comanda${itens.length > 0 ? ` — ${formatar(total)}` : ""}`}
      </button>
      {mensagem && <p className={sucesso ? "text-green-400 text-sm" : "text-red-400 text-sm"}>{mensagem}</p>}

      {mostrarLeitor && (
        <LeitorCodigoBarras onLido={handleLeituraCodigoBarras} onFechar={() => setMostrarLeitor(false)} />
      )}
    </div>
  );
}