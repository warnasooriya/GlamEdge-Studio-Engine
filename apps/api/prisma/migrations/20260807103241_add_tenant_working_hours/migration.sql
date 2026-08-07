-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `closeTime` VARCHAR(5) NULL,
    ADD COLUMN `openTime` VARCHAR(5) NULL,
    ADD COLUMN `workingDays` JSON NULL;
