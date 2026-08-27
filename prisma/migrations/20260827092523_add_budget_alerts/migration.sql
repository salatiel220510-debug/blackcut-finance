-- CreateEnum
CREATE TYPE "BudgetAlertLevel" AS ENUM ('ATENCAO', 'ESTOURADO');

-- CreateTable
CREATE TABLE "BudgetAlert" (
    "id" TEXT NOT NULL,
    "expenseCategoryId" TEXT NOT NULL,
    "mes" TIMESTAMP(3) NOT NULL,
    "level" "BudgetAlertLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAlert_expenseCategoryId_mes_level_key" ON "BudgetAlert"("expenseCategoryId", "mes", "level");

-- AddForeignKey
ALTER TABLE "BudgetAlert" ADD CONSTRAINT "BudgetAlert_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
