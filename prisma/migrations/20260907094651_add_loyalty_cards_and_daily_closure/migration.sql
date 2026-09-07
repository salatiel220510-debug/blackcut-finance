-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "observacao" TEXT;

-- CreateTable
CREATE TABLE "LoyaltyCard" (
    "id" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteNomeNormalizado" TEXT NOT NULL,
    "marcasAtuais" INTEGER NOT NULL DEFAULT 0,
    "cartoesCompletos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyClosure" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "closedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCard_clienteNomeNormalizado_key" ON "LoyaltyCard"("clienteNomeNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "DailyClosure_data_key" ON "DailyClosure"("data");

-- AddForeignKey
ALTER TABLE "DailyClosure" ADD CONSTRAINT "DailyClosure_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
