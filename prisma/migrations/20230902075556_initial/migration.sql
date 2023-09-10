-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `display_name` VARCHAR(25) NOT NULL,
    `avatar` VARCHAR(255) NOT NULL DEFAULT '',
    `about` VARCHAR(255) NOT NULL DEFAULT '',
    `email` VARCHAR(50) NOT NULL,
    `username` VARCHAR(15) NOT NULL,
    `password` VARCHAR(255) NOT NULL DEFAULT '',
    `role` INTEGER NOT NULL DEFAULT 0,
    `oauth` ENUM('DEFAULT', 'GOOGLE', 'GITHUB') NOT NULL DEFAULT 'DEFAULT',
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_display_name_key`(`display_name`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `ip` VARCHAR(15) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_tokens` ADD CONSTRAINT `user_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
