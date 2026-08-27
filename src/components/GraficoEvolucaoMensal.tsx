"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Ponto = { mes: string; faturamento: number; despesas: number; lucro: number };

export default function GraficoEvolucaoMensal({ dados }: { dados: Ponto[] }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
          <XAxis dataKey="mes" stroke="#9c7a1e" fontSize={12} />
          <YAxis stroke="#9c7a1e" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #9c7a1e", borderRadius: 8 }}
            labelStyle={{ color: "#d4af37" }}
            formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <Legend />
          <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#d4af37" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#60a5fa" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}