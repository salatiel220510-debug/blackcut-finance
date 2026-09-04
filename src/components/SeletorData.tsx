"use client";
import { useRouter } from "next/navigation";
import SeletorDataPopover from "./SeletorDataPopover";

export default function SeletorData({ dataAtual }: { dataAtual: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <SeletorDataPopover valor={dataAtual} onChange={(novaData) => router.push(`/caixa?data=${novaData}`)} />
      <button onClick={() => router.push("/caixa")} className="text-gold text-sm underline whitespace-nowrap">
        Hoje
      </button>
    </div>
  );
}