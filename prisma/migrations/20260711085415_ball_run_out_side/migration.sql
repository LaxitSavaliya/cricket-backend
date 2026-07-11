/*
  Warnings:

  - The values [RETIRED_HURT] on the enum `DismissalType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PitchEnd" AS ENUM ('STRIKER_END', 'BOWLER_END');

-- AlterEnum
BEGIN;
CREATE TYPE "DismissalType_new" AS ENUM ('BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'HIT_BALL_TWICE', 'OBSTRUCTING_FIELD', 'TIMED_OUT', 'RETIRED_OUT');
ALTER TABLE "match_players" ALTER COLUMN "dismissalType" TYPE "DismissalType_new" USING ("dismissalType"::text::"DismissalType_new");
ALTER TABLE "balls" ALTER COLUMN "dismissalType" TYPE "DismissalType_new" USING ("dismissalType"::text::"DismissalType_new");
ALTER TYPE "DismissalType" RENAME TO "DismissalType_old";
ALTER TYPE "DismissalType_new" RENAME TO "DismissalType";
DROP TYPE "public"."DismissalType_old";
COMMIT;

-- AlterTable
ALTER TABLE "balls" ADD COLUMN     "isDotBall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "runOutEnd" "PitchEnd";
