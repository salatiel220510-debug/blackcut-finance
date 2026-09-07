"use client";
import { useState, useEffect } from "react";
import { consultarCartaoAction, marcarCartaoAction } from "@/app/caixa/comanda/nova/fidelidade-actions";
import LogoBCFinanceSVG from "./LogoBCFinanceSVG";

export default function CartaoFidelidade({ clienteNome }: { clienteNome: string }) {
  const [marcas, setMarcas] = useState(0);
  const [completos, setCompletos] = useState(0);
  const [carregado, setCarregado] = useState(false);
  const [slotAtivo, setSlotAtivo] = useState<number | null>(null);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    setCarregado(false);
    setMensagem("");
    setErro("");

    const nomeTrimado = clienteNome.trim();
    if (!nomeTrimado) {
      setMarcas(0);
      setCompletos(0);
      setCarregado(true);
      return;
    }

    const timeout = setTimeout(async () => {
      const cartao = await consultarCartaoAction(nomeTrimado);
      if (cancelado) return;
      if (cartao) {
        setMarcas(cartao.marcasAtuais);
        setCompletos(cartao.cartoesCompletos);
      }
      setCarregado(true);
    }, 500);

    return () => { cancelado = true; clearTimeout(timeout); };
  }, [clienteNome]);

  async function confirmarMarca(index: number) {
    if (!clienteNome.trim()) {
      setErro("Informe o nome do cliente antes de marcar o cartão.");
      return;
    }
    setErro("");
    const resultado = await marcarCartaoAction(clienteNome, codigoDigitado);

    if ("erro" in resultado) {
      setErro(resultado.erro as string);
      return;
    }

    setMarcas(resultado.cartao.marcasAtuais);
    setCompletos(resultado.cartao.cartoesCompletos);
    setSlotAtivo(null);
    setCodigoDigitado("");

    if (resultado.mostrarMensagem) {
      setMensagem(resultado.completou ? "🎉 Cartão completo! Este corte é por conta da casa." : "🎁 O próximo corte será gratuito!");
    }
  }

  if (!clienteNome.trim()) {
    return <p className="text-gray-500 text-xs">Informe o nome do cliente para ver o cartão fidelidade.</p>;
  }

  return (
    <div className="border border-gold-dark/30 rounded-xl p-4 bg-black-deep">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gold text-sm font-semibold">Cartão Fidelidade</p>
        {carregado && <p className="text-gray-400 text-xs">Completos: {completos}</p>}
      </div>

      {!carregado ? (
        <p className="text-gray-500 text-xs">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {Array.from({ length: 10 }, (_, i) => {
              const marcado = i < marcas;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (!marcado) { setSlotAtivo(i); setCodigoDigitado(""); setErro(""); } }}
                  disabled={marcado}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                    marcado ? "border-gold bg-gold/10" : "border-gold-dark/40 hover:border-gold"
                  }`}
                >
                  {marcado ? <div className="w-6 h-6"><LogoBCFinanceSVG /></div> : <span className="text-gray-600 text-xs">{i + 1}</span>}
                </button>
              );
            })}
          </div>

          {slotAtivo !== null && (
            <div className="flex gap-2 mb-2">
              <input
                autoFocus
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value)}
                placeholder='Digite "bc" para confirmar'
                className="flex-1 bg-black-soft border border-gold-dark/40 rounded-lg px-3 py-1.5 text-white text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmarMarca(slotAtivo); } }}
              />
              <button type="button" onClick={() => confirmarMarca(slotAtivo)} className="bg-gold text-black-deep text-sm font-semibold rounded-lg px-3">OK</button>
              <button type="button" onClick={() => setSlotAtivo(null)} className="text-gray-400 text-sm px-2">×</button>
            </div>
          )}

          {mensagem && <p className="text-gold text-sm font-semibold">{mensagem}</p>}
          {erro && <p className="text-red-400 text-xs">{erro}</p>}
        </>
      )}
    </div>
  );
}