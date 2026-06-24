-- Create holidays table
CREATE TABLE IF NOT EXISTS `holidays` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `holiday_date` DATE NOT NULL UNIQUE,
  `surcharge_percent` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create system_configs table
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `data_type` ENUM('number', 'string', 'boolean') NOT NULL DEFAULT 'string',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed system configs
INSERT INTO `system_configs` (`key`, `value`, `description`, `data_type`, `created_at`, `updated_at`)
VALUES
  ('WEEKEND_SURCHARGE_PERCENT', '15', 'Phần trăm phụ thu khi đặt sân vào cuối tuần (thứ 7, chủ nhật)', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('STUDENT_DISCOUNT_PERCENT', '10', 'Phần trăm giảm giá cho đối tượng khách hàng là học sinh/sinh viên', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('VIP_DISCOUNT_PERCENT', '15', 'Phần trăm giảm giá cho đối tượng khách hàng VIP', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('HOLIDAY_SURCHARGE_PERCENT', '20', 'Phần trăm phụ thu mặc định áp dụng vào ngày lễ', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `description` = VALUES(`description`),
  `data_type` = VALUES(`data_type`),
  `updated_at` = CURRENT_TIMESTAMP;
