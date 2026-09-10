-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PROBLEMA', 'MELHORIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('ABERTO', 'RESOLVIDO');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "linkLabel" TEXT,
ADD COLUMN     "linkUrl" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "taxaCredito" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxaDebito" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxaPix" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'ABERTO',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
