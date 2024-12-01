/*
  Warnings:

  - Added the required column `game` to the `ChessGame` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChessGame" ADD COLUMN     "game" TEXT NOT NULL;
