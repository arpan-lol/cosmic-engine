-- CreateTable
CREATE TABLE "TimeMetrics" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "totalRequestMs" INTEGER NOT NULL,
    "queryExpansionMs" INTEGER,
    "retrievalMs" INTEGER,
    "embeddingMs" INTEGER,
    "vectorSearchMs" INTEGER,
    "bm25SearchMs" INTEGER,
    "rankingMs" INTEGER,
    "hydrationMs" INTEGER,
    "perAttachmentMs" JSONB,
    "promptBuildingMs" INTEGER,
    "firstTokenMs" INTEGER,
    "streamingMs" INTEGER,
    "total" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeMetrics_chatId_key" ON "TimeMetrics"("chatId");

-- CreateIndex
CREATE INDEX "TimeMetrics_chatId_idx" ON "TimeMetrics"("chatId");

-- AddForeignKey
ALTER TABLE "TimeMetrics" ADD CONSTRAINT "TimeMetrics_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
