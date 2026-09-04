"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Ponto = { mes: string; servicos: number; gastos: number };

export default function GraficoComparacaoGastosServicos({ dados }: { dados: Ponto[] }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a1518" />
          <XAxis dataKey="mes" stroke="#A89792" fontSize={12} />
          <YAxis stroke="#A89792" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#150a0b", border: "1px solid #5C0912", borderRadius: 8 }}
            labelStyle={{ color: "#C41E3A" }}
            formatter={(value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <Legend />
          <Bar dataKey="servicos" name="Serviços" fill="#C41E3A" radius={[6, 6, 0, 0]} />
          <Bar dataKey="gastos" name="Gastos" fill="#F5F2ED" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}