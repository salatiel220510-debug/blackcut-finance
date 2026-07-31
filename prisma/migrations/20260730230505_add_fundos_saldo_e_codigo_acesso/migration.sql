-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "accessCode" TEXT,
ADD COLUMN     "accessCodeUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "saldoBancario" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "needsAccessCode" BOOLEAN NOT NULL DEFAULT false;
