/*
  Warnings:

  - Added the required column `commentaryText` to the `balls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "balls" ADD COLUMN     "commentaryText" TEXT NOT NULL;
