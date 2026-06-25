CREATE TYPE "LLMProvider" AS ENUM ('GEMINI', 'OPENAI', 'ANTHROPIC');

CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "LLMProvider" NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyPreview" TEXT NOT NULL,
    "selectedModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderCredential_userId_provider_key" ON "ProviderCredential"("userId", "provider");

CREATE INDEX "ProviderCredential_userId_idx" ON "ProviderCredential"("userId");

ALTER TABLE "ProviderCredential" ADD CONSTRAINT "ProviderCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;