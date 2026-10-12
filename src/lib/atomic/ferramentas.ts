import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { temPermissao } from "@/lib/permissoes";
import { comissaoPendenteBarbeiro } from "@/lib/comissoesPendentes";
import { sessaoAberta } from "@/lib/caixaSessao";
import { limitesDoDiaEspecifico, diaBrasilDeData } from "@/lib/datasBrasil";
import type { DeclaracaoFerramenta } from "./modelo";
import type { PropostaRascunho } from "./tipos";

// ─────────────────────────────────────────────────────────────────────────────
// Regras de segurança desta camada (nunca relaxar sem revisão):
//  1. A identidade (userId/role) vem da sessão — NUNCA de argumentos do modelo.
//  2. Todo argumento é validado com Zod antes de tocar o banco.
//  3. Cada ferramenta reconfere a permissão do usuário por conta própria.
//  4. Cada ferramenta devolve uma LISTA BRANCA de campos (sem nomes de clientes,
//     observações ou textos livres). Além disso, limpar() é a rede de segurança final.
//  5. NENHUMA ferramenta grava no banco. As ferramentas 'propor_*' apenas exibem um
//     formulário; a gravação só ocorre quando a PESSOA clica em Confirmar (propostas.ts).
// ─────────────────────────────────────────────────────────────────────────────

// 'propostas' é o coletor dos formulários pedidos pela IA durante UMA mensagem.
export type Contexto = { userId: string; role: string; propostas: PropostaRascunho[] };

type Ferramenta = {
  declaracao: DeclaracaoFerramenta;
  processar: (brutos: unknown, ctx: Contexto) => Promise<unknown>;
};

function definir<S extends z.ZodType>(def: {
  nome: string;
  descricao: string;
  parametros?: Record<string, unknown>;
  schema: S;
  executar: (args: z.infer<S>, ctx: Contexto) => Promise<unknown>;
}): Ferramenta {
  return {
    declaracao: { name: def.nome, description: def.descricao, ...(def.parametros ? { parameters: def.parametros } : {}) },
    processar: async (brutos, ctx) => {
      const v = def.schema.safeParse(brutos ?? {});
      if (!v.success) return { erro: v.error.issues[0]?.message ?? "Argumentos inválidos." };
      return def.executar(v.data, ctx);
    },
  };
}

const arred = (n: number) => Number(n.toFixed(2));
const num = (v: unknown) => Number(v ?? 0);

const dataSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD.");
type Periodo = { data_inicio: string; data_fim: string };

const camposPeriodo = { data_inicio: dataSchema, data_fim: dataSchema };

// Validação do intervalo de datas (executada no início de cada ferramenta que recebe período).
function erroPeriodo(p: Periodo): string | null {
  if (isNaN(Date.parse(p.data_inicio)) || isNaN(Date.parse(p.data_fim))) return "Data inválida.";
  if (p.data_inicio > p.data_fim) return "data_inicio não pode ser posterior a data_fim.";
  if ((Date.parse(p.data_fim) - Date.parse(p.data_inicio)) / 86_400_000 > 366) return "O período máximo é de 366 dias.";
  return null;
}

const PARAMETROS_PERIODO = {
  data_inicio: { type: "string", description: "Data inicial no formato AAAA-MM-DD (horário de Brasília)." },
  data_fim: { type: "string", description: "Data final, inclusive, no formato AAAA-MM-DD." },
};

function janela(p: Periodo) {
  return { gte: limitesDoDiaEspecifico(p.data_inicio).inicio, lte: limitesDoDiaEspecifico(p.data_fim).fim };
}

const veTudo = (ctx: Contexto) => temPermissao(ctx.role, ctx.userId, "verFaturamentoCompleto");
const SEM_PERMISSAO = { erro: "O usuário não tem permissão para consultar estes dados." };

const MAX_FORMULARIOS_POR_MENSAGEM = 3;
const INSTRUCAO_FORMULARIO =
  "O formulário já está sendo exibido ao usuário para revisão. Avise que ele deve conferir os campos e clicar em Confirmar. NÃO afirme que algo foi cadastrado.";

