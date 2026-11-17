/*
  Warnings:

  - You are about to drop the column `fraudStatus` on the `payment` table. All the data in the column will be lost.
  - You are about to drop the column `midtransTransactionId` on the `payment` table. All the data in the column will be lost.
  - Made the column `paymentMethod` on table `payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `Payment_midtransTransactionId_key` ON `payment`;

-- AlterTable
ALTER TABLE `payment` DROP COLUMN `fraudStatus`,
    DROP COLUMN `midtransTransactionId`,
    ADD COLUMN `ownerNote` TEXT NULL,
    ADD COLUMN `proofUrl` VARCHAR(191) NULL,
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    MODIFY `orderId` VARCHAR(191) NULL,
    MODIFY `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'BANK_TRANSFER',
    MODIFY `transactionStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING_VERIFICATION';
