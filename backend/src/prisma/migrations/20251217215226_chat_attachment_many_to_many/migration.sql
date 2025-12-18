/*
  Warnings:

  - You are about to drop the column `chatId` on the `Attachment` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `Attachment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Attachment" DROP CONSTRAINT "Attachment_chatId_fkey";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "chatId",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ChatAttachment" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatAttachment_chatId_idx" ON "ChatAttachment"("chatId");

-- CreateIndex
CREATE INDEX "ChatAttachment_attachmentId_idx" ON "ChatAttachment"("attachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAttachment_chatId_attachmentId_key" ON "ChatAttachment"("chatId", "attachmentId");

-- AddForeignKey
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAttachment" ADD CONSTRAINT "ChatAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
