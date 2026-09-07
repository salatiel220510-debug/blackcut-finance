"use client";
import { useState } from "react";
import { editarCartaoFidelidade, excluirCartaoFidelidade } from "./actions";
import LogoBCFinanceSVG from "@/components/LogoBCFinanceSVG";

type Cartao = { id: string; clienteNome: string; marcasAtuais: number; cartoesCompletos: number };

export default function TabelaFidelidade({ cartoes }: { cartoes: Cartao[] }) {
  const [expandido, setExpandido] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {cartoes.map((c) => (
        <LinhaCartao key={c.id} cartao={c} expandido={expandido === c.id} onToggle={() => setExpandido(expandido === c.id ? null : c.id)} />
      ))}
    </div>
  );
}

function LinhaCartao({ cartao, expandido, onToggle }: { cartao: Cartao; expandido: boolean; onToggle: () => void }) {
  const [editando, setEditando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleEditar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = await editarCartaoFidelidade(cartao.id, new FormData(e.currentTarget));
    if (resultado?.erro) setMensagem(resultado.erro);
    else { setMensagem(""); setEditando(false); }
  }

  async function handleExcluir() {
    if (!confirm(`Excluir o cartão fidelidade de ${cartao.clienteNome}? Essa ação não pode ser desfeita.`)) return;
    await excluirCartaoFidelidade(cartao.id);
  }

  return (
    <div className="border border-gold-dark/40 bg-black-soft rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onToggle} className="text-left"><strong className="text-white">{cartao.clienteNome}</strong></button>
        <div className="flex gap-2">
          <button onClick={() => setEditando(!editando)} className="text-gold text-xs underline">Editar</button>
          <button onClick={handleExcluir} className="text-red-400 text-xs underline">Excluir</button>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-gray-400 mb-2">
        <span>Marcas: <span className="text-white">{cartao.marcasAtuais}/10</span></span>
        <span>Cartões completos: <span className="text-gold">{cartao.cartoesCompletos}</span></span>
      </div>

      {expandido && (
        <div className="grid grid-cols-5 gap-1.5 mt-2 mb-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`w-8 h-8 rounded-full border flex items-center justify-center ${i < cartao.marcasAtuais ? "border-gold bg-gold/10" : "border-gold-dark/30"}`}>
              {i < cartao.marcasAtuais && <div className="w-5 h-5"><LogoBCFinanceSVG /></div>}
            </div>
          ))}
        </div>
      )}

      {editando && (
        <form onSubmit={handleEditar} className="flex gap-2 mt-2">
          <input name="marcasAtuais" type="number" min="0" max="9" defaultValue={cartao.marcasAtuais} className="bg-black-deep border border-gold-dark/40 rounded-lg px-2 py-1 text-white text-sm w-20" />
          <input name="cartoesCompletos" type="number" min="0" defaultValue={cartao.cartoesCompletos} className="bg-black-deep border border-gold-dark/40 rounded-lg px-2 py-1 text-white text-sm w-20" />
          <button type="submit" className="bg-gold text-black-deep text-xs font-semibold rounded-lg px-3">Salvar</button>
        </form>
      )}
      {mensagem && <p className="text-red-400 text-xs mt-1">{mensagem}</p>}
    </div>
  );
}