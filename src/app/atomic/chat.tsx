"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import IconeAtomo from "@/components/IconeAtomo";
import PropostaCard from "./proposta-card";
import type { PropostaView } from "@/lib/atomic/tipos";
import { enviarMensagem, carregarConversa, excluirConversa, listarConversas } from "./actions";

type Conversa = { id: string; title: string; updatedAt: string };
type Mensagem = { role: "USER" | "MODEL"; content: string; propostas?: PropostaView[] };

const SUGESTOES = [
  "Quanto faturei neste mês?",
  "Quais produtos estão com estoque baixo?",
  "Qual barbeiro mais faturou nos últimos 7 dias?",
  "O caixa está aberto agora?",
  "Quero cadastrar um produto novo",
  "Registrar uma despesa",
  "Abrir o cartão fidelidade",
];

export default function ChatAtomic({ conversasIniciais, ehDono = false }: { conversasIniciais: Conversa[]; ehDono?: boolean }) {
  const [conversas, setConversas] = useState(conversasIniciais);
  const [chatId, setChatId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  async function enviar(conteudo: string) {
    const t = conteudo.trim();
    if (!t || carregando) return;
    setTexto("");
    setErro("");
    setCarregando(true);
    setMensagens((m) => [...m, { role: "USER", content: t }]);

    try {
      const r = await enviarMensagem({ chatId, texto: t });
      if (r.chatId) setChatId(r.chatId);
      if (r.erro) setErro(r.erro);
      const resposta = r.resposta;
      if (resposta) setMensagens((m) => [...m, { role: "MODEL", content: resposta, propostas: r.propostas }]);
      setConversas(await listarConversas());
    } catch {
      setErro("Falha de comunicação com o servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function abrir(id: string) {
    setMenuAberto(false);
    setErro("");
    setCarregando(true);
    try {
      setMensagens(await carregarConversa(id));
      setChatId(id);
    } catch {
      setErro("Não foi possível abrir a conversa.");
    } finally {
      setCarregando(false);
    }
  }

  function nova() {
    setChatId(null);
    setMensagens([]);
    setErro("");
    setMenuAberto(false);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta conversa? Essa ação não pode ser desfeita.")) return;
    await excluirConversa(id);
    if (id === chatId) nova();
    setConversas(await listarConversas());
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-gold shrink-0">
            <IconeAtomo size={34} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-gold tracking-widest">ATOMIC</h1>
            <p className="text-gray-500 text-[10px] leading-tight">
              Analysis · Transactions · Operations · Management · Intelligence · Control
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {ehDono && (
            <Link href="/atomic/auditoria" className="border border-gold-dark rounded-lg px-3 py-1.5 text-gold text-sm">
              Auditoria
            </Link>
          )}
          <button
            onClick={() => setMenuAberto(true)}
            className="md:hidden border border-gold-dark rounded-lg px-3 py-1.5 text-gold text-sm"
          >
            Conversas
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-[1fr_16rem] gap-4">
        {/* Conversa atual */}
        <section className="border border-gold-dark/40 bg-black-soft rounded-xl flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {mensagens.length === 0 && !carregando && (
              <div className="m-auto text-center max-w-sm">
                <p className="text-gray-300 text-sm mb-1">Olá! Sou a ATOMIC. Consulto seus dados e preparo cadastros para você confirmar.</p>
                <p className="text-gray-500 text-xs mb-4">Por privacidade, evite digitar nomes de clientes.</p>
                <div className="flex flex-col gap-2">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      onClick={() => enviar(s)}
                      className="border border-gold-dark/40 rounded-lg px-3 py-2 text-gray-300 text-sm hover:border-gold transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 max-w-[85%] ${m.role === "USER" ? "self-end items-end" : "self-start items-start w-full"}`}
              >
                <div
                  className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap wrap-break-word ${
                    m.role === "USER"
                      ? "bg-gold/15 border border-gold/40 text-white"
                      : "bg-black-deep border border-gold-dark/30 text-gray-200"
                  }`}
                >
                  {m.content}
                </div>
                {m.propostas?.map((prop) => (
                  <PropostaCard key={prop.id} proposta={prop} />
                ))}
              </div>
            ))}

            {carregando && <p className="self-start text-gold text-xs animate-pulso-suave">ATOMIC está analisando...</p>}
            <div ref={fimRef} />
          </div>

          {erro && <p className="text-red-400 text-xs px-4 pb-2">{erro}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
            className="border-t border-gold-dark/30 p-3 flex gap-2"
          >
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Pergunte algo sobre o seu negócio..."
              className="flex-1 bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm resize-none"
            />
            <button
              type="submit"
              disabled={carregando || !texto.trim()}
              className="bg-gold text-black-deep font-semibold rounded-lg px-4 hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </section>

        {/* Menu de conversas (direita no computador; gaveta no celular) */}
        <aside
          className={`${menuAberto ? "fixed inset-0 z-50 bg-black/80 p-4 flex justify-end" : "hidden"} md:static md:block md:bg-transparent md:p-0`}
          onClick={() => setMenuAberto(false)}
        >
          <div
            className="bg-black-soft border border-gold-dark/40 rounded-xl p-4 w-72 md:w-auto h-full md:h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base text-gold">Conversas</h2>
              <button onClick={() => setMenuAberto(false)} className="md:hidden text-gray-400 text-xl leading-none">
                ×
              </button>
            </div>

            <button
              onClick={nova}
              className="w-full bg-gold text-black-deep font-semibold rounded-lg py-2 text-sm hover:bg-gold-light transition-colors mb-3"
            >
              + Nova conversa
            </button>

            {conversas.length === 0 && <p className="text-gray-500 text-xs">Nenhuma conversa ainda.</p>}
            <div className="flex flex-col gap-2">
              {conversas.map((c) => (
                <div
                  key={c.id}
                  className={`border rounded-lg p-2 ${c.id === chatId ? "border-gold bg-gold/10" : "border-gold-dark/20"}`}
                >
                  <button onClick={() => abrir(c.id)} className="text-left w-full">
                    <p className="text-gray-200 text-sm truncate">{c.title}</p>
                    <p className="text-gray-500 text-[10px]">
                      {new Date(c.updatedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </p>
                  </button>
                  <button onClick={() => excluir(c.id)} className="text-red-400 text-[10px] underline mt-1">
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}