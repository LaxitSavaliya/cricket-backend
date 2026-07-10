/*
  Warnings:

  - The values [WICKET_KEEPER,WICKET_KEEPER_BATSMAN,WICKET_KEEPER_ALL_ROUNDER] on the enum `PlayerRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assistFielderId` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `boundaryType` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `bowlerId` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `dismissedPlayerId` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `fielderId` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `inningsNo` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `nonStrikerId` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `strikerId` on the `balls` table. All the data in the column will be lost.
  - You are about to drop the column `battingOrder` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `isPlayingEleven` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `isWicketKeeper` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `firstIningOvers` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `firstIningRuns` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `firstIningWickets` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `matchTextResult` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `resultType` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `secondIningOvers` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `secondIningRuns` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `secondIningWickets` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `winnerTeamId` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `shortName` on the `teams` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[inningId,deliveryNo]` on the table `balls` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `matches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bowlerMatchPlayerId` to the `balls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inningId` to the `balls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nonStrikerMatchPlayerId` to the `balls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strikerMatchPlayerId` to the `balls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `matches` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `slug` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchInningNo" AS ENUM ('FIRST', 'SECOND');

-- CreateEnum
CREATE TYPE "MatchInningStatus" AS ENUM ('NOT_STARTED', 'LIVE', 'COMPLETED');

-- AlterEnum
ALTER TYPE "DismissalType" ADD VALUE 'RETIRED_HURT';

-- AlterEnum
BEGIN;
CREATE TYPE "PlayerRole_new" AS ENUM ('BATSMAN', 'BOWLER', 'ALL_ROUNDER');
ALTER TABLE "players" ALTER COLUMN "role" TYPE "PlayerRole_new" USING ("role"::text::"PlayerRole_new");
ALTER TYPE "PlayerRole" RENAME TO "PlayerRole_old";
ALTER TYPE "PlayerRole_new" RENAME TO "PlayerRole";
DROP TYPE "public"."PlayerRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_assistFielderId_fkey";

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_bowlerId_fkey";

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_dismissedPlayerId_fkey";

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_fielderId_fkey";

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_matchId_fkey";

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_nonStrikerId_fkey";

-- DropForeignKey
ALTER TABLE "balls" DROP CONSTRAINT "balls_strikerId_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_winnerTeamId_fkey";

-- DropIndex
DROP INDEX "balls_assistFielderId_idx";

-- DropIndex
DROP INDEX "balls_bowlerId_idx";

-- DropIndex
DROP INDEX "balls_dismissedPlayerId_idx";

-- DropIndex
DROP INDEX "balls_fielderId_idx";

-- DropIndex
DROP INDEX "balls_matchId_idx";

-- DropIndex
DROP INDEX "balls_matchId_inningsNo_deliveryNo_key";

-- DropIndex
DROP INDEX "balls_matchId_inningsNo_idx";

-- DropIndex
DROP INDEX "balls_matchId_inningsNo_overNo_ballNo_idx";

-- DropIndex
DROP INDEX "balls_matchId_inningsNo_overNo_idx";

-- DropIndex
DROP INDEX "balls_nonStrikerId_idx";

-- DropIndex
DROP INDEX "balls_strikerId_idx";

-- DropIndex
DROP INDEX "match_players_matchId_idx";

-- DropIndex
DROP INDEX "match_players_matchId_teamId_battingOrder_key";

-- DropIndex
DROP INDEX "match_players_matchId_teamId_order_key";

-- DropIndex
DROP INDEX "matches_status_idx";

-- DropIndex
DROP INDEX "matches_winnerTeamId_idx";

-- DropIndex
DROP INDEX "players_playerName_displayName_key";

-- DropIndex
DROP INDEX "teams_shortName_idx";

-- AlterTable
ALTER TABLE "balls" DROP COLUMN "assistFielderId",
DROP COLUMN "boundaryType",
DROP COLUMN "bowlerId",
DROP COLUMN "dismissedPlayerId",
DROP COLUMN "fielderId",
DROP COLUMN "inningsNo",
DROP COLUMN "matchId",
DROP COLUMN "nonStrikerId",
DROP COLUMN "strikerId",
ADD COLUMN     "assistFielderMatchPlayerId" TEXT,
ADD COLUMN     "bowlerMatchPlayerId" TEXT NOT NULL,
ADD COLUMN     "dismissedMatchPlayerId" TEXT,
ADD COLUMN     "fielderMatchPlayerId" TEXT,
ADD COLUMN     "inningId" TEXT NOT NULL,
ADD COLUMN     "isFour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLegalDelivery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isSix" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nonStrikerMatchPlayerId" TEXT NOT NULL,
ADD COLUMN     "strikerMatchPlayerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "match_players" DROP COLUMN "battingOrder",
DROP COLUMN "isPlayingEleven",
DROP COLUMN "isWicketKeeper",
DROP COLUMN "order",
ADD COLUMN     "ballsFaced" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "battingDotBalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bowlingDotBalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "catchAssists" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "catches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "didBat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "didBowl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dismissalType" "DismissalType",
ADD COLUMN     "doubles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "doublesConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fiveWicketsInFiveBalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fourWicketsInFourBalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "foursConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hatTricks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPlaying" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legalBallsBowled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maidens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "noBallDeliveries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runOutAssists" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runOuts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runningFours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runningFoursConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runsConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runsScored" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "singles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "singlesConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sixWicketsInSixBalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sixes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sixesConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stumpings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "triples" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "triplesConceded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "twoWicketsInTwoBalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wickets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wideDeliveries" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "firstIningOvers",
DROP COLUMN "firstIningRuns",
DROP COLUMN "firstIningWickets",
DROP COLUMN "matchTextResult",
DROP COLUMN "resultType",
DROP COLUMN "secondIningOvers",
DROP COLUMN "secondIningRuns",
DROP COLUMN "secondIningWickets",
DROP COLUMN "winnerTeamId",
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'UPCOMING',
ALTER COLUMN "matchDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "canKeepWickets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "displayName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "shortName",
ADD COLUMN     "slug" TEXT NOT NULL;

-- DropEnum
DROP TYPE "BoundaryType";

-- DropEnum
DROP TYPE "MatchResultType";

-- CreateTable
CREATE TABLE "match_innings" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "inningsNo" "MatchInningNo" NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "maxOvers" INTEGER NOT NULL,
    "status" "MatchInningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "target" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_innings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_innings_matchId_status_idx" ON "match_innings"("matchId", "status");

-- CreateIndex
CREATE INDEX "match_innings_teamId_idx" ON "match_innings"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "match_innings_matchId_inningsNo_key" ON "match_innings"("matchId", "inningsNo");

-- CreateIndex
CREATE INDEX "balls_inningId_overNo_ballNo_idx" ON "balls"("inningId", "overNo", "ballNo");

-- CreateIndex
CREATE INDEX "balls_strikerMatchPlayerId_idx" ON "balls"("strikerMatchPlayerId");

-- CreateIndex
CREATE INDEX "balls_nonStrikerMatchPlayerId_idx" ON "balls"("nonStrikerMatchPlayerId");

-- CreateIndex
CREATE INDEX "balls_bowlerMatchPlayerId_idx" ON "balls"("bowlerMatchPlayerId");

-- CreateIndex
CREATE INDEX "balls_dismissedMatchPlayerId_idx" ON "balls"("dismissedMatchPlayerId");

-- CreateIndex
CREATE INDEX "balls_fielderMatchPlayerId_idx" ON "balls"("fielderMatchPlayerId");

-- CreateIndex
CREATE INDEX "balls_assistFielderMatchPlayerId_idx" ON "balls"("assistFielderMatchPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "balls_inningId_deliveryNo_key" ON "balls"("inningId", "deliveryNo");

-- CreateIndex
CREATE INDEX "match_players_matchId_teamId_isPlaying_idx" ON "match_players"("matchId", "teamId", "isPlaying");

-- CreateIndex
CREATE UNIQUE INDEX "matches_slug_key" ON "matches"("slug");

-- CreateIndex
CREATE INDEX "matches_title_idx" ON "matches"("title");

-- CreateIndex
CREATE INDEX "matches_status_matchDate_idx" ON "matches"("status", "matchDate");

-- CreateIndex
CREATE UNIQUE INDEX "players_slug_key" ON "players"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_innings" ADD CONSTRAINT "match_innings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_inningId_fkey" FOREIGN KEY ("inningId") REFERENCES "match_innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_strikerMatchPlayerId_fkey" FOREIGN KEY ("strikerMatchPlayerId") REFERENCES "match_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_nonStrikerMatchPlayerId_fkey" FOREIGN KEY ("nonStrikerMatchPlayerId") REFERENCES "match_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_bowlerMatchPlayerId_fkey" FOREIGN KEY ("bowlerMatchPlayerId") REFERENCES "match_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_dismissedMatchPlayerId_fkey" FOREIGN KEY ("dismissedMatchPlayerId") REFERENCES "match_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_fielderMatchPlayerId_fkey" FOREIGN KEY ("fielderMatchPlayerId") REFERENCES "match_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_assistFielderMatchPlayerId_fkey" FOREIGN KEY ("assistFielderMatchPlayerId") REFERENCES "match_players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
