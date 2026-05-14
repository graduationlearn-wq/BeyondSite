-- ================================================================
-- BeyondSite Database Schema
-- Generated from prisma/schema.prisma
-- Provider: MySQL 8.0
--
-- To initialize: mysql -u root -p < prisma/schema.sql
-- Or use:        npx prisma migrate deploy
-- ================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(191) NOT NULL,
  `auth0Id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  `name` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_auth0Id_key` (`auth0Id`),
  UNIQUE INDEX `users_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `websites` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `templateId` VARCHAR(191) NOT NULL,
  `data` JSON NOT NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Website_userId_idx` (`userId`),
  CONSTRAINT `Website_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drafts` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `templateId` VARCHAR(32) NOT NULL,
  `formData` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `drafts_userId_templateId_key` (`userId`, `templateId`),
  CONSTRAINT `drafts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `paymentId` VARCHAR(191) NOT NULL,
  `amount` INT NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
  `status` ENUM('CREATED', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'CREATED',
  `templateId` VARCHAR(191) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `payments_paymentId_key` (`paymentId`),
  CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `downloads` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `paymentId` VARCHAR(191) NOT NULL,
  `templateId` VARCHAR(191) NOT NULL,
  `downloadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `downloads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `downloads_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `templates` (
  `templateId` VARCHAR(32) NOT NULL,
  `displayName` VARCHAR(191) NOT NULL,
  `isPublished` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`templateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ================================================================
-- Seed data: all templates (13 total)
-- Published at launch: template-5, template-8, template-12, template-13
-- ================================================================
INSERT INTO `templates` (`templateId`, `displayName`, `isPublished`, `createdAt`) VALUES
  ('template-1',  'Editorial / Magazine',    false, NOW()),
  ('template-2',  'Agency / Professional',   false, NOW()),
  ('template-3',  'Terminal / Dev Studio',   false, NOW()),
  ('template-4',  'Web3 / Protocol',         false, NOW()),
  ('template-5',  'Local Service',           true,  NOW()),
  ('template-6',  'BFSI / Banking',         false, NOW()),
  ('template-7',  'Startup / SaaS',          false, NOW()),
  ('template-8',  'Insurance Advisor',       true,  NOW()),
  ('template-9',  'NBFC / Lender',          false, NOW()),
  ('template-10', 'FinTech SaaS',            false, NOW()),
  ('template-11', 'Portfolio',              false, NOW()),
  ('template-12', 'InsurTech SaaS',          true,  NOW()),
  ('template-13', 'Insurance Market',        true,  NOW());