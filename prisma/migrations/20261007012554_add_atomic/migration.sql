-- CreateEnum
CREATE TYPE "AtomicRole" AS ENUM ('USER', 'MODEL');

-- CreateTable
CREATE TABLE "AtomicChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nova conversa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtomicChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtomicMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" "AtomicRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtomicMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtomicToolLog" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtomicToolLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtomicChat_userId_updatedAt_idx" ON "AtomicChat"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AtomicMessage_chatId_createdAt_idx" ON "AtomicMessage"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "AtomicToolLog_chatId_idx" ON "AtomicToolLog"("chatId");

-- CreateIndex
CREATE INDEX "AtomicToolLog_userId_createdAt_idx" ON "AtomicToolLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AtomicChat" ADD CONSTRAINT "AtomicChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtomicMessage" ADD CONSTRAINT "AtomicMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AtomicChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
