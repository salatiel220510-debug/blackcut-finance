import { prisma } from "@/lib/prisma";
import { criarServico } from "@/app/admin/configuracoes/actions";
import { criarProduto } from "@/app/admin/produtos/actions";
import { registrarComanda } from "@/app/caixa/comanda/nova/actions";
import type { TipoProposta } from "../../lib/atomic/tipos";

// ─────────────────────────────────────────────────────────────────────────────
// Este arquivo é chamado SOMENTE depois que a PESSOA clicou em "Confirmar".
// A IA nunca chega aqui. Cada execução passa pelas funções que o próprio site
// já usa (criarServico, criarProduto, registrarComanda), que reconferem o login,
// as permissões, o modo demo e todas as regras de negócio existentes.
// ─────────────────────────────────────────────────────────────────────────────

export type ResultadoExecucao = { ok: boolean; mensagem: string };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// As funções existentes devolvem { erro } ou { sucesso, demo }. Padroniza a resposta.
function traduzir(retorno: unknown, mensagemSucesso: string): ResultadoExecucao {
  const r = (retorno ?? {}) as { erro?: string; demo?: boolean };
  if (r.erro) return { ok: false, mensagem: r.erro };
  if (r.demo) return { ok: true, mensagem: "Simulado (Modo Demo ativo): nada foi gravado." };
  return { ok: true, mensagem: mensagemSucesso };
}

export async function executarProposta(tipo: TipoProposta, v: Record<string, string>): Promise<ResultadoExecucao> {
  try {
    switch (tipo) {
      case "SERVICO": {
        const dados = new FormData();
        dados.set("name", v.nome ?? "");
        dados.set("price", v.preco ?? "");
        return traduzir(await criarServico(dados), `Serviço “${(v.nome ?? "").trim()}” cadastrado com sucesso.`);
      }

      case "PRODUTO": {
        const dados = new FormData();
        dados.set("name", v.nome ?? "");
        dados.set("price", v.preco ?? "");
        dados.set("quantidade", v.quantidade ?? "0");
        dados.set("barcode", v.codigo_barras ?? "");
        return traduzir(await criarProduto(dados), `Produto “${(v.nome ?? "").trim()}” cadastrado com sucesso.`);
      }

      case "DESPESA": {
        const valor = Number((v.valor ?? "").replace(",", "."));
        if (!Number.isFinite(valor) || valor <= 0) return { ok: false, mensagem: "Informe um valor maior que zero." };

        const categoria = await prisma.expenseCategory.findFirst({ where: { id: v.categoria_id ?? "", active: true } });
        if (!categoria) return { ok: false, mensagem: "Selecione uma categoria de despesa válida." };

        const retorno = await registrarComanda({
          itens: [
            {
              tipo: "EXPENSE",
              category: categoria.name,
              amount: Number(valor.toFixed(2)),
              expenseCategoryId: categoria.id,
              descricao: v.descricao?.trim() || undefined,
            },
          ],
        });
        return traduzir(retorno, `Despesa de ${brl(valor)} registrada em “${categoria.name}”.`);
      }

      default:
        return { ok: false, mensagem: "Este tipo de formulário não precisa de confirmação." };
    }
  } catch (e) {
    console.error("[atomic] erro ao executar proposta:", e);
    const msg = e instanceof Error ? e.message : "";
    // Mensagens de permissão das funções existentes já são claras para o usuário.
    if (/acesso negado|permiss/i.test(msg)) return { ok: false, mensagem: msg };
    return { ok: false, mensagem: "Não foi possível concluir. Tente novamente." };
  }
}