"use client";
import { useState } from "react";
import { registrarSangria, registrarSuprimento } from "@/app/caixa/sessao/actions";
import ComprovanteMovimento from "./ComprovanteMovimento";

export default function ModalMovimentoCaixa({ tipo, onFechar }: { tipo: "SANGRIA" | "SUPRIMENTO"; onFechar: () => void }) {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [comprovante, setComprovante] = useState<{ valor: number; motivo: string; data: string } | null>(null);

  const titulo = tipo === "SANGRIA" ? "Registrar Sangria" : "Registrar Suprimento";
  const descricao = tipo === "SANGRIA" ? "Retirada de dinheiro do caixa." : "Entrada de dinheiro extra no caixa.";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const formData = new FormData(e.currentTarget);
    const acao = tipo === "SANGRIA" ? registrarSangria : registrarSuprimento;
    const resultado = await acao(formData);
    setCarregando(false);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
    } else {
      setComprovante({
        valor: parseFloat((formData.get("amount") as string).replace(",", ".")),
        motivo: (formData.get("motivo") as string) || "",
        data: new Date().toLocaleString("pt-BR"),
      });
    }
  }

  if (comprovante) {
    return (
      <ComprovanteMovimento
        tipo={tipo}
        valor={comprovante.valor}
        motivo={comprovante.motivo}
        data={comprovante.data}
        onFechar={() => { onFechar(); window.location.reload(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={onFechar}>
      <div className="bg-black-soft border border-gold rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl text-gold text-center mb-1">{titulo}</h2>
        <p className="text-gray-400 text-xs text-center mb-4">{descricao}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-gray-300 block mb-1">Valor (R$)</label>
            <input name="amount" type="number" step="0.01" min="0.01" required
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full" />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-1">Motivo (opcional)</label>
            <input name="motivo" placeholder="Ex: pagamento de fornecedor" maxLength={200}
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full" />
          </div>
          <button type="submit" disabled={carregando} className="bg-gold text-black-deep font-semibold rounded-lg py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50">
            {carregando ? "Registrando..." : "Confirmar"}
          </button>
          {mensagem && <p className="text-red-400 text-sm text-center">{mensagem}</p>}
        </form>
        <button onClick={onFechar} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm mt-2">Cancelar</button>
      </div>
    </div>
  );
}