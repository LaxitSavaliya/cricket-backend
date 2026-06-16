/*
  Warnings:

  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BoundaryType" AS ENUM ('FOUR', 'SIX');

-- CreateEnum
CREATE TYPE "NoBallReason" AS ENUM ('OVERSTEP', 'BACK_FOOT_FAULT', 'ILLEGAL_ACTION', 'UNDERARM', 'BOUNCES_MORE_THAN_ONCE', 'ROLLING_BALL', 'PITCHED_OFF_PITCH', 'BALL_COMES_TO_REST', 'BOUNCER_OVER_HEAD', 'HIGH_FULL_TOSS', 'TOO_MANY_BOUNCERS', 'DANGEROUS_BOWLING', 'BOWLER_BREAKS_WICKET', 'FIELDER_INTERCEPTS_DELIVERY', 'WICKET_KEEPER_POSITION', 'FIELDING_RESTRICTION', 'OTHER');

-- CreateEnum
CREATE TYPE "WideReason" AS ENUM ('OUTSIDE_OFF', 'DOWN_LEG', 'TOO_FAR_FROM_BATTER', 'OTHER');

-- CreateEnum
CREATE TYPE "PenaltyRunReason" AS ENUM ('BALL_HIT_HELMET_ON_GROUND', 'FAKE_FIELDING', 'DELIBERATE_SHORT_RUN', 'BALL_TAMPERING', 'TIME_WASTING', 'PLAYER_MISCONDUCT', 'FIELDING_RESTRICTION', 'PITCH_DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "DismissalType" AS ENUM ('BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'HIT_BALL_TWICE', 'OBSTRUCTING_FIELD', 'TIMED_OUT', 'RETIRED_OUT');

-- CreateEnum
CREATE TYPE "DeadBallReason" AS ENUM ('OUTSIDE_PERSON_ON_FIELD', 'BATTER_DISTRACTED', 'PLAYER_INJURY', 'BALL_NOT_DELIVERED', 'UMPIRE_INTERVENTION', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('ODI', 'T20', 'T10');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MatchResultType" AS ENUM ('NORMAL', 'TIE', 'NO_RESULT', 'CANCELLED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "TossDecision" AS ENUM ('BAT', 'BOWL');

-- DropTable
DROP TABLE "Player";

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "role" "PlayerRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "shortName" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "matchFormat" "MatchFormat" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'COMPLETED',
    "matchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "venue" TEXT,
    "city" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "tossWinnerTeamId" TEXT,
    "tossDecision" "TossDecision",
    "winnerTeamId" TEXT,
    "resultType" "MatchResultType" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isPlayingEleven" BOOLEAN NOT NULL DEFAULT false,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isViceCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isWicketKeeper" BOOLEAN NOT NULL DEFAULT false,
    "battingOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balls" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inningsNo" INTEGER NOT NULL,
    "deliveryNo" INTEGER NOT NULL,
    "overNo" INTEGER NOT NULL,
    "ballNo" INTEGER NOT NULL,
    "strikerId" TEXT NOT NULL,
    "nonStrikerId" TEXT NOT NULL,
    "bowlerId" TEXT NOT NULL,
    "boundaryType" "BoundaryType",
    "isWide" BOOLEAN NOT NULL DEFAULT false,
    "isNoBall" BOOLEAN NOT NULL DEFAULT false,
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "isLegBye" BOOLEAN NOT NULL DEFAULT false,
    "isPenalty" BOOLEAN NOT NULL DEFAULT false,
    "isDeadBall" BOOLEAN NOT NULL DEFAULT false,
    "deadBallReason" "DeadBallReason",
    "noBallReasons" "NoBallReason"[] DEFAULT ARRAY[]::"NoBallReason"[],
    "wideReason" "WideReason",
    "penaltyRunReason" "PenaltyRunReason",
    "batterRuns" INTEGER NOT NULL DEFAULT 0,
    "noBallRuns" INTEGER NOT NULL DEFAULT 0,
    "wideRuns" INTEGER NOT NULL DEFAULT 0,
    "byeRuns" INTEGER NOT NULL DEFAULT 0,
    "legByeRuns" INTEGER NOT NULL DEFAULT 0,
    "penaltyRuns" INTEGER NOT NULL DEFAULT 0,
    "extraRuns" INTEGER NOT NULL DEFAULT 0,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "isWicket" BOOLEAN NOT NULL DEFAULT false,
    "dismissalType" "DismissalType",
    "dismissedPlayerId" TEXT,
    "fielderId" TEXT,
    "assistFielderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "players_playerName_idx" ON "players"("playerName");

-- CreateIndex
CREATE INDEX "players_displayName_idx" ON "players"("displayName");

-- CreateIndex
CREATE INDEX "players_role_idx" ON "players"("role");

-- CreateIndex
CREATE UNIQUE INDEX "players_playerName_displayName_key" ON "players"("playerName", "displayName");

-- CreateIndex
CREATE INDEX "teams_shortName_idx" ON "teams"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "teams_teamName_key" ON "teams"("teamName");

-- CreateIndex
CREATE INDEX "matches_matchDate_idx" ON "matches"("matchDate");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_matchFormat_idx" ON "matches"("matchFormat");

-- CreateIndex
CREATE INDEX "matches_homeTeamId_idx" ON "matches"("homeTeamId");

-- CreateIndex
CREATE INDEX "matches_awayTeamId_idx" ON "matches"("awayTeamId");

-- CreateIndex
CREATE INDEX "matches_tossWinnerTeamId_idx" ON "matches"("tossWinnerTeamId");

-- CreateIndex
CREATE INDEX "matches_winnerTeamId_idx" ON "matches"("winnerTeamId");

-- CreateIndex
CREATE INDEX "match_players_matchId_idx" ON "match_players"("matchId");

-- CreateIndex
CREATE INDEX "match_players_teamId_idx" ON "match_players"("teamId");

-- CreateIndex
CREATE INDEX "match_players_playerId_idx" ON "match_players"("playerId");

-- CreateIndex
CREATE INDEX "match_players_matchId_teamId_idx" ON "match_players"("matchId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_matchId_playerId_key" ON "match_players"("matchId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_matchId_teamId_battingOrder_key" ON "match_players"("matchId", "teamId", "battingOrder");

-- CreateIndex
CREATE INDEX "balls_matchId_idx" ON "balls"("matchId");

-- CreateIndex
CREATE INDEX "balls_matchId_inningsNo_idx" ON "balls"("matchId", "inningsNo");

-- CreateIndex
CREATE INDEX "balls_matchId_inningsNo_overNo_idx" ON "balls"("matchId", "inningsNo", "overNo");

-- CreateIndex
CREATE INDEX "balls_matchId_inningsNo_overNo_ballNo_idx" ON "balls"("matchId", "inningsNo", "overNo", "ballNo");

-- CreateIndex
CREATE INDEX "balls_strikerId_idx" ON "balls"("strikerId");

-- CreateIndex
CREATE INDEX "balls_nonStrikerId_idx" ON "balls"("nonStrikerId");

-- CreateIndex
CREATE INDEX "balls_bowlerId_idx" ON "balls"("bowlerId");

-- CreateIndex
CREATE INDEX "balls_dismissedPlayerId_idx" ON "balls"("dismissedPlayerId");

-- CreateIndex
CREATE INDEX "balls_fielderId_idx" ON "balls"("fielderId");

-- CreateIndex
CREATE INDEX "balls_assistFielderId_idx" ON "balls"("assistFielderId");

-- CreateIndex
CREATE UNIQUE INDEX "balls_matchId_inningsNo_deliveryNo_key" ON "balls"("matchId", "inningsNo", "deliveryNo");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tossWinnerTeamId_fkey" FOREIGN KEY ("tossWinnerTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_strikerId_fkey" FOREIGN KEY ("strikerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_nonStrikerId_fkey" FOREIGN KEY ("nonStrikerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_bowlerId_fkey" FOREIGN KEY ("bowlerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_dismissedPlayerId_fkey" FOREIGN KEY ("dismissedPlayerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_fielderId_fkey" FOREIGN KEY ("fielderId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balls" ADD CONSTRAINT "balls_assistFielderId_fkey" FOREIGN KEY ("assistFielderId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
