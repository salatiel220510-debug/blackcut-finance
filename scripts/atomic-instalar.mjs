// Instalador da ATOMIC — Fase 1.
// Aplica as pequenas alterações nos arquivos que JÁ EXISTEM no projeto.
//
// Como usar (no terminal do VS Code, na raiz do projeto):
//     node scripts/atomic-instalar.mjs
//
// Segurança:
//  - Antes de alterar qualquer arquivo, guarda uma cópia na pasta ".atomic-backup".
//  - Pode ser executado várias vezes: o que já foi aplicado é ignorado.
//  - Se não encontrar o trecho esperado, NÃO altera o arquivo e avisa (marcado como MANUAL).

import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const BACKUP = path.join(RAIZ, ".atomic-backup");
const relatorio = [];

function registrar(status, arquivo, detalhe) {
  relatorio.push({ status, arquivo, detalhe });
}

function guardarBackup(rel, conteudo) {
  fs.mkdirSync(BACKUP, { recursive: true });
  fs.writeFileSync(path.join(BACKUP, rel.replace(/[\\/]/g, "__")), conteudo);
}

// Cada passo tem: nome, jaFeito (regex), alvo (regex) e novo (texto ou função).
function editar(rel, passos) {
  const caminho = path.join(RAIZ, rel);
  if (!fs.existsSync(caminho)) {
    registrar("ERRO", rel, "arquivo não encontrado (confirme que está na raiz do projeto)");
    return;
  }
  const original = fs.readFileSync(caminho, "utf8");
  let texto = original;

  for (const p of passos) {
    if (p.jaFeito.test(texto)) {
      registrar("OK", rel, `${p.nome} — já estava aplicado`);
      continue;
    }
    if (!p.alvo.test(texto)) {
      registrar("MANUAL", rel, `${p.nome} — trecho não encontrado; aplique à mão (veja o LEIA-ME)`);
      continue;
    }
    const substituir = typeof p.novo === "function" ? p.novo : () => p.novo;
    texto = texto.replace(p.alvo, substituir);
    registrar("FEITO", rel, p.nome);
  }

  if (texto !== original) {
    guardarBackup(rel, original);
    fs.writeFileSync(caminho, texto);
  }
}

// ── 0) Estamos na pasta certa? ───────────────────────────────────────────────
try {
  const pacote = JSON.parse(fs.readFileSync(path.join(RAIZ, "package.json"), "utf8"));
  if (pacote.name !== "blackcut-finance") {
    console.error(`Esta pasta é do projeto "${pacote.name}", e não do blackcut-finance. Abra o terminal na pasta correta.`);
    process.exit(1);
  }
} catch {
  console.error("Não encontrei o package.json. Abra o terminal na RAIZ do projeto (onde fica o package.json).");
  process.exit(1);
}

// ── 1) Banco de dados (Prisma) ───────────────────────────────────────────────
const BLOCO_PRISMA = `enum AtomicRole {
  USER
  MODEL
}

model AtomicChat {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  title     String          @default("Nova conversa")
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  messages  AtomicMessage[]

  @@index([userId, updatedAt])
}

model AtomicMessage {
  id        String     @id @default(cuid())
  chatId    String
  chat      AtomicChat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      AtomicRole
  content   String
  createdAt DateTime   @default(now())

  @@index([chatId, createdAt])
}

model AtomicToolLog {
  id        String   @id @default(cuid())
  chatId    String
  userId    String
  tool      String
  args      Json
  ok        Boolean
  createdAt DateTime @default(now())

  @@index([chatId])
  @@index([userId, createdAt])
}
`;

editar("prisma/schema.prisma", [
  {
    nome: "relação atomicChats no modelo User",
    jaFeito: /atomicChats\s+AtomicChat\[\]/,
    alvo: /passwordResetTokens\s+PasswordResetToken\[\][^\n\r]*/,
    novo: (m) => `${m}\n  atomicChats           AtomicChat[]`,
  },
  {
    nome: "modelos AtomicChat, AtomicMessage e AtomicToolLog",
    jaFeito: /model\s+AtomicChat\s*\{/,
    alvo: /[\s\S]+/,
    novo: (m) => `${m.trimEnd()}\n\n${BLOCO_PRISMA}`,
  },
]);

// ── 2) Permissão "usarAtomic" ────────────────────────────────────────────────
editar("src/lib/permissoesTipos.ts", [
  {
    nome: 'tipo ChavePermissao ("usarAtomic")',
    jaFeito: /\|\s*"usarAtomic"/,
    alvo: /\|\s*"gerenciarProdutos"\s*;/,
    novo: '| "gerenciarProdutos"\n  | "usarAtomic";',
  },
  {
    nome: "texto da permissão (PERMISSOES_LABEL)",
    jaFeito: /usarAtomic:\s*"/,
    alvo: /gerenciarProdutos:\s*"[^"]*",/,
    novo: (m) => `${m}\n  usarAtomic: "Usar a assistente ATOMIC (consultas com IA)",`,
  },
  {
    nome: "valor padrão da permissão (PERMISSOES_PADRAO)",
    jaFeito: /usarAtomic:\s*false/,
    alvo: /gerenciarProdutos:\s*false,?\s*\}/,
    novo: "gerenciarProdutos: false,\n  usarAtomic: false\n}",
  },
]);

