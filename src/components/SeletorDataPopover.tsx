"use client";
import { useState, useRef, useEffect } from "react";
import Calendario, { paraStringISO } from "./Calendario";

export default function SeletorDataPopover({
  valor,
  onChange,
  placeholder = "Selecionar data",
}: {
  valor: string;
  onChange: (valorISO: string) => void;
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const dataSelecionada = valor ? new Date(valor + "T12:00:00") : null;
  const textoExibido = dataSelecionada ? dataSelecionada.toLocaleDateString("pt-BR") : placeholder;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm text-left w-full"
      >
        {textoExibido}
      </button>

      {aberto && (
        <div className="absolute z-50 mt-2">
          <Calendario
            valorSelecionado={dataSelecionada}
            onSelecionar={(data) => {
              onChange(paraStringISO(data));
              setAberto(false);
            }}
          />
        </div>
      )}
    </div>
  );
}