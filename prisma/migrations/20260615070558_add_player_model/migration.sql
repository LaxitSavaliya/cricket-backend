-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN', 'WICKET_KEEPER_ALL_ROUNDER');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "displayName" TEXT,
    "photoUrl" TEXT,
    "role" "PlayerRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Player_playerName_idx" ON "Player"("playerName");

-- CreateIndex
CREATE INDEX "Player_displayName_idx" ON "Player"("displayName");

-- CreateIndex
CREATE INDEX "Player_role_idx" ON "Player"("role");
