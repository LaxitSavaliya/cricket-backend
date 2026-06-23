/*
  Warnings:

  - A unique constraint covering the columns `[matchId,teamId,order]` on the table `match_players` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "match_players" ADD COLUMN     "order" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "match_players_matchId_teamId_order_key" ON "match_players"("matchId", "teamId", "order");
