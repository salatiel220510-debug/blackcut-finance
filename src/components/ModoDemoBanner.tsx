import { estaEmModoDemo } from "@/lib/demoGuard";
import BotaoSairDemo from "./BotaoSairDemo";

export default async function ModoDemoBanner() {
  const ativo = await estaEmModoDemo();
  if (!ativo) return null;

  return (
    <div className="bg-gold text-black-deep text-sm font-semibold px-4 py-2 flex items-center justify-between sticky top-0 z-50">
      <span>🧪 MODO DEMO ATIVO — nada aqui afeta os dados reais</span>
      <BotaoSairDemo />
    </div>
  );
}