function exibirFormulario(ctx: Contexto, proposta: PropostaRascunho, instrucao = INSTRUCAO_FORMULARIO) {
  if (ctx.propostas.length >= MAX_FORMULARIOS_POR_MENSAGEM) {
    return { erro: "Limite de formulários por mensagem atingido. Peça um de cada vez." };
  }
  ctx.propostas.push(proposta);
  return { status: "formulario_exibido_ao_usuario", instrucao };
}

const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const LISTA: Ferramenta[] = [
  definir({
    nome: "resumo_financeiro",
    descricao:
      "Resumo financeiro de um período: entradas, despesas, comissões e lucro líquido. " +
      "Para usuários sem permissão ampla, retorna apenas os atendimentos do próprio usuário.",
    parametros: { type: "object", properties: PARAMETROS_PERIODO, required: ["data_inicio", "data_fim"] },
    schema: z.object({ ...camposPeriodo }),
    executar: async (a, ctx) => {
      const erro = erroPeriodo(a);
      if (erro) return { erro };
      const tudo = await veTudo(ctx);
      const base = { deletedAt: null, date: janela(a), barberId: tudo ? undefined : ctx.userId };

      const entradas = await prisma.transaction.aggregate({
        where: { ...base, type: "INCOME" },
        _sum: { amount: true, commissionAmount: true },
        _count: true,
      });
      const ent = arred(num(entradas._sum.amount));
      const com = arred(num(entradas._sum.commissionAmount));

      if (!tudo) {
        return { escopo: "somente os seus próprios atendimentos", total_gerado: ent, comissao: com, itens: entradas._count };
      }

      const saidas = await prisma.transaction.aggregate({
        where: { ...base, type: "EXPENSE", category: { not: "Comissão Paga" } },
        _sum: { amount: true },
      });
      const desp = arred(num(saidas._sum.amount));

      return {
        escopo: "barbearia inteira",
        entradas: ent,
        despesas: desp,
        comissoes: com,
        lucro_liquido: arred(ent - desp - com),
        itens_de_entrada: entradas._count,
      };
    },
  }),

  definir({
    nome: "listar_lancamentos",
    descricao:
      "Lista os lançamentos mais recentes de um período (data, tipo, categoria, valor, pagamento e barbeiro). " +
      "Não inclui nomes de clientes nem observações.",
    parametros: {
      type: "object",
      properties: {
        ...PARAMETROS_PERIODO,
        tipo: { type: "string", enum: ["ENTRADA", "SAIDA"], description: "Filtro opcional por tipo." },
        limite: { type: "integer", description: "Quantidade máxima de linhas (1 a 30). Padrão 15." },
      },
      required: ["data_inicio", "data_fim"],
    },
    schema: z.object({
      ...camposPeriodo,
      tipo: z.enum(["ENTRADA", "SAIDA"]).optional(),
      limite: z.coerce.number().int().min(1).max(30).default(15),
    }),
    executar: async (a, ctx) => {
      const erro = erroPeriodo(a);
      if (erro) return { erro };
      const tudo = await veTudo(ctx);
      const filtroTipo: "INCOME" | "EXPENSE" | undefined = a.tipo === "ENTRADA" ? "INCOME" : a.tipo === "SAIDA" ? "EXPENSE" : undefined;

      const linhas = await prisma.transaction.findMany({
        where: {
          deletedAt: null,
          date: janela(a),
          type: tudo ? filtroTipo : "INCOME",
          barberId: tudo ? undefined : ctx.userId,
        },
        orderBy: { date: "desc" },
        take: a.limite,
        select: { date: true, type: true, category: true, amount: true, paymentMethod: true, barber: { select: { name: true } } },
      });

      return {
        quantidade: linhas.length,
        lancamentos: linhas.map((l) => ({
          data: diaBrasilDeData(l.date),
          tipo: l.type === "INCOME" ? "entrada" : "saida",
          categoria: l.category,
          valor: arred(num(l.amount)),
          pagamento: l.paymentMethod ?? null,
          barbeiro: l.barber?.name ?? null,
        })),
      };
    },
  }),

  definir({
    nome: "despesas_por_categoria",
    descricao: "Total de despesas agrupado por categoria em um período (exclui pagamentos de comissão).",
    parametros: { type: "object", properties: PARAMETROS_PERIODO, required: ["data_inicio", "data_fim"] },
    schema: z.object({ ...camposPeriodo }),
    executar: async (a, ctx) => {
      if (!(await veTudo(ctx))) return SEM_PERMISSAO;
      const erro = erroPeriodo(a);
      if (erro) return { erro };
      const grupos = await prisma.transaction.groupBy({
        by: ["category"],
        where: { deletedAt: null, type: "EXPENSE", category: { not: "Comissão Paga" }, date: janela(a) },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 20,
      });
      return { categorias: grupos.map((g) => ({ categoria: g.category, total: arred(num(g._sum.amount)) })) };
    },
  }),

  definir({
    nome: "ranking_barbeiros",
    descricao: "Faturamento e comissão gerados por cada barbeiro em um período, do maior para o menor.",
    parametros: { type: "object", properties: PARAMETROS_PERIODO, required: ["data_inicio", "data_fim"] },
    schema: z.object({ ...camposPeriodo }),
    executar: async (a, ctx) => {
      if (!(await veTudo(ctx))) return SEM_PERMISSAO;
      const erro = erroPeriodo(a);
      if (erro) return { erro };
      const grupos = await prisma.transaction.groupBy({
        by: ["barberId"],
        where: { deletedAt: null, type: "INCOME", barberId: { not: null }, date: janela(a) },
        _sum: { amount: true, commissionAmount: true },
      });
      const ids = grupos.flatMap((g) => (g.barberId ? [g.barberId] : []));
      const usuarios = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
      const nomes = new Map(usuarios.map((u) => [u.id, u.name]));

      return {
        barbeiros: grupos
          .map((g) => ({
            barbeiro: nomes.get(g.barberId ?? "") ?? "Desconhecido",
            faturamento: arred(num(g._sum.amount)),
            comissao: arred(num(g._sum.commissionAmount)),
          }))
          .sort((x, y) => y.faturamento - x.faturamento),
      };
    },
  }),

  definir({
    nome: "comissoes_pendentes",
    descricao: "Comissões ainda não pagas. Usuários sem permissão ampla veem apenas a própria comissão.",
    schema: z.object({}),
    executar: async (_a, ctx) => {
      const todos = await temPermissao(ctx.role, ctx.userId, "verComissoesTodos");
      if (!todos) return { escopo: "somente você", pendente: arred(await comissaoPendenteBarbeiro(ctx.userId)) };

      const barbeiros = await prisma.user.findMany({
        where: { role: "BARBER", status: "APPROVED" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      const itens = await Promise.all(
        barbeiros.map(async (b) => ({ barbeiro: b.name, pendente: arred(await comissaoPendenteBarbeiro(b.id)) }))
      );
      return { escopo: "todos os barbeiros", barbeiros: itens };
    },
  }),

  definir({
    nome: "consultar_produtos",
    descricao: "Lista produtos ativos com preço, quantidade em estoque e unidades vendidas.",
    parametros: {
      type: "object",
      properties: {
        busca: { type: "string", description: "Trecho do nome do produto (opcional)." },
        estoque_ate: { type: "integer", description: "Retorna só produtos com estoque menor ou igual a este valor (opcional)." },
      },
    },
    schema: z.object({
      busca: z.string().trim().max(50).optional(),
      estoque_ate: z.coerce.number().int().min(0).optional(),
    }),
    executar: async (a) => {
      const produtos = await prisma.product.findMany({
        where: {
          active: true,
          name: a.busca ? { contains: a.busca, mode: "insensitive" as const } : undefined,
          quantidade: a.estoque_ate !== undefined ? { lte: a.estoque_ate } : undefined,
        },
        orderBy: { name: "asc" },
        take: 30,
        select: { name: true, price: true, quantidade: true, vendidos: true },
      });
      return {
        produtos: produtos.map((p) => ({ produto: p.name, preco: arred(num(p.price)), estoque: p.quantidade, vendidos: p.vendidos })),
      };
    },
  }),

  definir({
    nome: "consultar_servicos",
    descricao: "Lista os serviços ativos com preço e desconto vigente (se houver).",
    schema: z.object({}),
    executar: async () => {
      const agora = new Date();
      const servicos = await prisma.serviceType.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { name: true, price: true, discountPercentage: true, discountValidUntil: true },
      });
      return {
        servicos: servicos.map((s) => {
          const vigente = s.discountPercentage != null && (!s.discountValidUntil || s.discountValidUntil >= agora);
          return {
            servico: s.name,
            preco: s.price != null ? arred(num(s.price)) : null,
            desconto_percentual: vigente ? num(s.discountPercentage) : null,
          };
        }),
      };
    },
  }),

  definir({
    nome: "status_caixa",
    descricao: "Informa se o caixa está aberto e, se estiver, quem abriu, quando e o fundo de troco.",
    schema: z.object({}),
    executar: async () => {
      const s = await sessaoAberta();
      if (!s) return { aberto: false };
      return {
        aberto: true,
        aberto_por: s.abertoPor.name,
        desde: s.abertoEm.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        fundo_troco: arred(num(s.fundoTroco)),
      };
    },
  }),
  // ───────── Fase 2: formulários para revisão humana (a IA NUNCA grava) ─────────
  definir({
    nome: "listar_categorias_despesa",
    descricao: "Lista os nomes das categorias de despesa ativas. Use antes de propor uma despesa.",
    schema: z.object({}),
    executar: async (_a, ctx) => {
      if (!(await temPermissao(ctx.role, ctx.userId, "criarDespesasComanda"))) return SEM_PERMISSAO;
      const categorias = await prisma.expenseCategory.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { name: true },
      });
      return { categorias: categorias.map((c) => c.name) };
    },
  }),

  definir({
    nome: "propor_cadastro_servico",
    descricao:
      "Prepara um formulário para cadastrar um novo serviço. NÃO grava nada: o usuário revisa e confirma. Somente o dono pode usar.",
    parametros: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome do serviço." },
        preco: { type: "number", description: "Preço em reais (opcional)." },
      },
      required: ["nome"],
    },
    schema: z.object({
      nome: z.string().trim().min(1).max(60),
      preco: z.coerce.number().min(0).max(100000).optional(),
    }),
    executar: async (a, ctx) => {
      if (ctx.role !== "OWNER") return { erro: "Somente o dono pode cadastrar serviços." };
      const existe = await prisma.serviceType.findUnique({ where: { name: a.nome } });
      if (existe) return { erro: "Já existe um serviço com esse nome." };
      return exibirFormulario(ctx, {
        tipo: "SERVICO",
        dados: { nome: a.nome, preco: a.preco !== undefined ? String(a.preco) : "" },
        resumo: `Cadastrar serviço “${a.nome}”`,
      });
    },
  }),

  definir({
    nome: "propor_cadastro_produto",
    descricao:
      "Prepara um formulário para cadastrar um novo produto com preço e estoque. NÃO grava nada: o usuário revisa e confirma.",
    parametros: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome do produto." },
        preco: { type: "number", description: "Preço de venda em reais." },
        quantidade: { type: "integer", description: "Quantidade inicial em estoque (padrão 0)." },
        codigo_barras: { type: "string", description: "Código de barras (opcional)." },
      },
      required: ["nome", "preco"],
    },
    schema: z.object({
      nome: z.string().trim().min(1).max(80),
      preco: z.coerce.number().positive().max(100000),
      quantidade: z.coerce.number().int().min(0).max(100000).default(0),
      codigo_barras: z.string().trim().max(50).optional(),
    }),
    executar: async (a, ctx) => {
      if (!(await temPermissao(ctx.role, ctx.userId, "gerenciarProdutos"))) {
        return { erro: "O usuário não tem permissão para cadastrar produtos." };
      }
      if (a.codigo_barras) {
        const existe = await prisma.product.findUnique({ where: { barcode: a.codigo_barras } });
        if (existe) return { erro: "Já existe um produto com esse código de barras." };
      }
      return exibirFormulario(ctx, {
        tipo: "PRODUTO",
        dados: {
          nome: a.nome,
          preco: String(a.preco),
          quantidade: String(a.quantidade),
          codigo_barras: a.codigo_barras ?? "",
        },
        resumo: `Cadastrar produto “${a.nome}”`,
      });
    },
  }),

  definir({
    nome: "propor_despesa",
    descricao:
      "Prepara um formulário para registrar uma despesa. NÃO grava nada: o usuário revisa e confirma. Exige caixa aberto.",
    parametros: {
      type: "object",
      properties: {
        valor: { type: "number", description: "Valor da despesa em reais." },
        categoria: { type: "string", description: "Nome da categoria (veja listar_categorias_despesa)." },
        descricao: { type: "string", description: "Descrição curta (opcional)." },
      },
      required: ["valor"],
    },
    schema: z.object({
      valor: z.coerce.number().positive().max(1000000),
      categoria: z.string().trim().max(60).optional(),
      descricao: z.string().trim().max(200).optional(),
    }),
    executar: async (a, ctx) => {
      if (!(await temPermissao(ctx.role, ctx.userId, "criarDespesasComanda"))) {
        return { erro: "O usuário não tem permissão para registrar despesas." };
      }
      if (!(await sessaoAberta())) return { erro: "O caixa está fechado. É preciso abri-lo antes de registrar uma despesa." };

      const categorias = await prisma.expenseCategory.findMany({ where: { active: true }, select: { id: true, name: true } });
      const alvo = a.categoria ? normalizar(a.categoria) : "";
      const achada = alvo
        ? categorias.find((c) => normalizar(c.name) === alvo) ??
          categorias.find((c) => normalizar(c.name).includes(alvo) || alvo.includes(normalizar(c.name)))
        : undefined;

      return exibirFormulario(ctx, {
        tipo: "DESPESA",
        dados: { valor: String(a.valor), categoria_id: achada?.id ?? "", descricao: a.descricao ?? "" },
        resumo: `Registrar despesa de R$ ${a.valor.toFixed(2).replace(".", ",")}`,
      });
    },
  }),

  definir({
    nome: "abrir_cartao_fidelidade",
    descricao:
      "Abre o painel do cartão fidelidade, onde o PRÓPRIO USUÁRIO digita o nome do cliente e marca o cartão. Nunca peça nem receba o nome do cliente no chat.",
    schema: z.object({}),
    executar: async (_a, ctx) =>
      exibirFormulario(
        ctx,
        { tipo: "FIDELIDADE", dados: {}, resumo: "Cartão fidelidade" },
        "O painel do cartão fidelidade já está sendo exibido. Peça ao usuário para digitar o nome do cliente no painel, e não no chat."
      ),
  }),
];

