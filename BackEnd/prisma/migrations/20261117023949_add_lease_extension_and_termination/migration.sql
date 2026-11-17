-- AlterTable
ALTER TABLE `lease` MODIFY `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `LeaseExtension` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaseId` INTEGER NOT NULL,
    `invoiceId` INTEGER NULL,
    `requestedMonths` INTEGER NOT NULL,
    `requestedEndDate` DATETIME(3) NOT NULL,
    `approvedEndDate` DATETIME(3) NULL,
    `tenantNote` TEXT NULL,
    `ownerNote` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LeaseExtension_invoiceId_key`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaseTermination` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaseId` INTEGER NOT NULL,
    `requestedMoveOutDate` DATETIME(3) NOT NULL,
    `actualMoveOutDate` DATETIME(3) NULL,
    `reason` TEXT NOT NULL,
    `tenantNote` TEXT NULL,
    `ownerNote` TEXT NULL,
    `refundAmount` DECIMAL(12, 2) NULL,
    `deductionAmount` DECIMAL(12, 2) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeaseExtension` ADD CONSTRAINT `LeaseExtension_leaseId_fkey` FOREIGN KEY (`leaseId`) REFERENCES `Lease`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaseExtension` ADD CONSTRAINT `LeaseExtension_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaseTermination` ADD CONSTRAINT `LeaseTermination_leaseId_fkey` FOREIGN KEY (`leaseId`) REFERENCES `Lease`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
