"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function GraficoBarraBarbeiros({ dados }: { dados: { nome: string; total: number }[] }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
          <XAxis dataKey="nome" stroke="#9c7a1e" fontSize={12} />
          <YAxis stroke="#9c7a1e" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #9c7a1e", borderRadius: 8 }}
            labelStyle={{ color: "#d4af37" }}
            formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <Bar dataKey="total" name="Faturamento" fill="#d4af37" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}