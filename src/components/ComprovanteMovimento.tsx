"use client";

export default function ComprovanteMovimento({
  tipo, valor, motivo, data, onFechar,
}: {
  tipo: "SANGRIA" | "SUPRIMENTO";
  valor: number;
  motivo: string;
  data: string;
  onFechar: () => void;
}) {
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-white text-black rounded-2xl p-6 max-w-xs w-full font-mono text-sm">
        <p className="text-center font-bold mb-1">BLACKCUT FINANCE</p>
        <p className="text-center text-xs mb-3">Comprovante de {tipo === "SANGRIA" ? "Sangria" : "Suprimento"}</p>
        <div className="border-t border-b border-dashed border-gray-400 py-3 my-2 flex flex-col gap-1">
          <div className="flex justify-between"><span>Tipo:</span><span>{tipo === "SANGRIA" ? "Retirada" : "Entrada"}</span></div>
          <div className="flex justify-between"><span>Valor:</span><span className="font-bold">{formatar(valor)}</span></div>
          {motivo && <div className="flex justify-between gap-2"><span>Motivo:</span><span className="text-right">{motivo}</span></div>}
          <div className="flex justify-between"><span>Data:</span><span>{data}</span></div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">Guarde este comprovante para conferência do fechamento.</p>
        <button onClick={onFechar} className="w-full bg-black text-white rounded-lg py-2 text-sm mt-4">Fechar</button>
      </div>
    </div>
  );
}