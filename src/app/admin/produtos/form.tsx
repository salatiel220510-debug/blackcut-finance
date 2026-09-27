"use client";
import { useState } from "react";
import { criarProduto, excluirProduto } from "./actions";
import LeitorCodigoBarras from "@/components/LeitorCodigoBarras";
import ModalVendasProduto from "./ModalVendasProduto";

type Produto = { id: string; name: string; barcode: string | null; price: number; quantidade: number; vendidos: number };

const inputClass = "bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full";

export default function FormProdutos({ produtos }: { produtos: Produto[] }) {
  const [mensagem, setMensagem] = useState("");
  const [barcode, setBarcode] = useState("");
  const [mostrarLeitor, setMostrarLeitor] = useState(false);
  const [produtoVendas, setProdutoVendas] = useState<Produto | null>(null);

  async function handleNovoProduto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("barcode", barcode);
    const resultado = await criarProduto(formData);
    if (resultado?.erro) setMensagem(resultado.erro);
    else window.location.reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
        <h2 className="font-display text-lg text-gold mb-4">Produtos Registrados</h2>
        {produtos.length === 0 && <p className="text-gray-400 text-sm">Nenhum produto cadastrado ainda.</p>}
        <div className="flex flex-col gap-3">
          {produtos.map((p) => (
            <div key={p.id} className="border border-gold-dark/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-white">{p.name}</strong>
                <span className="text-gold font-bold">{p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400 mb-3 flex-wrap">
                <span>Em estoque: <span className="text-white font-semibold">{p.quantidade}</span></span>
                <span>Vendidos: <span className="text-white font-semibold">{p.vendidos}</span></span>
                {p.barcode && <span>Código: <span className="text-white font-semibold">{p.barcode}</span></span>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setProdutoVendas(p)} className="text-gold text-xs underline">Ver vendas / cupons</button>
                <button
                  onClick={async () => { if (confirm(`Remover "${p.name}" do catálogo?`)) { await excluirProduto(p.id); window.location.reload(); } }}
                  className="text-red-400 text-xs underline"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-gold-dark/40 bg-black-soft rounded-xl p-5">
        <h2 className="font-display text-lg text-gold mb-4">Registrar Produto</h2>
        <form onSubmit={handleNovoProduto} className="flex flex-col gap-3">
          <input name="name" placeholder="Nome do produto" required className={inputClass} />
          <div className="flex gap-2">
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Código de barras (opcional)"
              className={inputClass}
            />
            <button type="button" onClick={() => setMostrarLeitor(true)} className="bg-gold-dark text-black-deep font-semibold rounded-lg px-4 hover:bg-gold transition-colors whitespace-nowrap">
              📷 Ler
            </button>
          </div>
          <input name="price" type="number" step="0.01" min="0.01" placeholder="Valor (R$)" required className={inputClass} />
          <input name="quantidade" type="number" min="0" placeholder="Quantidade em estoque" required className={inputClass} />
          <button type="submit" className="bg-gold text-black-deep font-semibold rounded-lg px-4 py-2 hover:bg-gold-light transition-colors">
            Registrar
          </button>
          {mensagem && <p className="text-red-400 text-sm">{mensagem}</p>}
        </form>
      </section>

      {mostrarLeitor && (
        <LeitorCodigoBarras
          onLido={(codigo) => { setBarcode(codigo); setMostrarLeitor(false); }}
          onFechar={() => setMostrarLeitor(false)}
        />
      )}

      {produtoVendas && (
        <ModalVendasProduto produtoId={produtoVendas.id} produtoNome={produtoVendas.name} onFechar={() => setProdutoVendas(null)} />
      )}
    </div>
  );
}