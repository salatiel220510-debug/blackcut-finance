-- CreateEnum
CREATE TYPE "AtomicProposalType" AS ENUM ('SERVICO', 'PRODUTO', 'DESPESA', 'FIDELIDADE');

-- CreateEnum
CREATE TYPE "AtomicProposalStatus" AS ENUM ('PENDENTE', 'EXECUTANDO', 'CONFIRMADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "AtomicProposal" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "AtomicProposalType" NOT NULL,
    "data" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "AtomicProposalStatus" NOT NULL DEFAULT 'PENDENTE',
    "confirmed" JSONB,
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "AtomicProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtomicProposal_chatId_idx" ON "AtomicProposal"("chatId");

-- CreateIndex
CREATE INDEX "AtomicProposal_messageId_idx" ON "AtomicProposal"("messageId");

-- CreateIndex
CREATE INDEX "AtomicProposal_userId_createdAt_idx" ON "AtomicProposal"("userId", "createdAt");
