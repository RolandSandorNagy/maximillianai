/*
  Warnings:

  - You are about to drop the column `chatId` on the `ChatLastMessages` table. All the data in the column will be lost.
  - You are about to drop the column `chatId` on the `Messages` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatLastMessages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ChatLastMessages" ("createdAt", "id", "input", "metadata", "modifiedAt", "output") SELECT "createdAt", "id", "input", "metadata", "modifiedAt", "output" FROM "ChatLastMessages";
DROP TABLE "ChatLastMessages";
ALTER TABLE "new_ChatLastMessages" RENAME TO "ChatLastMessages";
CREATE TABLE "new_Messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Messages" ("createdAt", "id", "input", "metadata", "modifiedAt", "output") SELECT "createdAt", "id", "input", "metadata", "modifiedAt", "output" FROM "Messages";
DROP TABLE "Messages";
ALTER TABLE "new_Messages" RENAME TO "Messages";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
