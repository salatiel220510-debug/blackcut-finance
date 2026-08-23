-- CreateEnum
CREATE TYPE "ExpenseCategoryType" AS ENUM ('FIXED', 'VARIABLE', 'INVESTMENT', 'MARKETING');

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "envelopeOperacionalPct" DECIMAL(5,2) NOT NULL DEFAULT 60,
ADD COLUMN     "envelopeProLaborePct" DECIMAL(5,2) NOT NULL DEFAULT 30,
ADD COLUMN     "envelopeReservaPct" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "envelopesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "proLaboreMeta" DECIMAL(10,2),
ADD COLUMN     "reservaMeta" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "expenseCategoryId" TEXT;

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ExpenseCategoryType" NOT NULL,
    "budgetLimit" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyClosure" (
    "id" TEXT NOT NULL,
    "mes" TIMESTAMP(3) NOT NULL,
    "faturamentoBruto" DECIMAL(10,2) NOT NULL,
    "totalDespesasFixas" DECIMAL(10,2) NOT NULL,
    "totalDespesasVariaveis" DECIMAL(10,2) NOT NULL,
    "totalInvestimento" DECIMAL(10,2) NOT NULL,
    "totalMarketing" DECIMAL(10,2) NOT NULL,
    "totalDespesas" DECIMAL(10,2) NOT NULL,
    "totalComissoes" DECIMAL(10,2) NOT NULL,
    "lucroLiquido" DECIMAL(10,2) NOT NULL,
    "envelopeOperacional" DECIMAL(10,2) NOT NULL,
    "envelopeProLabore" DECIMAL(10,2) NOT NULL,
    "envelopeReserva" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "ExpenseCategory_type_idx" ON "ExpenseCategory"("type");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyClosure_mes_key" ON "MonthlyClosure"("mes");

-- CreateIndex
CREATE INDEX "Transaction_expenseCategoryId_idx" ON "Transaction"("expenseCategoryId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
