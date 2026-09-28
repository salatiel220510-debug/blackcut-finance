"use client";
import { useState } from "react";
import { excluirBarbeiro, redefinirSenhaBarbeiro, atualizarPermissoesBarbeiro } from "./actions";
import { PERMISSOES_LABEL, ChavePermissao } from "@/lib/permissoesTipos";

const CHAVES_PERMISSAO: ChavePermissao[] = [
  "verFaturamentoCompleto", "fecharBarbearia", "verFidelidadeGestao", "verFechamentoMensal",
  "abrirFecharCaixa", "registrarSangriaSuprimento", "verRelatosEquipe", "verComissoesTodos", "verCupons",
  "criarDespesasComanda", "gerenciarProdutos",
];

type Barbeiro = { id: string; name: string; email: string; permissoes: Record<ChavePermissao, boolean> };

function gerarSenhaAleatoria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let resultado = "";
  for (let i = 0; i < 10; i++) resultado += chars[Math.floor(Math.random() * chars.length)];
  return resultado;
}

export default function CardBarbeiro({ barbeiro }: { barbeiro: Barbeiro }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="text-left border border-gold-dark/40 bg-black-soft rounded-xl p-4 hover:border-gold transition-colors"
      >
        <strong className="text-white block">{barbeiro.name}</strong>
        <span className="text-gray-400 text-xs">{barbeiro.email}</span>
      </button>

      {aberto && <ModalDetalheBarbeiro barbeiro={barbeiro} onFechar={() => setAberto(false)} />}
    </>
  );
}

function ModalDetalheBarbeiro({ barbeiro, onFechar }: { barbeiro: Barbeiro; onFechar: () => void }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaDefinida, setSenhaDefinida] = useState<string | null>(null);
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [carregandoSenha, setCarregandoSenha] = useState(false);
  const [mensagemPermissoes, setMensagemPermissoes] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  async function handleDefinirSenha(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregandoSenha(true);
    setMensagemSenha("");
    const formData = new FormData(e.currentTarget);
    const resultado = await redefinirSenhaBarbeiro(barbeiro.id, formData);
    setCarregandoSenha(false);

    if (resultado?.erro) {
      setMensagemSenha(resultado.erro);
    } else {
      setSenhaDefinida(novaSenha);
      setMensagemSenha("Senha atualizada! O barbeiro precisará usar o código de acesso no próximo login.");
    }
  }

  async function handlePermissoes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const resultado = await atualizarPermissoesBarbeiro(barbeiro.id, new FormData(e.currentTarget));
    setMensagemPermissoes(resultado?.sucesso === false ? "Não foi possível atualizar as permissões." : "Permissões atualizadas!");
  }

  async function handleExcluir() {
    if (!confirm(`Remover o acesso de ${barbeiro.name}? O histórico financeiro dele é mantido, mas ele não conseguirá mais fazer login.`)) return;
    setExcluindo(true);
    await excluirBarbeiro(barbeiro.id);
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-8" onClick={onFechar}>
      <div className="bg-black-soft border border-gold rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-1">
          <h2 className="font-display text-xl text-gold">{barbeiro.name}</h2>
          <button onClick={onFechar} className="text-gray-400 text-xl leading-none">×</button>
        </div>
        <p className="text-gray-400 text-sm mb-5">{barbeiro.email}</p>

        <section className="border border-gold-dark/30 rounded-lg p-4 mb-5">
          <h3 className="text-gold text-sm font-semibold mb-2">Senha de acesso</h3>
          <p className="text-gray-400 text-xs mb-3">
            Por segurança, a senha atual não pode ser exibida — ela é guardada de um jeito que nem o próprio sistema consegue ler de volta.
            Você pode definir uma nova senha para o barbeiro agora.
          </p>

          {senhaDefinida ? (
            <div className="bg-gold/10 border border-gold rounded-lg p-3">
              <p className="text-gray-300 text-xs mb-1">Nova senha (anote agora — não será mostrada de novo):</p>
              <p className="text-gold font-mono text-lg tracking-wider select-all">{senhaDefinida}</p>
            </div>
          ) : (
            <form onSubmit={handleDefinirSenha} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  name="novaSenha" type="text" required minLength={6} value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Nova senha"
                  className="flex-1 bg-black-deep border border-gold-dark/40 rounded-lg px-3 py-2 text-white text-sm"
                />
                <button type="button" onClick={() => setNovaSenha(gerarSenhaAleatoria())} className="bg-gold-dark text-black-deep text-xs font-semibold rounded-lg px-3 whitespace-nowrap">
                  Gerar
                </button>
              </div>
              <button type="submit" disabled={carregandoSenha || novaSenha.length < 6} className="bg-gold text-black-deep font-semibold rounded-lg py-2 text-sm disabled:opacity-50">
                {carregandoSenha ? "Salvando..." : "Definir Nova Senha"}
              </button>
              {mensagemSenha && <p className="text-red-400 text-xs">{mensagemSenha}</p>}
            </form>
          )}
        </section>

        <section className="border border-gold-dark/30 rounded-lg p-4 mb-5">
          <h3 className="text-gold text-sm font-semibold mb-3">Permissões</h3>
          <form onSubmit={handlePermissoes} className="flex flex-col gap-2">
            {CHAVES_PERMISSAO.map((chave) => (
              <label key={chave} className="flex items-center gap-3 border border-gold-dark/10 rounded-lg p-2.5 cursor-pointer hover:border-gold-dark/40 transition-colors">
                <input type="checkbox" name={chave} defaultChecked={barbeiro.permissoes[chave]} className="w-5 h-5 accent-current text-gold" />
                <span className="text-gray-200 text-xs">{PERMISSOES_LABEL[chave]}</span>
              </label>
            ))}
            <button type="submit" className="bg-gold text-black-deep font-semibold rounded-lg py-2 text-sm mt-1">
              Salvar Permissões
            </button>
            {mensagemPermissoes && <p className="text-gold text-xs">{mensagemPermissoes}</p>}
          </form>
        </section>

        <button
          onClick={handleExcluir}
          disabled={excluindo}
          className="w-full border border-red-500 text-red-400 font-semibold rounded-lg py-2.5 text-sm hover:bg-red-500 hover:text-black-deep transition-colors disabled:opacity-50"
        >
          {excluindo ? "Removendo..." : "Excluir Barbeiro"}
        </button>
      </div>
    </div>
  );
}