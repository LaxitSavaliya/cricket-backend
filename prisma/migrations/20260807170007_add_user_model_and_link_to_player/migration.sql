/*
  Warnings:

  - You are about to drop the column `playerName` on the `players` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "players_playerName_idx";

-- AlterTable
ALTER TABLE "players" DROP COLUMN "playerName",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isMobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");

-- CreateIndex
CREATE INDEX "players_name_idx" ON "players"("name");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
