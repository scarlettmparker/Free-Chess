-- CreateTable
CREATE TABLE "ChessGame" (
    "id" SERIAL NOT NULL,
    "moves" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "fen" TEXT NOT NULL DEFAULT 'none',
    "victorId" INTEGER,
    "whiteId" INTEGER,
    "blackId" INTEGER,

    CONSTRAINT "ChessGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_token_key" ON "User"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_token_key" ON "User"("username", "token");

-- AddForeignKey
ALTER TABLE "ChessGame" ADD CONSTRAINT "ChessGame_victorId_fkey" FOREIGN KEY ("victorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessGame" ADD CONSTRAINT "ChessGame_whiteId_fkey" FOREIGN KEY ("whiteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessGame" ADD CONSTRAINT "ChessGame_blackId_fkey" FOREIGN KEY ("blackId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
