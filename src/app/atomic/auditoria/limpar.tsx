"use client";
import { useState } from "react";
import { limparRegistrosAntigos } from "./actions";

export default function BotaoLimpar() {
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function limpar() {
    if (!confirm("Apagar conversas, consultas e formulários da ATOMIC com mais de 90 dias? Essa ação não pode ser desfeita.")) return;
    setCarregando(true);
    try {
      const r = await limparRegistrosAntigos();
      if ("erro" in r) setMensagem(r.erro ?? "Não foi possível limpar.");
      else setMensagem(`Removidos: ${r.conversas} conversa(s), ${r.consultas} consulta(s) e ${r.formularios} formulário(s).`);
    } catch {
      setMensagem("Falha de comunicação com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <button
        onClick={limpar}
        disabled={carregando}
        className="border border-red-500 text-red-400 text-sm font-semibold rounded-lg px-4 py-2 hover:bg-red-500 hover:text-black-deep transition-colors disabled:opacity-50"
      >
        {carregando ? "Apagando..." : "Apagar registros com mais de 90 dias"}
      </button>
      {mensagem && <p className="text-gray-300 text-xs">{mensagem}</p>}
    </div>
  );
}