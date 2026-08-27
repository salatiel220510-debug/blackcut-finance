"use client";
import { useRouter } from "next/navigation";

export default function SeletorData({ dataAtual }: { dataAtual: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={dataAtual}
        onChange={(e) => router.push(`/caixa?data=${e.target.value}`)}
        className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white"
      />
      <button onClick={() => router.push("/caixa")} className="text-gold text-sm underline whitespace-nowrap">
        Hoje
      </button>
    </div>
  );
}