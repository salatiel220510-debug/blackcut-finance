/*
  Warnings:

  - You are about to drop the column `active` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "active",
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'PENDING';
