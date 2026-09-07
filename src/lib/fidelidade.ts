import { prisma } from "@/lib/prisma";

function normalizarNome(nome: string) {
  return nome.trim().toLowerCase();
}

export async function buscarOuCriarCartao(clienteNome: string) {
  const normalizado = normalizarNome(clienteNome);
  if (!normalizado) return null;

  const existente = await prisma.loyaltyCard.findUnique({ where: { clienteNomeNormalizado: normalizado } });
  if (existente) return existente;

  return prisma.loyaltyCard.create({
    data: { clienteNome: clienteNome.trim(), clienteNomeNormalizado: normalizado },
  });
}

export async function marcarCartao(clienteNome: string) {
  const cartao = await buscarOuCriarCartao(clienteNome);
  if (!cartao) throw new Error("Nome de cliente inválido.");

  const marcaAtingida = cartao.marcasAtuais + 1;
  const completou = marcaAtingida >= 10;
  const mostrarMensagem = marcaAtingida === 5 || completou;

  const atualizado = await prisma.loyaltyCard.update({
    where: { id: cartao.id },
    data: completou
      ? { marcasAtuais: 0, cartoesCompletos: { increment: 1 } }
      : { marcasAtuais: marcaAtingida },
  });

  return { cartao: atualizado, mostrarMensagem, completou };
}