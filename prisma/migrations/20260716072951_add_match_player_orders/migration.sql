-- AlterTable
ALTER TABLE "match_players" ADD COLUMN     "battingOrder" INTEGER,
ADD COLUMN     "lineupOrder" INTEGER;

-- CreateIndex
CREATE INDEX "match_players_matchId_teamId_lineupOrder_idx" ON "match_players"("matchId", "teamId", "lineupOrder");

-- CreateIndex
CREATE INDEX "match_players_matchId_teamId_battingOrder_idx" ON "match_players"("matchId", "teamId", "battingOrder");
