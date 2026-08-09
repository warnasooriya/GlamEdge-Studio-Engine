-- AlterTable
ALTER TABLE `ledgers` MODIFY `paymentMode` ENUM('CASH', 'CARD', 'ONLINE', 'LANKAQR', 'PAYPAL') NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE `subscription_payments` MODIFY `paymentMode` ENUM('CASH', 'CARD', 'ONLINE', 'LANKAQR', 'PAYPAL') NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `paypalEmail` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `paypal_payments` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `amountLkr` DECIMAL(10, 2) NOT NULL,
    `amountUsd` DECIMAL(10, 2) NULL,
    `fxRate` DECIMAL(10, 4) NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `paypalOrderId` VARCHAR(64) NULL,
    `paypalCaptureId` VARCHAR(64) NULL,
    `payerEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `paypal_payments_appointmentId_key`(`appointmentId`),
    INDEX `paypal_payments_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `paypal_payments` ADD CONSTRAINT `paypal_payments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paypal_payments` ADD CONSTRAINT `paypal_payments_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

