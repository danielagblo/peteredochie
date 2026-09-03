-- AlterTable
ALTER TABLE `sponsorships` ADD COLUMN `payment_reference` VARCHAR(191) NULL,
    ADD COLUMN `paystack_access_code` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `distributor_tiers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `min_units` INTEGER NULL,
    `max_units` INTEGER NULL,
    `discount` DOUBLE NULL,
    `terms` VARCHAR(300) NULL,
    `enabled` BOOLEAN NULL DEFAULT true,
    `sort` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
