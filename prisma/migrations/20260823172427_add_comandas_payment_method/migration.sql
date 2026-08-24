-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "clienteNome" TEXT,
ADD COLUMN     "comandaId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod";

-- CreateIndex
CREATE INDEX "Transaction_comandaId_idx" ON "Transaction"("comandaId");
