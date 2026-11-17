/*
  Warnings:

  - A unique constraint covering the columns `[activationTokenHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `activationExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `activationTokenHash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_activationTokenHash_key` ON `User`(`activationTokenHash`);
