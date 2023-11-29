/*
  Warnings:

  - Added the required column `chatId` to the `ChatLastMessages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatId` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatLastMessages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ChatLastMessages" ("createdAt", "id", "input", "metadata", "modifiedAt", "output") SELECT "createdAt", "id", "input", "metadata", "modifiedAt", "output" FROM "ChatLastMessages";
DROP TABLE "ChatLastMessages";
ALTER TABLE "new_ChatLastMessages" RENAME TO "ChatLastMessages";
CREATE TABLE "new_Chat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Chat" ("createdAt", "id", "input", "metadata", "modifiedAt", "output") SELECT "createdAt", "id", "input", "metadata", "modifiedAt", "output" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
