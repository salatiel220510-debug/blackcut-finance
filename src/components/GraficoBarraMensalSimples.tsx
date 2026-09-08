"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function GraficoBarraMensalSimples({
  dados,
  chaveValor,
  nomeSerie,
  cor = "#C41E3A",
}: {
  dados: Record<string, any>[];
  chaveValor: string;
  nomeSerie: string;
  cor?: string;
}) {
  return (
    <div className="w-full h-56">
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
          <Bar dataKey={chaveValor} name={nomeSerie} fill={cor} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}