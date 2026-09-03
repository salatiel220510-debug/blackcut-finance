"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Ponto = { mes: string; faturamento: number; despesas: number; lucro: number };

export default function GraficoEvolucaoMensal({ dados }: { dados: Ponto[] }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a1518" />
          <XAxis dataKey="mes" stroke="#A89792" fontSize={12} />
          <YAxis stroke="#A89792" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#150a0b", border: "1px solid #5C0912", borderRadius: 8 }}
            labelStyle={{ color: "#C41E3A" }}
            formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <Legend />
          <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#C41E3A" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#F5F2ED" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#7D6D69" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}