const REGISTRO = new Map(LISTA.map((t) => [t.declaracao.name, t]));
export const declaracoes = () => LISTA.map((t) => t.declaracao);

// Rede de segurança final: remove qualquer chave que sugira dado pessoal ou texto livre,
// mesmo que uma ferramenta futura a inclua por engano.
const CAMPO_SENSIVEL = /cliente|observa|descri|e-?mail|senha|password|hash|token|telefone|phone/i;

function limpar(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(limpar);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([k]) => !CAMPO_SENSIVEL.test(k))
        .map(([k, x]) => [k, limpar(x)])
    );
  }
  return v;
}

const LIMITE_CARACTERES = 8000;

export async function executarFerramenta(nome: string, args: unknown, ctx: Contexto): Promise<{ ok: boolean; resultado: unknown }> {
  const ferramenta = REGISTRO.get(nome);
  if (!ferramenta) return { ok: false, resultado: { erro: "Ferramenta desconhecida." } };

  try {
    const resultado = limpar(await ferramenta.processar(args, ctx));
    if (JSON.stringify(resultado).length > LIMITE_CARACTERES) {
      return { ok: false, resultado: { erro: "Resultado grande demais. Use um período menor ou mais filtros." } };
    }
    const ok = !(resultado && typeof resultado === "object" && "erro" in resultado);
    return { ok, resultado };
  } catch (e) {
    console.error(`[atomic] falha na ferramenta ${nome}:`, e);
    return { ok: false, resultado: { erro: "Falha interna ao executar a consulta." } };
  }
}