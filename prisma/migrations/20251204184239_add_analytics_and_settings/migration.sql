-- CreateTable
CREATE TABLE "GameAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "totalPlaytimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameAnalytics_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "trackImpressions" BOOLEAN NOT NULL DEFAULT true,
    "trackPlays" BOOLEAN NOT NULL DEFAULT true,
    "trackPlaytime" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "GameAnalytics_gameId_idx" ON "GameAnalytics"("gameId");

-- CreateIndex
CREATE INDEX "GameAnalytics_shop_idx" ON "GameAnalytics"("shop");

-- CreateIndex
CREATE INDEX "GameAnalytics_date_idx" ON "GameAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
