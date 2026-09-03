-- CreateTable: newsletter_campaigns
CREATE TABLE `newsletter_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `preview_text` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `target_interest` VARCHAR(100) NULL,
    `target_country` VARCHAR(100) NULL,
    `recipient_count` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sent_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    INDEX `newsletter_campaigns_sent_by_id_fkey`(`sent_by_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
