/*
  Warnings:

  - Added the required column `tournamentId` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_inningId_fkey";

-- DropForeignKey
ALTER TABLE "match_innings" DROP CONSTRAINT "match_innings_matchId_fkey";

-- DropForeignKey
ALTER TABLE "match_players" DROP CONSTRAINT "match_players_matchId_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_userId_fkey";

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "tournamentId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_name_idx" ON "tournaments"("name");

-- CreateIndex
CREATE INDEX "tournaments_city_idx" ON "tournaments"("city");

-- CreateIndex
CREATE INDEX "tournaments_state_idx" ON "tournaments"("state");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_inningId_fkey" FOREIGN KEY ("inningId") REFERENCES "match_innings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
