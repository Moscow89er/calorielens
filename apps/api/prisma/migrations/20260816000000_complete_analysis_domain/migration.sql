-- CreateEnum
CREATE TYPE "AnalysisSource" AS ENUM ('DEMO', 'VISION');

-- AlterTable
ALTER TABLE "analyses" RENAME COLUMN "imagePath" TO "imageKey";
ALTER TABLE "analyses" ADD COLUMN "imageMimeType" TEXT NOT NULL DEFAULT 'image/jpeg';
ALTER TABLE "analyses" ADD COLUMN "source" "AnalysisSource" NOT NULL DEFAULT 'DEMO';
ALTER TABLE "analyses" ALTER COLUMN "imageMimeType" DROP DEFAULT;
ALTER TABLE "analyses" ALTER COLUMN "source" DROP DEFAULT;

-- Replace the separate indexes with the access pattern used by the history endpoint.
DROP INDEX "analyses_userId_idx";
DROP INDEX "analyses_createdAt_idx";
CREATE INDEX "analyses_userId_createdAt_id_idx"
ON "analyses"("userId", "createdAt" DESC, "id" DESC);
