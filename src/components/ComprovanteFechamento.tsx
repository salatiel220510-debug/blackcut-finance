"use client";

type Previa = {
  fundoTroco: number; totalDinheiro: number; totalDigital: number; totalSaidasDinheiro: number;
  totalSangrias: number; totalSuprimentos: number; dinheiroEsperado: number; cartaoEsperado: number;
  clientesAtendidos: number; duracao: string;
};

export default function ComprovanteFechamento({
  previa, contagemDinheiro, contagemCartao, diferencaDinheiro, diferencaCartao, onFechar,
}: {
  previa: Previa;
  contagemDinheiro: number;
  contagemCartao: number;
  diferencaDinheiro: number;
  diferencaCartao: number;
  onFechar: () => void;
}) {
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-8">
      <div className="bg-white text-black rounded-2xl p-6 max-w-xs w-full font-mono text-xs max-h-[85vh] overflow-y-auto">
        <p className="text-center font-bold mb-1">BLACKCUT FINANCE</p>
        <p className="text-center mb-3">Fechamento de Caixa</p>
        <p className="text-center text-gray-500 mb-3">{new Date().toLocaleString("pt-BR")}</p>

        <div className="border-t border-dashed border-gray-400 pt-2 flex flex-col gap-1">
          <Linha label="Tempo de trabalho" valor={previa.duracao} />
          <Linha label="Clientes atendidos" valor={String(previa.clientesAtendidos)} />
        </div>

        <div className="border-t border-dashed border-gray-400 mt-2 pt-2 flex flex-col gap-1">
          <Linha label="Fundo de troco" valor={formatar(previa.fundoTroco)} />
          <Linha label="Entradas dinheiro" valor={formatar(previa.totalDinheiro)} />
          <Linha label="Saídas dinheiro" valor={formatar(previa.totalSaidasDinheiro)} />
          <Linha label="Sangrias" valor={formatar(previa.totalSangrias)} />
          <Linha label="Suprimentos" valor={formatar(previa.totalSuprimentos)} />
        </div>

        <div className="border-t border-dashed border-gray-400 mt-2 pt-2 flex flex-col gap-1">
          <Linha label="Dinheiro esperado" valor={formatar(previa.dinheiroEsperado)} />
          <Linha label="Dinheiro contado" valor={formatar(contagemDinheiro)} />
          <Linha label="Diferença" valor={formatar(diferencaDinheiro)} destaque={Math.abs(diferencaDinheiro) >= 0.01} />
        </div>

        <div className="border-t border-dashed border-gray-400 mt-2 pt-2 flex flex-col gap-1">
          <Linha label="Pix/cartão esperado" valor={formatar(previa.cartaoEsperado)} />
          <Linha label="Pix/cartão contado" valor={formatar(contagemCartao)} />
          <Linha label="Diferença" valor={formatar(diferencaCartao)} destaque={Math.abs(diferencaCartao) >= 0.01} />
        </div>

        <button onClick={onFechar} className="w-full bg-black text-white rounded-lg py-2 text-sm mt-4">Fechar</button>
      </div>
    </div>
  );
}

function Linha({ label, valor, destaque }: { label: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`flex justify-between ${destaque ? "font-bold text-red-600" : ""}`}>
      <span>{label}:</span>
      <span>{valor}</span>
    </div>
  );
}