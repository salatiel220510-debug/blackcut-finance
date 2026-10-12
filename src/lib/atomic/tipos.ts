// Tipos compartilhados entre servidor e tela. Não importa nada de servidor.

export type TipoProposta = "SERVICO" | "PRODUTO" | "DESPESA" | "FIDELIDADE";
export type StatusProposta = "PENDENTE" | "EXECUTANDO" | "CONFIRMADA" | "CANCELADA";

// Um formulário que a IA pediu para exibir. NADA foi gravado ainda.
export type PropostaRascunho = {
  tipo: TipoProposta;
  dados: Record<string, string>;
  resumo: string;
};

// O que a tela recebe para desenhar o formulário.
export type PropostaView = {
  id: string;
  tipo: TipoProposta;
  dados: Record<string, string>;
  resumo: string;
  status: StatusProposta;
  resultado: string | null;
  expirada: boolean;
  categorias?: { id: string; name: string }[];
};

// Tempo máximo para confirmar um formulário.
export const VALIDADE_PROPOSTA_MS = 30 * 60 * 1000;