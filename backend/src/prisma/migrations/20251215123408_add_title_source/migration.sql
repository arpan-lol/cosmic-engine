-- CreateEnum
CREATE TYPE "TitleSource" AS ENUM ('USER_PROVIDED', 'USER_EDITED', 'AI_GENERATED', 'DEFAULT');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "titleSource" "TitleSource" NOT NULL DEFAULT 'DEFAULT';
