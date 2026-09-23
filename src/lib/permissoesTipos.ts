export type ChavePermissao =
  | "verFaturamentoCompleto"
  | "fecharBarbearia"
  | "verFidelidadeGestao"
  | "verFechamentoMensal"
  | "abrirFecharCaixa"
  | "registrarSangriaSuprimento"
  | "verRelatosEquipe"
  | "verComissoesTodos"
  | "verCupons"
  | "criarDespesasComanda";

export const PERMISSOES_LABEL: Record<ChavePermissao, string> = {
  verFaturamentoCompleto: "Ver faturamento e indicadores da barbearia (Início)",
  fecharBarbearia: "Fechar a barbearia no fim do expediente",
  verFidelidadeGestao: "Gerenciar cartões fidelidade de todos os clientes",
  verFechamentoMensal: "Ver e realizar o Fechamento Mensal",
  abrirFecharCaixa: "Abrir e fechar a sessão de caixa",
  registrarSangriaSuprimento: "Registrar sangria e suprimento",
  verRelatosEquipe: "Ver e gerenciar os relatos de toda a equipe",
  verComissoesTodos: "Ver e pagar comissões de todos os barbeiros",
  verCupons: "Ver cupons e horas trabalhadas da barbearia",
  criarDespesasComanda: "Registrar despesas na Comanda (além de serviços)",
};