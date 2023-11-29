/*
  Warnings:

  - You are about to alter the column `chatId` on the `Messages` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `chatId` on the `ChatLastMessages` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "chatId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Messages" ("chatId", "createdAt", "id", "input", "metadata", "modifiedAt", "output") SELECT "chatId", "createdAt", "id", "input", "metadata", "modifiedAt", "output" FROM "Messages";
DROP TABLE "Messages";
ALTER TABLE "new_Messages" RENAME TO "Messages";
CREATE TABLE "new_ChatLastMessages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "chatId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ChatLastMessages" ("chatId", "createdAt", "id", "input", "metadata", "modifiedAt", "output") SELECT "chatId", "createdAt", "id", "input", "metadata", "modifiedAt", "output" FROM "ChatLastMessages";
DROP TABLE "ChatLastMessages";
ALTER TABLE "new_ChatLastMessages" RENAME TO "ChatLastMessages";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
