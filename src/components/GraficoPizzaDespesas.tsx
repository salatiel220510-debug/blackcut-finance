"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CORES = ["#d4af37", "#9c7a1e", "#60a5fa", "#ef4444", "#34d399", "#a78bfa", "#f472b6"];

export default function GraficoPizzaDespesas({ dados }: { dados: { nome: string; valor: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">Nenhuma despesa categorizada neste mês.</p>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dados}
            dataKey="valor"
            nameKey="nome"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry: any) => entry.name ?? entry.nome}
          >
            {dados.map((_, index) => (
              <Cell key={index} fill={CORES[index % CORES.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #9c7a1e", borderRadius: 8 }}
            labelStyle={{ color: "#d4af37" }}
            formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}