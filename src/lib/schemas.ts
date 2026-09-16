import { z } from "zod";

function emailNormalizado(mensagem = "E-mail inválido.") {
  return z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.email(mensagem)
  );
}

function numeroPtBR(mensagem = "Informe um valor válido.") {
  return z
    .preprocess((val) => {
      if (typeof val === "string") return val.replace(",", ".").trim();
      return val;
    }, z.coerce.number())
    .refine((v) => !isNaN(v), mensagem);
}

function numeroPtBROpcional() {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "string") return val.replace(",", ".").trim();
    return val;
  }, z.coerce.number().optional());
}

export const loginSchema = z.object({
  email: emailNormalizado(),
  password: z.string().min(1, "Informe a senha."),
});

export const cadastroSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
  email: emailNormalizado(),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export const transacaoSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().trim().min(1, "Informe a categoria."),
  description: z.string().trim().max(500, "Descrição muito longa.").optional(),
  amount: numeroPtBR().refine((v) => v > 0, "O valor precisa ser maior que zero."),
  barberId: z.string().trim().optional(),
  expenseCategoryId: z.string().trim().optional(),
});

export const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    novaSenha: z.string().min(6, "A nova senha precisa ter pelo menos 6 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "A confirmação não corresponde à nova senha.",
    path: ["confirmarSenha"],
  });

export const comissaoSchema = z.object({
  commissionPercentage: numeroPtBR().refine((v) => v >= 0 && v <= 100, "Informe um percentual válido entre 0 e 100."),
});

export const saldoBancarioSchema = z.object({
  saldoBancario: numeroPtBR(),
});

export const servicoSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do serviço."),
  price: numeroPtBROpcional(),
});

export const atualizarPrecoSchema = z.object({
  price: numeroPtBROpcional(),
});

export const descontoSchema = z.object({
  discountPercentage: numeroPtBR().refine((v) => v >= 1 && v <= 100, "Informe um percentual de desconto válido entre 1 e 100."),
  discountValidUntil: z.string().trim().optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().min(1, "Endpoint inválido."),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const envelopesSchema = z.object({
  envelopeOperacionalPct: numeroPtBR().refine((v) => v >= 0 && v <= 100, "Percentual inválido."),
  envelopeProLaborePct: numeroPtBR().refine((v) => v >= 0 && v <= 100, "Percentual inválido."),
  envelopeReservaPct: numeroPtBR().refine((v) => v >= 0 && v <= 100, "Percentual inválido."),
});

export const metasSchema = z.object({
  proLaboreMeta: numeroPtBROpcional(),
  reservaMeta: numeroPtBROpcional(),
});

export const categoriaDespesaSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria."),
  type: z.enum(["FIXED", "VARIABLE", "INVESTMENT", "MARKETING"]),
  budgetLimit: numeroPtBROpcional(),
});

export const atualizarBudgetSchema = z.object({
  budgetLimit: numeroPtBROpcional(),
});

export const comandaSchema = z.object({
  barberId: z.string().trim().optional(),
  paymentMethod: z.enum(["DINHEIRO", "PIX", "CARTAO_DEBITO", "CARTAO_CREDITO"]).optional(),
  clienteNome: z.string().trim().max(100).optional(),
  observacao: z.string().trim().max(500).optional(),
  itens: z
    .array(
      z.object({
        tipo: z.enum(["INCOME", "EXPENSE"]),
        category: z.string().trim().min(1, "Informe a categoria do item."),
        amount: z.number().positive("O valor do item precisa ser maior que zero."),
        expenseCategoryId: z.string().trim().optional(),
        descricao: z.string().trim().max(200).optional(),
      })
    )
    .min(1, "Adicione pelo menos um item à comanda."),
});

export const liquidarComissaoSchema = z.object({
  valorPago: numeroPtBR().refine((v) => v > 0, "Informe um valor maior que zero."),
});

export const notificacaoSchema = z.object({
  title: z.string().trim().min(1, "Informe um título.").max(100, "Título muito longo."),
  body: z.string().trim().min(1, "Informe a mensagem.").max(500, "Mensagem muito longa."),
  linkUrl: z.string().trim().url("Link inválido.").optional().or(z.literal("")),
  linkLabel: z.string().trim().max(80).optional(),
});

export const taxasSchema = z.object({
  taxaPix: numeroPtBR().refine((v) => v >= 0 && v <= 100, "Percentual inválido."),
  taxaDebito: numeroPtBR().refine((v) => v >= 0 && v <= 100, "Percentual inválido."),
  taxaCredito: numeroPtBR().refine((v) => v >= 0 && v <= 100, "Percentual inválido."),
});

export const relatoSchema = z.object({
  type: z.enum(["PROBLEMA", "MELHORIA", "OUTRO"]),
  title: z.string().trim().min(1, "Informe um título.").max(150, "Título muito longo."),
  description: z.string().trim().min(1, "Descreva o relato.").max(1000, "Descrição muito longa."),
});

export const abrirCaixaSchema = z.object({
  fundoTroco: numeroPtBR().refine((v) => v >= 0, "Informe um valor válido."),
});

export const fecharCaixaSchema = z.object({
  contagemDinheiro: numeroPtBR().refine((v) => v >= 0, "Informe um valor válido."),
  contagemCartao: numeroPtBR().refine((v) => v >= 0, "Informe um valor válido."),
});

export const movimentoCaixaSchema = z.object({
  amount: numeroPtBR().refine((v) => v > 0, "Informe um valor maior que zero."),
  motivo: z.string().trim().max(200).optional(),
});