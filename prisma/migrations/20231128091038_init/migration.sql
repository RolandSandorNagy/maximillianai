/*
  Warnings:

  - The primary key for the `Chats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `chatId` on the `Chats` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Chats" ("createdAt", "id", "modifiedAt", "title") SELECT "createdAt", "id", "modifiedAt", "title" FROM "Chats";
DROP TABLE "Chats";
ALTER TABLE "new_Chats" RENAME TO "Chats";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
