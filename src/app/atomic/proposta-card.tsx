"use client";
import { useState } from "react";
import CartaoFidelidade from "@/components/CartaoFidelidade";
import { cancelarProposta, confirmarProposta } from "./actions";
import type { PropostaView } from "@/lib/atomic/tipos";

const inputClass = "bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm w-full disabled:opacity-60";

const TITULO = {
  SERVICO: "Novo serviço",
  PRODUTO: "Novo produto",
  DESPESA: "Nova despesa",
  FIDELIDADE: "Cartão fidelidade",
} as const;

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-gray-400 text-xs block mb-1">{rotulo}</span>
      {children}
    </label>
  );
}

// O nome do cliente é digitado AQUI, no navegador, e consultado direto no seu banco.
// Ele nunca é enviado à IA.
function PainelFidelidade() {
  const [nome, setNome] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <Campo rotulo="Nome do cliente (digitado aqui; não é enviado à IA)">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" className={inputClass} />
      </Campo>
      <CartaoFidelidade clienteNome={nome} />
    </div>
  );
}

export default function PropostaCard({ proposta }: { proposta: PropostaView }) {
  const [status, setStatus] = useState(proposta.status);
  const [valores, setValores] = useState<Record<string, string>>(proposta.dados);
  const [resultado, setResultado] = useState(proposta.resultado);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const aberta = status === "PENDENTE" && !proposta.expirada;
  const alterar = (campo: string, valor: string) => setValores((v) => ({ ...v, [campo]: valor }));

  async function confirmar() {
    setErro("");
    setEnviando(true);
    try {
      const r = await confirmarProposta(proposta.id, valores);
      if (r.erro) setErro(r.erro);
      else {
        setStatus("CONFIRMADA");
        setResultado(r.mensagem ?? "Concluído.");
      }
    } catch {
      setErro("Falha de comunicação com o servidor. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    setEnviando(true);
    try {
      await cancelarProposta(proposta.id);
      setStatus("CANCELADA");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="w-full border border-gold/40 bg-black-deep rounded-xl p-3">
      <p className="text-gold text-sm font-semibold">{TITULO[proposta.tipo]}</p>
      <p className="text-gray-500 text-[11px] mb-3">
        {proposta.tipo === "FIDELIDADE" ? "Digite o nome e clique em um círculo vazio para marcar." : "Revise os campos. Nada é gravado até você confirmar."}
      </p>

      {proposta.tipo === "FIDELIDADE" && <PainelFidelidade />}

      {proposta.tipo === "SERVICO" && (
        <div className="flex flex-col gap-2">
          <Campo rotulo="Nome do serviço">
            <input value={valores.nome ?? ""} onChange={(e) => alterar("nome", e.target.value)} disabled={!aberta} maxLength={60} className={inputClass} />
          </Campo>
          <Campo rotulo="Preço em R$ (opcional)">
            <input value={valores.preco ?? ""} onChange={(e) => alterar("preco", e.target.value)} disabled={!aberta} inputMode="decimal" className={inputClass} />
          </Campo>
        </div>
      )}

      {proposta.tipo === "PRODUTO" && (
        <div className="flex flex-col gap-2">
          <Campo rotulo="Nome do produto">
            <input value={valores.nome ?? ""} onChange={(e) => alterar("nome", e.target.value)} disabled={!aberta} maxLength={80} className={inputClass} />
          </Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo rotulo="Preço de venda (R$)">
              <input value={valores.preco ?? ""} onChange={(e) => alterar("preco", e.target.value)} disabled={!aberta} inputMode="decimal" className={inputClass} />
            </Campo>
            <Campo rotulo="Estoque inicial">
              <input value={valores.quantidade ?? ""} onChange={(e) => alterar("quantidade", e.target.value)} disabled={!aberta} inputMode="numeric" className={inputClass} />
            </Campo>
          </div>
          <Campo rotulo="Código de barras (opcional)">
            <input value={valores.codigo_barras ?? ""} onChange={(e) => alterar("codigo_barras", e.target.value)} disabled={!aberta} maxLength={50} className={inputClass} />
          </Campo>
        </div>
      )}

      {proposta.tipo === "DESPESA" && (
        <div className="flex flex-col gap-2">
          <Campo rotulo="Valor (R$)">
            <input value={valores.valor ?? ""} onChange={(e) => alterar("valor", e.target.value)} disabled={!aberta} inputMode="decimal" className={inputClass} />
          </Campo>
          <Campo rotulo="Categoria">
            <select value={valores.categoria_id ?? ""} onChange={(e) => alterar("categoria_id", e.target.value)} disabled={!aberta} className={inputClass}>
              <option value="">Selecione...</option>
              {(proposta.categorias ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Descrição (opcional)">
            <input value={valores.descricao ?? ""} onChange={(e) => alterar("descricao", e.target.value)} disabled={!aberta} maxLength={200} className={inputClass} />
          </Campo>
        </div>
      )}

      {proposta.tipo !== "FIDELIDADE" && (
        <>
          {aberta && (
            <div className="flex gap-2 mt-3">
              <button onClick={cancelar} disabled={enviando} className="flex-1 border border-gold-dark rounded-lg py-2 text-gray-300 text-sm disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmar} disabled={enviando} className="flex-1 bg-gold text-black-deep font-semibold rounded-lg py-2 text-sm hover:bg-gold-light transition-colors disabled:opacity-50">
                {enviando ? "Gravando..." : "Confirmar"}
              </button>
            </div>
          )}
          {erro && <p className="text-red-400 text-xs mt-2">{erro}</p>}
          {status === "CONFIRMADA" && <p className="text-green-400 text-xs mt-3">✓ {resultado}</p>}
          {status === "CANCELADA" && <p className="text-gray-500 text-xs mt-3">Formulário cancelado.</p>}
          {status === "PENDENTE" && proposta.expirada && (
            <p className="text-gray-500 text-xs mt-3">Este formulário expirou. Peça novamente à ATOMIC.</p>
          )}
        </>
      )}
    </div>
  );
}