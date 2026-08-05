-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `subscriptionFee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE `subscription_payments` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `tier` ENUM('STARTER', 'PRO', 'ENTERPRISE') NOT NULL,
    `cycle` ENUM('MONTHLY', 'YEARLY') NOT NULL,
    `paymentMode` ENUM('CASH', 'CARD', 'ONLINE', 'LANKAQR') NOT NULL DEFAULT 'CASH',
    `reference` VARCHAR(191) NULL,
    `notes` VARCHAR(500) NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `subscription_payments_tenantId_idx`(`tenantId`),
    INDEX `subscription_payments_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_payments` ADD CONSTRAINT `subscription_payments_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
