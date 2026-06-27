UPDATE "User" SET "selectedModel" = 'cosmicengine:gemini-2.5-flash' WHERE "selectedModel" = 'google:gemini-2.5-flash';

ALTER TABLE "User" ALTER COLUMN "selectedModel" SET DEFAULT 'cosmicengine:gemini-2.5-flash';