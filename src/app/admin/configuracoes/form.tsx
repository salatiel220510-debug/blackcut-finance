"use client";
import { useState } from "react";
import { atualizarComissao, criarServico, atualizarServico, desativarServico } from "./actions";

type Servico = { id: string; name: string; price: number | null; active: boolean };

export default function ConfiguracoesForm({ comissaoAtual, servicos }: { comissaoAtual: number; servicos: Servico[] }) {
  const [mensagem, setMensagem] = useState("");

  async function handleComissao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = await atualizarComissao(new FormData(e.currentTarget));
    setMensagem(resultado?.erro || "Comissão atualizada com sucesso!");
  }

  async function handleNovoServico(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = await criarServico(new FormData(e.currentTarget));
    if (resultado?.erro) setMensagem(resultado.erro);
    else window.location.reload();
  }

  return (
    <div>
      <section style={{ marginBottom: 32 }}>
        <h2>Percentual de Comissão</h2>
        <form onSubmit={handleComissao}>
          <input name="commissionPercentage" type="number" step="0.01" min="0" max="100" defaultValue={comissaoAtual} required />
          <button type="submit">Salvar</button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Serviços e Preços</h2>
        <ul>
          {servicos.filter((s) => s.active).map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <strong>{s.name}</strong> —{" "}
              <form
                style={{ display: "inline" }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  await atualizarServico(s.id, new FormData(e.currentTarget));
                  window.location.reload();
                }}
              >
                <input name="price" type="number" step="0.01" min="0" defaultValue={s.price ?? ""} placeholder="Sem preço fixo" style={{ width: 100 }} />
                <button type="submit">Atualizar</button>
              </form>
              <button onClick={async () => { await desativarServico(s.id); window.location.reload(); }} style={{ marginLeft: 8 }}>
                Remover
              </button>
            </li>
          ))}
        </ul>

        <h3>Adicionar novo serviço</h3>
        <form onSubmit={handleNovoServico}>
          <input name="name" placeholder="Nome do serviço" required />
          <input name="price" type="number" step="0.01" min="0" placeholder="Preço (opcional)" />
          <button type="submit">Adicionar</button>
        </form>
      </section>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}