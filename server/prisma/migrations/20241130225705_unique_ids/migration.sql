/*
  Warnings:

  - A unique constraint covering the columns `[game]` on the table `ChessGame` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChessGame_game_key" ON "ChessGame"("game");
