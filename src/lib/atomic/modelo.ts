// Adaptador do modelo Gemini da ATOMIC.
// ÚNICO arquivo que conhece o formato da API do Google: se o contrato mudar
// (ex.: migração para a Interactions API), somente este arquivo precisa ser alterado.
// A chave NUNCA deve ter o prefixo NEXT_PUBLIC_ — ela só existe no servidor.

const BASE = "https://generativelanguage.googleapis.com/v1beta";
export const MODELO = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

export type Parte = {
  text?: string;
  thought?: boolean;
  functionCall?: { name: string; args?: Record<string, unknown> };
  [campo: string]: unknown;
};

export type Conteudo = { role: "user" | "model"; parts: Parte[] };

export type DeclaracaoFerramenta = {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
};

export type ChamadaFerramenta = { name: string; args: Record<string, unknown> };

export type RespostaModelo = {
  texto: string;
  chamadas: ChamadaFerramenta[];
  // Conteúdo original do modelo: deve ser reenviado "como veio" na volta seguinte
  // do laço de ferramentas (preserva as assinaturas de raciocínio dos modelos Gemini 3.x).
  conteudoBruto: Conteudo;
};

export class ErroModelo extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
    this.name = "ErroModelo";
  }
}

export async function chamarModelo(params: {
  instrucao: string;
  conteudos: Conteudo[];
  ferramentas: DeclaracaoFerramenta[];
  limiteMs: number;
}): Promise<RespostaModelo> {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new ErroModelo(500, "GEMINI_API_KEY não configurada.");

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), params.limiteMs);

  try {
    const r = await fetch(`${BASE}/models/${MODELO}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": chave, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.instrucao }] },
        contents: params.conteudos,
        tools: [{ functionDeclarations: params.ferramentas }],
        // Sem "temperature": a documentação do Google recomenda o padrão para os modelos 3.x.
        // 2048 (e não menos): tokens de raciocínio podem consumir o limite de saída.
        generationConfig: { maxOutputTokens: 2048 },
      }),
      signal: controle.signal,
      cache: "no-store",
    });

    const corpo = await r.json().catch(() => ({}));
    if (!r.ok) throw new ErroModelo(r.status, String(corpo?.error?.message ?? "Falha ao consultar o modelo."));
    if (corpo?.promptFeedback?.blockReason) throw new ErroModelo(422, `Conteúdo bloqueado: ${corpo.promptFeedback.blockReason}`);

    const partes: Parte[] = corpo?.candidates?.[0]?.content?.parts ?? [];
    const texto = partes
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text as string)
      .join("");
    const chamadas: ChamadaFerramenta[] = partes
      .filter((p) => p.functionCall)
      .map((p) => ({ name: p.functionCall!.name, args: p.functionCall!.args ?? {} }));

    return { texto, chamadas, conteudoBruto: { role: "model", parts: partes } };
  } catch (e) {
    if (e instanceof ErroModelo) throw e;
    if (e instanceof Error && e.name === "AbortError") throw new ErroModelo(504, "Tempo esgotado ao consultar o modelo.");
    throw new ErroModelo(502, "Falha de rede ao consultar o modelo.");
  } finally {
    clearTimeout(timer);
  }
}