-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `contactPhone` VARCHAR(50) NULL,
    ADD COLUMN `logoUrl` VARCHAR(500) NULL,
    ADD COLUMN `mapLink` VARCHAR(500) NULL;
