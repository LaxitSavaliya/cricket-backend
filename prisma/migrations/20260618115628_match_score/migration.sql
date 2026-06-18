/*
  Warnings:

  - You are about to drop the column `firstIningOvers` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `firstIningRuns` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `firstIningWickets` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `secondIningOvers` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `secondIningRuns` on the `match_players` table. All the data in the column will be lost.
  - You are about to drop the column `secondIningWickets` on the `match_players` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "match_players" DROP COLUMN "firstIningOvers",
DROP COLUMN "firstIningRuns",
DROP COLUMN "firstIningWickets",
DROP COLUMN "secondIningOvers",
DROP COLUMN "secondIningRuns",
DROP COLUMN "secondIningWickets";

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "firstIningOvers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "firstIningRuns" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "firstIningWickets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "secondIningOvers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "secondIningRuns" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "secondIningWickets" INTEGER NOT NULL DEFAULT 0;
