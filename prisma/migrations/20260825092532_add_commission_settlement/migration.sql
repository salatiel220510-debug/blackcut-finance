-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "commissionSettled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CommissionSettlement" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "totalAcumulado" DECIMAL(10,2) NOT NULL,
    "valorPago" DECIMAL(10,2) NOT NULL,
    "valorAbsorvido" DECIMAL(10,2) NOT NULL,
    "expenseTransactionId" TEXT,
    "paidById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionSettlement_expenseTransactionId_key" ON "CommissionSettlement"("expenseTransactionId");

-- CreateIndex
CREATE INDEX "CommissionSettlement_barberId_idx" ON "CommissionSettlement"("barberId");

-- CreateIndex
CREATE INDEX "Transaction_commissionSettled_idx" ON "Transaction"("commissionSettled");

-- AddForeignKey
ALTER TABLE "CommissionSettlement" ADD CONSTRAINT "CommissionSettlement_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlement" ADD CONSTRAINT "CommissionSettlement_expenseTransactionId_fkey" FOREIGN KEY ("expenseTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSettlement" ADD CONSTRAINT "CommissionSettlement_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
