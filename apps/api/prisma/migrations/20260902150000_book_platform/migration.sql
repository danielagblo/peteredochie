-- AlterTable: subscribers — community opt-in fields
ALTER TABLE `subscribers` ADD COLUMN `phone` VARCHAR(40) NULL,
    ADD COLUMN `referral_source` VARCHAR(120) NULL,
    ADD COLUMN `consent_given` BOOLEAN NULL,
    ADD COLUMN `consent_at` DATETIME(3) NULL;

-- CreateTable: book_categories
CREATE TABLE `book_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(120) NULL,
    `description` VARCHAR(1000) NULL,
    `sort` INTEGER NULL,
    `enabled` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `book_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: book_preregistrations
CREATE TABLE `book_preregistrations` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `country` VARCHAR(100) NULL,
    `city` VARCHAR(120) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `notes` VARCHAR(2000) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'pending',
    `edition` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: products — book metadata
ALTER TABLE `products` ADD COLUMN `book_category` VARCHAR(191) NULL,
    ADD COLUMN `author` VARCHAR(160) NULL,
    ADD COLUMN `isbn` VARCHAR(32) NULL,
    ADD COLUMN `pages` INTEGER NULL,
    ADD COLUMN `language` VARCHAR(60) NULL,
    ADD COLUMN `excerpt` VARCHAR(3000) NULL,
    ADD COLUMN `published_year` VARCHAR(8) NULL;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_book_category_fkey` FOREIGN KEY (`book_category`) REFERENCES `book_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `book_preregistrations` ADD CONSTRAINT `book_preregistrations_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
