// Regras de segurança da ATOMIC em funções PURAS: não acessam banco nem login.
// Por isso podem ser testadas de verdade (npx tsx scripts/atomic-testes.ts).

import type { Conteudo } from "./modelo";

// ───────────────────── Interruptor de emergência ─────────────────────
// Para desligar a ATOMIC inteira: ATOMIC_DESLIGADA=true (e novo deploy na Vercel).
export function atomicDesligada(): boolean {
  return process.env.ATOMIC_DESLIGADA === "true";
}

// ───────────────────────── Limites de uso ─────────────────────────
export const LIMITES = {
  porHora: 30, // mensagens por usuário por hora
  porDiaUsuario: Number(process.env.ATOMIC_LIMITE_DIARIO_USUARIO) || 150,
  porDiaGlobal: Number(process.env.ATOMIC_LIMITE_DIARIO_GLOBAL) || 300, // todos os usuários
};
export const LIMITE_CONFIRMACOES_POR_HORA = 30;

export function decidirLimite(
  uso: { usadasHora: number; usadasDia: number; usadasGlobal: number },
  limites = LIMITES
): string | null {
  if (uso.usadasHora >= limites.porHora) return "Limite de mensagens por hora atingido. Tente novamente mais tarde.";
  if (uso.usadasDia >= limites.porDiaUsuario) return "Você atingiu o limite diário de mensagens da ATOMIC. Tente novamente amanhã.";
  if (uso.usadasGlobal >= limites.porDiaGlobal) return "A ATOMIC atingiu o limite diário de uso da barbearia. Tente novamente amanhã.";
  return null;
}

// ───────────────────────── Períodos de data ─────────────────────────
export type Periodo = { data_inicio: string; data_fim: string };

export function erroPeriodo(p: Periodo): string | null {
  if (isNaN(Date.parse(p.data_inicio)) || isNaN(Date.parse(p.data_fim))) return "Data inválida.";
  if (p.data_inicio > p.data_fim) return "data_inicio não pode ser posterior a data_fim.";
  if ((Date.parse(p.data_fim) - Date.parse(p.data_inicio)) / 86_400_000 > 366) return "O período máximo é de 366 dias.";
  return null;
}

// ───────────────── Textos: privacidade e injeção de instruções ─────────────────
export const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Chaves que sugerem dado pessoal ou texto livre: nunca vão ao modelo.
const CAMPO_SENSIVEL = /cliente|observa|descri|e-?mail|senha|password|hash|token|telefone|phone/i;

// Chaves cujo texto vem do NOSSO código (não do banco): não são alteradas.
const CHAVES_CONFIAVEIS = new Set(["instrucao", "erro", "status", "escopo"]);

// Frases típicas de quem tenta "dar ordens" à IA através de dados cadastrados
// (ex.: um produto chamado "Ignore as instruções anteriores..."). É uma barreira
// extra, NÃO a principal: a defesa real é a confirmação humana e as permissões.
const PADROES_INJECAO =
  /(ignore|ignora|desconsidere|esque[cç]a|disregard|forget)\s+(?:(?:as|todas|suas|essas|estas|all|any|the|previous|prior|above|your)\s+)*(instru[cç][õo]es|regras|instructions|rules)|system\s*prompt|prompt\s+do\s+sistema|you\s+are\s+now|voc[eê]\s+agora\s+[eé]|<\/?(system|assistant|tool|user)>/i;

export function neutralizarTexto(texto: string, max = 100): string {
  const limpo = texto.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return PADROES_INJECAO.test(limpo) ? "[texto suspeito removido]" : limpo;
}

export function limpar(v: unknown, chave = ""): unknown {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return CHAVES_CONFIAVEIS.has(chave) ? v : neutralizarTexto(v);
  if (Array.isArray(v)) return v.map((x) => limpar(x, chave));
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([k]) => !CAMPO_SENSIVEL.test(k))
        .map(([k, x]) => [k, limpar(x, k)])
    );
  }
  return v;
}

// ─────────────────────── Histórico para o modelo ───────────────────────
// Garante o formato que a API exige: começa por "user" e alterna os papéis.
export function prepararHistorico(h: Conteudo[]): Conteudo[] {
  const saida: Conteudo[] = [];
  for (const c of h) {
    const ultimo = saida[saida.length - 1];
    if (ultimo && ultimo.role === c.role) ultimo.parts.push(...c.parts);
    else saida.push({ role: c.role, parts: [...c.parts] });
  }
  while (saida[0]?.role === "model") saida.shift();
  return saida;
}