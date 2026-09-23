"use client";
import { useState, useEffect } from "react";
import { fecharCaixa } from "@/app/caixa/sessao/actions";
import { consultarPreviaFechamento } from "@/app/caixa/sessao/preview-actions";
import ComprovanteFechamento from "./ComprovanteFechamento";

type Previa = {
  fundoTroco: number; totalDinheiro: number; totalDigital: number; totalTaxas: number; totalSaidasDinheiro: number;
  totalSangrias: number; totalSuprimentos: number; dinheiroEsperado: number; cartaoEsperado: number;
  clientesAtendidos: number; duracao: string;
};

export default function ModalFecharCaixa({ sessionId, onFechar }: { sessionId: string; onFechar: () => void }) {
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [contagemDinheiro, setContagemDinheiro] = useState("");
  const [contagemCartao, setContagemCartao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [fechado, setFechado] = useState(false);

  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    consultarPreviaFechamento(sessionId).then(setPrevia);
  }, [sessionId]);

  const dinheiroDigitado = parseFloat(contagemDinheiro.replace(",", ".")) || 0;
  const cartaoDigitado = parseFloat(contagemCartao.replace(",", ".")) || 0;
  const diferencaDinheiro = previa ? dinheiroDigitado - previa.dinheiroEsperado : 0;
  const diferencaCartao = previa ? cartaoDigitado - previa.cartaoEsperado : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    const resultado = await fecharCaixa(new FormData(e.currentTarget));
    setCarregando(false);

    if (resultado?.erro) setMensagem(resultado.erro);
    else setFechado(true);
  }

  if (fechado && previa) {
    return (
      <ComprovanteFechamento
        previa={previa}
        contagemDinheiro={dinheiroDigitado}
        contagemCartao={cartaoDigitado}
        diferencaDinheiro={diferencaDinheiro}
        diferencaCartao={diferencaCartao}
        onFechar={() => { onFechar(); window.location.reload(); }}
      />
    );
  }

  if (!previa) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
        <p className="text-gray-300">Calculando...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-8" onClick={onFechar}>
      <div className="bg-black-soft border border-gold rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl text-gold text-center mb-4">Fechar Caixa</h2>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <InfoLinha label="Fundo de troco" valor={formatar(previa.fundoTroco)} />
          <InfoLinha label="Entradas dinheiro" valor={formatar(previa.totalDinheiro)} />
          <InfoLinha label="Pix/cartão (bruto)" valor={formatar(previa.totalDigital)} />
          <InfoLinha label="Taxas descontadas" valor={formatar(previa.totalTaxas)} />
          <InfoLinha label="Saídas em dinheiro" valor={formatar(previa.totalSaidasDinheiro)} />
          <InfoLinha label="Sangrias" valor={formatar(previa.totalSangrias)} />
          <InfoLinha label="Suprimentos" valor={formatar(previa.totalSuprimentos)} />
          <InfoLinha label="Tempo de trabalho" valor={previa.duracao} />
          <InfoLinha label="Clientes atendidos" valor={String(previa.clientesAtendidos)} />
        </div>

        <div className="border border-gold-dark/40 bg-black-deep rounded-lg p-3 mb-4">
          <p className="text-gold text-sm font-semibold mb-1">Dinheiro esperado na gaveta</p>
          <p className="text-white text-lg font-bold">{formatar(previa.dinheiroEsperado)}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-gray-300 block mb-1">Quanto você contou em dinheiro?</label>
            <input name="contagemDinheiro" type="number" step="0.01" min="0" required value={contagemDinheiro} onChange={(e) => setContagemDinheiro(e.target.value)}
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full" />
            {contagemDinheiro && (
              <p className={`text-xs mt-1 ${Math.abs(diferencaDinheiro) < 0.01 ? "text-green-400" : "text-red-400"}`}>
                Diferença: {formatar(diferencaDinheiro)} {diferencaDinheiro > 0 ? "(sobra)" : diferencaDinheiro < 0 ? "(falta)" : "(bateu certinho)"}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-1">Quanto bateu nos comprovantes de Pix/cartão? (valor líquido, já com a taxa descontada)</label>
            <input name="contagemCartao" type="number" step="0.01" min="0" required value={contagemCartao} onChange={(e) => setContagemCartao(e.target.value)}
              className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white w-full" />
            {contagemCartao && (
              <p className={`text-xs mt-1 ${Math.abs(diferencaCartao) < 0.01 ? "text-green-400" : "text-red-400"}`}>
                Diferença: {formatar(diferencaCartao)} {diferencaCartao > 0 ? "(sobra)" : diferencaCartao < 0 ? "(falta)" : "(bateu certinho)"}
              </p>
            )}
          </div>
          <button type="submit" disabled={carregando} className="bg-gold text-black-deep font-semibold rounded-lg py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50">
            {carregando ? "Fechando..." : "Confirmar Fechamento"}
          </button>
          {mensagem && <p className="text-red-400 text-sm text-center">{mensagem}</p>}
        </form>
        <button onClick={onFechar} className="w-full border border-gold-dark rounded-lg py-2 text-gold text-sm mt-2">Cancelar</button>
      </div>
    </div>
  );
}

function InfoLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="border border-gold-dark/20 rounded-lg p-2">
      <p className="text-gray-400 text-[10px]">{label}</p>
      <p className="text-white font-semibold text-sm">{valor}</p>
    </div>
  );
}