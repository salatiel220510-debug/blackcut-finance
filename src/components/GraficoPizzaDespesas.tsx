"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CORES = ["#C41E3A", "#8B0D1A", "#F5F2ED", "#5C0912", "#A89792", "#E8394F", "#7D6D69"];

export default function GraficoPizzaDespesas({ dados }: { dados: { nome: string; valor: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">Nenhuma despesa categorizada neste mês.</p>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={dados} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label={(entry) => entry.payload.nome}>
            {dados.map((_, index) => (
              <Cell key={index} fill={CORES[index % CORES.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#150a0b", border: "1px solid #5C0912", borderRadius: 8 }}
            labelStyle={{ color: "#C41E3A" }}
            formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}