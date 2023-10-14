-- DropIndex
DROP INDEX `user_tokens_id_user_id_ip_idx` ON `user_tokens`;

-- CreateTable
CREATE TABLE `user_security_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(36) NOT NULL,
    `browser` VARCHAR(255) NOT NULL,
    `device` VARCHAR(255) NOT NULL,
    `engine` VARCHAR(255) NOT NULL,
    `os` VARCHAR(255) NOT NULL,
    `ip` VARCHAR(15) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_security_logs_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `user_tokens_user_id_ip_idx` ON `user_tokens`(`user_id`, `ip`);

-- AddForeignKey
ALTER TABLE `user_security_logs` ADD CONSTRAINT `user_security_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
