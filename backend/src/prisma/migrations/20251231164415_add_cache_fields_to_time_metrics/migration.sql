-- AlterTable
ALTER TABLE "TimeMetrics" ADD COLUMN     "cachedAttachmentNames" TEXT[],
ADD COLUMN     "cachedOptions" JSONB,
ADD COLUMN     "cachedQuery" TEXT,
ADD COLUMN     "isCached" BOOLEAN NOT NULL DEFAULT false;
