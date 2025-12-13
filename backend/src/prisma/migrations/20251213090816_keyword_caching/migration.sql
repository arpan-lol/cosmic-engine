-- CreateTable
CREATE TABLE "QueryRequestCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "attachments" TEXT[],
    "options" JSONB NOT NULL,
    "assistantMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryRequestCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QueryRequestCache_cacheKey_key" ON "QueryRequestCache"("cacheKey");

-- CreateIndex
CREATE INDEX "QueryRequestCache_sessionId_idx" ON "QueryRequestCache"("sessionId");
