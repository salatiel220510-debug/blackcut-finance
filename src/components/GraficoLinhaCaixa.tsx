"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Ponto = { dia: string; entradas: number; saidas: number; comissao?: number };

export default function GraficoLinhaCaixa({ dados, mostrarComissao }: { dados: Ponto[]; mostrarComissao?: boolean }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
          <XAxis dataKey="dia" stroke="#9c7a1e" fontSize={12} />
          <YAxis stroke="#9c7a1e" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #9c7a1e", borderRadius: 8 }}
            labelStyle={{ color: "#d4af37" }}
            formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          />
          <Legend />
          <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#d4af37" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#ef4444" strokeWidth={2} dot={false} />
          {mostrarComissao && (
            <Line type="monotone" dataKey="comissao" name="Comissão" stroke="#60a5fa" strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}