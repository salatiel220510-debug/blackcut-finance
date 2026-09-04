"use client";
import { useState } from "react";

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function paraStringISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function gerarDiasDoMes(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes, 1);
  const diaSemanaPrimeiro = (primeiroDia.getDay() + 6) % 7;
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasMesAnterior = new Date(ano, mes, 0).getDate();

  const celulas: { dia: number; atual: boolean; data: Date }[] = [];

  for (let i = diaSemanaPrimeiro; i > 0; i--) {
    const dia = diasMesAnterior - i + 1;
    celulas.push({ dia, atual: false, data: new Date(ano, mes - 1, dia) });
  }
  for (let dia = 1; dia <= diasNoMes; dia++) {
    celulas.push({ dia, atual: true, data: new Date(ano, mes, dia) });
  }
  let diaProximo = 1;
  while (celulas.length % 7 !== 0) {
    celulas.push({ dia: diaProximo, atual: false, data: new Date(ano, mes + 1, diaProximo) });
    diaProximo++;
  }
  return celulas;
}

export default function Calendario({
  valorSelecionado,
  onSelecionar,
}: {
  valorSelecionado: Date | null;
  onSelecionar: (data: Date) => void;
}) {
  const inicial = valorSelecionado ?? new Date();
  const [mesVisualizado, setMesVisualizado] = useState(inicial.getMonth());
  const [anoVisualizado, setAnoVisualizado] = useState(inicial.getFullYear());

  const celulas = gerarDiasDoMes(anoVisualizado, mesVisualizado);

  function irParaMesAnterior() {
    if (mesVisualizado === 0) { setMesVisualizado(11); setAnoVisualizado(anoVisualizado - 1); }
    else setMesVisualizado(mesVisualizado - 1);
  }
  function irParaProximoMes() {
    if (mesVisualizado === 11) { setMesVisualizado(0); setAnoVisualizado(anoVisualizado + 1); }
    else setMesVisualizado(mesVisualizado + 1);
  }

  function ehSelecionado(data: Date) {
    return valorSelecionado != null && paraStringISO(data) === paraStringISO(valorSelecionado);
  }
  function ehHoje(data: Date) {
    return paraStringISO(data) === paraStringISO(new Date());
  }

  return (
    <div className="bg-black-soft border border-gold-dark/40 rounded-2xl p-4 w-72 shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={irParaMesAnterior} className="text-gold-dark hover:text-gold text-lg px-2">‹</button>
        <p className="text-white font-semibold text-sm">{MESES[mesVisualizado]} {anoVisualizado}</p>
        <button type="button" onClick={irParaProximoMes} className="text-gold-dark hover:text-gold text-lg px-2">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[10px] text-gray-500 font-semibold">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celulas.map((celula, i) => (
          <button
            type="button"
            key={i}
            onClick={() => onSelecionar(celula.data)}
            className={`aspect-square rounded-full text-xs flex items-center justify-center transition-colors ${
              !celula.atual
                ? "text-gray-700"
                : ehSelecionado(celula.data)
                ? "bg-gold text-black-deep font-bold"
                : ehHoje(celula.data)
                ? "border border-gold text-gold"
                : "text-gray-200 hover:bg-gold/10"
            }`}
          >
            {celula.dia}
          </button>
        ))}
      </div>
    </div>
  );
}