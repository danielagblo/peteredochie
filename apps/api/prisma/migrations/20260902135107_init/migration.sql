-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `token_key` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `account_type` VARCHAR(191) NULL,
    `approval_status` VARCHAR(191) NULL DEFAULT 'not_required',
    `organisation` VARCHAR(160) NULL,
    `country` VARCHAR(100) NULL,
    `phone` VARCHAR(40) NULL,
    `territory` VARCHAR(200) NULL,
    `newsletter` BOOLEAN NULL,
    `interests` JSON NULL,
    `staff_role` VARCHAR(191) NULL,
    `last_login` DATETIME(3) NULL,
    `login_history` JSON NULL,
    `must_change_password` BOOLEAN NULL,
    `staff_status` VARCHAR(191) NULL,
    `country_assignment` VARCHAR(100) NULL,
    `assigned_country` VARCHAR(191) NULL,
    `collection_address` VARCHAR(500) NULL,
    `collection_hours` VARCHAR(200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_roles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `permissions` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employee_roles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `city` VARCHAR(120) NULL,
    `venue` VARCHAR(200) NULL,
    `starts` DATETIME(3) NULL,
    `ends` DATETIME(3) NULL,
    `summary` VARCHAR(500) NULL,
    `category` VARCHAR(60) NULL,
    `image` VARCHAR(500) NULL,
    `event_type` VARCHAR(191) NULL,
    `invitation_only` BOOLEAN NULL,
    `price` VARCHAR(60) NULL,
    `ticket_tiers` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `excerpt` VARCHAR(600) NULL,
    `body` VARCHAR(5000) NULL,
    `category` VARCHAR(60) NULL,
    `image` VARCHAR(500) NULL,
    `published` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `organisation` VARCHAR(160) NULL,
    `subject` VARCHAR(80) NULL,
    `message` VARCHAR(3000) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscribers` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NULL,
    `country` VARCHAR(100) NULL,
    `interests` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscribers_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `code` VARCHAR(3) NOT NULL,
    `currency` VARCHAR(8) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'active',
    `launch_date` DATETIME(3) NULL,
    `regional_coordinator` VARCHAR(191) NULL,
    `primary_distributor` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `countries_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `country_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` VARCHAR(2000) NULL,
    `format` VARCHAR(191) NULL,
    `price` DOUBLE NULL,
    `edition` VARCHAR(120) NULL,
    `product_type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `inventory_limit` INTEGER NULL,
    `current_stock` INTEGER NULL,
    `low_stock_threshold` INTEGER NULL,
    `enabled` BOOLEAN NULL,
    `main_order_enabled` BOOLEAN NULL,
    `external_url` VARCHAR(191) NULL,
    `image` VARCHAR(500) NULL,
    `created_by` VARCHAR(191) NULL,
    `variants` JSON NULL,
    `category` VARCHAR(80) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `total_price` DOUBLE NULL,
    `currency` VARCHAR(8) NULL,
    `shipping_address` JSON NULL,
    `payment_status` VARCHAR(191) NULL,
    `payment_reference` VARCHAR(120) NULL,
    `paystack_access_code` VARCHAR(120) NULL,
    `order_status` VARCHAR(191) NULL,
    `items_summary` VARCHAR(1000) NULL,
    `estimated_delivery` DATETIME(3) NULL,
    `tracking_number` VARCHAR(120) NULL,
    `confirmation_sent` BOOLEAN NULL,
    `country` VARCHAR(100) NULL,
    `distributor_id` VARCHAR(191) NULL,
    `fulfillment_method` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NULL,
    `product_name` VARCHAR(200) NULL,
    `product_format` VARCHAR(40) NULL,
    `product_edition` VARCHAR(120) NULL,
    `quantity` INTEGER NULL,
    `unit_price` DOUBLE NULL,
    `total_price` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meet_and_greet_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `tier` VARCHAR(191) NOT NULL,
    `price` DOUBLE NULL,
    `status` VARCHAR(191) NULL DEFAULT 'pending',
    `confirmation_code` VARCHAR(40) NULL,
    `photographer` BOOLEAN NULL,
    `payment_reference` VARCHAR(120) NULL,
    `payment_status` VARCHAR(191) NULL,
    `paystack_access_code` VARCHAR(120) NULL,
    `country` VARCHAR(3) NULL,
    `distributor_id` VARCHAR(191) NULL,
    `fulfillment_method` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NULL DEFAULT 'registered',
    `confirmation_code` VARCHAR(40) NULL,
    `country` VARCHAR(3) NULL,
    `distributor_id` VARCHAR(191) NULL,
    `fulfillment_method` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sponsorship_packages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `tier` VARCHAR(191) NOT NULL,
    `description` VARCHAR(2000) NULL,
    `price` DOUBLE NOT NULL,
    `currency` VARCHAR(8) NULL,
    `benefits` JSON NULL,
    `deliverables` JSON NULL,
    `duration` VARCHAR(60) NULL,
    `image` VARCHAR(500) NULL,
    `enabled` BOOLEAN NULL,
    `sort` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sponsorships` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `company_name` VARCHAR(200) NOT NULL,
    `industry` VARCHAR(120) NULL,
    `contact_person` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `website` VARCHAR(191) NULL,
    `package_tier` VARCHAR(191) NULL,
    `package_id` VARCHAR(191) NULL,
    `investment_amount` DOUBLE NULL,
    `currency` VARCHAR(8) NULL,
    `message` VARCHAR(3000) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'pending',
    `payment_status` VARCHAR(191) NULL,
    `admin_notes` VARCHAR(2000) NULL,
    `country` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mentorship_applications` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `country` VARCHAR(100) NULL,
    `discipline` VARCHAR(100) NULL,
    `statement` VARCHAR(2000) NOT NULL,
    `owner_id` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'pending',
    `cohort` VARCHAR(20) NULL,
    `requested_type` VARCHAR(191) NULL,
    `registration_type` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mentorship_materials` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` VARCHAR(2000) NULL,
    `module` VARCHAR(80) NULL,
    `cohort` VARCHAR(20) NULL,
    `registration_type` VARCHAR(191) NOT NULL,
    `sort` INTEGER NULL,
    `published` BOOLEAN NULL,
    `url` VARCHAR(191) NULL,
    `video_url` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `quantity_change` INTEGER NULL,
    `previous_stock` INTEGER NULL,
    `new_stock` INTEGER NULL,
    `reason` VARCHAR(240) NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_assigned_country_fkey` FOREIGN KEY (`assigned_country`) REFERENCES `countries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_roles` ADD CONSTRAINT `employee_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `countries` ADD CONSTRAINT `countries_regional_coordinator_fkey` FOREIGN KEY (`regional_coordinator`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `countries` ADD CONSTRAINT `countries_primary_distributor_fkey` FOREIGN KEY (`primary_distributor`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regions` ADD CONSTRAINT `regions_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_distributor_id_fkey` FOREIGN KEY (`distributor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meet_and_greet_tickets` ADD CONSTRAINT `meet_and_greet_tickets_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meet_and_greet_tickets` ADD CONSTRAINT `meet_and_greet_tickets_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meet_and_greet_tickets` ADD CONSTRAINT `meet_and_greet_tickets_distributor_id_fkey` FOREIGN KEY (`distributor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_distributor_id_fkey` FOREIGN KEY (`distributor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sponsorships` ADD CONSTRAINT `sponsorships_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sponsorships` ADD CONSTRAINT `sponsorships_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `sponsorship_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mentorship_applications` ADD CONSTRAINT `mentorship_applications_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
