"use client";

const PAGAMENTO_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro", PIX: "Pix", CARTAO_DEBITO: "Cartão de Débito", CARTAO_CREDITO: "Cartão de Crédito",
};

export default function CupomComanda({
  tipo = "venda",
  itens, total, paymentMethod, clienteNome, barberNome, data, onFechar,
}: {
  tipo?: "venda" | "despesa";
  itens: { category: string; amount: number }[];
  total: number;
  paymentMethod: string | null;
  clienteNome: string | null;
  barberNome: string | null;
  data: string;
  onFechar: () => void;
}) {
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={onFechar}>
      <div className="bg-white text-black rounded-2xl p-6 max-w-xs w-full font-mono text-xs" onClick={(e) => e.stopPropagation()}>
        <p className="text-center font-bold mb-1">BLACKCUT BARBER</p>
        <p className="text-center text-gray-500 mb-3">{new Date(data).toLocaleString("pt-BR")}</p>
        <p className="text-center mb-2">{tipo === "despesa" ? "Comprovante de Despesa" : "Comprovante de Venda"}</p>

        {clienteNome && <p className="mb-1">{tipo === "despesa" ? "Despesa" : "Cliente"}: {clienteNome}</p>}
        {barberNome && <p className="mb-2">{tipo === "despesa" ? "Registrado por" : "Atendido por"}: {barberNome}</p>}

        <div className="border-t border-dashed border-gray-400 pt-2 flex flex-col gap-1">
          {itens.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.category}</span>
              <span>{formatar(item.amount)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 mt-2 pt-2 flex justify-between font-bold text-sm">
          <span>Total</span>
          <span>{formatar(total)}</span>
        </div>

        {paymentMethod && <p className="mt-2">Pagamento: {PAGAMENTO_LABEL[paymentMethod] ?? paymentMethod}</p>}
        {tipo === "venda" && <p className="text-center text-gray-500 mt-4">Obrigado pela preferência!</p>}

        <button onClick={onFechar} className="w-full bg-black text-white rounded-lg py-2 text-sm mt-4">Fechar</button>
      </div>
    </div>
  );
}