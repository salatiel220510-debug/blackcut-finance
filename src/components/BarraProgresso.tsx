export default function BarraProgresso({ label, valor, meta }: { label: string; valor: number; meta: number | null }) {
  const formatar = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const percentual = meta && meta > 0 ? Math.min((valor / meta) * 100, 100) : null;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">
          {formatar(valor)}{meta ? ` / ${formatar(meta)}` : " (sem meta definida)"}
        </span>
      </div>
      <div className="w-full bg-black-deep rounded-full h-2.5 overflow-hidden border border-gold-dark/20">
        <div className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all" style={{ width: `${percentual ?? 0}%` }} />
      </div>
    </div>
  );
}