const PASSO_LISTA_PERMISSOES = {
  nome: 'inclusão de "usarAtomic" na lista de permissões',
  jaFeito: /"usarAtomic"/,
  alvo: /"gerenciarProdutos",(\s*)\]/,
  novo: (_m, espaco) => `"gerenciarProdutos", "usarAtomic",${espaco}]`,
};
editar("src/app/admin/barbeiros/CardBarbeiro.tsx", [PASSO_LISTA_PERMISSOES]);
editar("src/app/admin/barbeiros/actions.ts", [PASSO_LISTA_PERMISSOES]);

// ── 3) Ícone do átomo ao lado do sino (página inicial) ──────────────────────
editar("src/app/home/page.tsx", [
  {
    nome: "importação do IconeAtomo",
    jaFeito: /IconeAtomo/,
    alvo: /(import IconeSino from "@\/components\/IconeSino";)/,
    novo: (m) => `${m}\nimport IconeAtomo from "@/components/IconeAtomo";`,
  },
  {
    nome: "verificação da permissão (podeAtomic)",
    jaFeito: /podeAtomic/,
    alvo: /const podeVerFaturamento\s*=\s*await temPermissao\([^;]*\);/,
    novo: (m) => `${m}\n  const podeAtomic = await temPermissao(role, userId, "usarAtomic");`,
  },
  {
    nome: "ícone da ATOMIC ao lado do sino",
    jaFeito: /href="\/atomic"/,
    alvo: /<Link href="\/notificacoes" title="Avisos" className="text-gold-dark hover:text-gold">\s*<IconeSino size=\{26\} \/>\s*<\/Link>/,
    novo: `<div className="flex items-center gap-3">
            {podeAtomic && (
              <Link href="/atomic" title="ATOMIC" className="text-gold-dark hover:text-gold">
                <IconeAtomo size={26} />
              </Link>
            )}
            <Link href="/notificacoes" title="Avisos" className="text-gold-dark hover:text-gold">
              <IconeSino size={26} />
            </Link>
          </div>`,
  },
]);

// ── 4) Variáveis de ambiente (.env) ──────────────────────────────────────────
{
  const caminho = path.join(RAIZ, ".env");
  if (!fs.existsSync(caminho)) {
    registrar("MANUAL", ".env", "arquivo não encontrado; crie-o e acrescente GEMINI_API_KEY e GEMINI_MODEL");
  } else {
    const original = fs.readFileSync(caminho, "utf8");
    const novas = [];
    if (!/^\s*GEMINI_API_KEY\s*=/m.test(original)) novas.push('GEMINI_API_KEY=""');
    if (!/^\s*GEMINI_MODEL\s*=/m.test(original)) novas.push('GEMINI_MODEL="gemini-3.5-flash-lite"');

    if (novas.length === 0) {
      registrar("OK", ".env", "variáveis da ATOMIC já existem");
    } else {
      guardarBackup(".env", original);
      const quebra = original.length > 0 && !original.endsWith("\n") ? "\n" : "";
      fs.writeFileSync(caminho, `${original}${quebra}\n# ATOMIC (assistente de IA)\n${novas.join("\n")}\n`);
      registrar("FEITO", ".env", `acrescentado: ${novas.map((n) => n.split("=")[0]).join(", ")} — falta colar a sua chave`);
    }
  }
}

// ── 5) Os arquivos novos foram copiados? ─────────────────────────────────────
const NOVOS = [
  "src/components/IconeAtomo.tsx",
  "src/lib/atomic/modelo.ts",
  "src/lib/atomic/ferramentas.ts",
  "src/lib/atomic/orquestrador.ts",
  "src/app/atomic/actions.ts",
  "src/app/atomic/page.tsx",
  "src/app/atomic/chat.tsx",
  "scripts/atomic-smoke.ts",
];
for (const rel of NOVOS) {
  if (!fs.existsSync(path.join(RAIZ, rel))) registrar("FALTA", rel, "copie este arquivo do pacote para o projeto");
}

// ── Relatório ────────────────────────────────────────────────────────────────
console.log("\n=== Instalador da ATOMIC ===\n");
for (const r of relatorio) console.log(`[${r.status.padEnd(6)}] ${r.arquivo}\n         ${r.detalhe}`);

const problemas = relatorio.filter((r) => ["ERRO", "MANUAL", "FALTA"].includes(r.status));
console.log("\n----------------------------------------------");
if (problemas.length > 0) {
  console.log(`Atenção: ${problemas.length} item(ns) exigem ação manual (ERRO, MANUAL ou FALTA). Envie esta tela para análise.`);
} else {
  console.log("Tudo certo. Cópias de segurança (se houve alteração) estão na pasta .atomic-backup");
  console.log("\nPróximos passos:");
  console.log('  1) Abra o arquivo .env e cole a sua chave em GEMINI_API_KEY="..."');
  console.log("  2) npx tsx scripts/atomic-smoke.ts");
  console.log("  3) npx prisma migrate dev --name add_atomic");
  console.log("  4) npx prisma generate");
  console.log("  5) npx tsc --noEmit");
  console.log("  6) npm run dev");
}
