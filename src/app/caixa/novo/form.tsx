"use client";
import { useState } from "react";
import { registrarTransacao } from "./actions";

type Barbeiro = { id: string; name: string };

const CATEGORIAS_SERVICO = ["Corte", "Barba", "Sobrancelha", "Combo", "Produto"];
const CATEGORIAS_DESPESA = ["Aluguel", "Insumos", "Contas", "Manutenção", "Outros"];

export default function NovaTransacaoForm({ role, barbeiros }: { role: string; barbeiros: Barbeiro[] }) {
  const [tipo, setTipo] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", tipo);

    const resultado = await registrarTransacao(formData);

    if (resultado?.erro) {
      setMensagem(resultado.erro);
      setSucesso(false);
    } else {
      setSucesso(true);
      setMensagem("Lançamento registrado com sucesso!");
      setTimeout(() => { window.location.href = "/caixa"; }, 800);
    }
  }

  const categorias = tipo === "INCOME" ? CATEGORIAS_SERVICO : CATEGORIAS_DESPESA;

  return (
    <form onSubmit={handleSubmit}>
      {role === "OWNER" && (
        <div>
          <label>Tipo: </label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as "INCOME" | "EXPENSE")}>
            <option value="INCOME">Entrada (serviço)</option>
            <option value="EXPENSE">Saída (despesa)</option>
          </select>
        </div>
      )}

      {tipo === "INCOME" && role === "OWNER" && (
        <div>
          <label>Barbeiro: </label>
          <select name="barberId" required>
            <option value="">Selecione...</option>
            {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label>Categoria: </label>
        <select name="category" required>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label>Valor (R$): </label>
        <input name="amount" type="number" step="0.01" min="0.01" required />
      </div>

      <div>
        <label>Descrição (opcional): </label>
        <input name="description" type="text" />
      </div>

      <button type="submit">Registrar</button>
      {mensagem && <p style={{ color: sucesso ? "green" : "red" }}>{mensagem}</p>}
    </form>
  );
}