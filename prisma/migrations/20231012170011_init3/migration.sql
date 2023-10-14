/*
  Warnings:

  - Added the required column `cpu` to the `user_security_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `device_type` to the `user_security_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user_security_logs` ADD COLUMN `cpu` VARCHAR(255) NOT NULL,
    ADD COLUMN `device_type` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE INDEX `user_security_logs_user_id_ip_idx` ON `user_security_logs`(`user_id`, `ip`);
