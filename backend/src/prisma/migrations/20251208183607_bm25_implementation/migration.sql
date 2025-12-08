-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "bm25indexStatus" TEXT,
ADD COLUMN     "bm25indexedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BM25IndexMeta" (
    "attachmentId" TEXT NOT NULL,
    "totalDocs" INTEGER NOT NULL,
    "avgChunkLength" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BM25IndexMeta_pkey" PRIMARY KEY ("attachmentId")
);

-- CreateTable
CREATE TABLE "BM25IndexEntry" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "tf" INTEGER NOT NULL,
    "df" INTEGER NOT NULL,
    "chunkLength" INTEGER NOT NULL,
    "avgChunkLength" DOUBLE PRECISION NOT NULL,
    "totalDocs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BM25IndexEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BM25IndexEntry_attachmentId_term_idx" ON "BM25IndexEntry"("attachmentId", "term");

-- CreateIndex
CREATE INDEX "BM25IndexEntry_attachmentId_chunkIndex_idx" ON "BM25IndexEntry"("attachmentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "BM25IndexMeta" ADD CONSTRAINT "BM25IndexMeta_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BM25IndexEntry" ADD CONSTRAINT "BM25IndexEntry_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
