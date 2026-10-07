import "dotenv/config";

// Diagnóstico da ATOMIC — Fase 0.
// Uso: npx tsx scripts/atomic-smoke.ts
// Não imprime a chave. Pode enviar a saída completa para análise.

const KEY = process.env.GEMINI_API_KEY;
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const CANDIDATOS = (
  process.env.GEMINI_MODEL_TESTE ?? "gemini-2.5-flash-lite,gemini-3.5-flash-lite,gemini-3.1-flash-lite"
).split(",");

async function main() {
  if (!KEY) throw new Error('Defina GEMINI_API_KEY="..." no arquivo .env antes de rodar.');

  // 1) Quais modelos "flash-lite" a chave enxerga?
  const lista = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": KEY } });
  console.log("models.list → HTTP", lista.status);
  if (lista.ok) {
    const json = await lista.json();
    const nomes: string[] = (json.models ?? []).map((m: any) => String(m.name).replace("models/", ""));
    console.log("flash-lite visíveis:", nomes.filter((n) => n.includes("flash-lite")));
  } else {
    console.log("  ✗", (await lista.text()).slice(0, 300));
  }

  // 2) Cada candidato responde de fato e emite uma chamada de função?
  for (const modelo of CANDIDATOS) {
    const r = await fetch(`${BASE}/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Quanto faturei hoje? Use a ferramenta." }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: "consultar_faturamento",
                description: "Retorna o faturamento de um dia.",
                parameters: { type: "object", properties: { data: { type: "string" } } },
              },
            ],
          },
        ],
      }),
    });

    const corpo = await r.json().catch(() => ({}));
    const parte = corpo?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
    console.log(`\n[${modelo}] HTTP ${r.status}`);
    console.log(
      parte
        ? `  ✓ function call: ${JSON.stringify(parte.functionCall)}`
        : `  ✗ ${String(corpo?.error?.message ?? "resposta sem functionCall").slice(0, 300)}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});