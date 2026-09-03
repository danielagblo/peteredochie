-- AlterTable: add recipient snapshot (names/emails) to newsletter_campaigns
ALTER TABLE `newsletter_campaigns` ADD COLUMN `recipients` JSON NULL;
