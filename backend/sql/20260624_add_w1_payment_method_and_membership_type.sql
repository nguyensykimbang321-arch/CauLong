-- W1 Core Booking fields
-- Run this SQL before deploying backend code that uses these columns.

ALTER TABLE bookings
ADD COLUMN payment_method ENUM('cash', 'vnpay') NOT NULL DEFAULT 'cash';

ALTER TABLE users
ADD COLUMN membership_type ENUM('standard', 'student', 'vip') NOT NULL DEFAULT 'standard';
