-- Tuition Portal DB (MySQL)
-- Run this file in MySQL Workbench / phpMyAdmin / CLI:
--   mysql -u root -p < seed.sql
--
-- Default admin login:
--   email: admin@portal.com
--   password: admin@123

CREATE DATABASE IF NOT EXISTS tuition_portal
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE tuition_portal;

-- ===== USERS =====
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ===== TUITIONS (Main sheet equivalent) =====
DROP TABLE IF EXISTS tuitions;
CREATE TABLE tuitions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tuition_id VARCHAR(100) NOT NULL,
  date DATE NULL,
  time_hour TINYINT UNSIGNED NULL,
  tuition_name VARCHAR(191) NULL,
  source VARCHAR(191) NULL,
  country VARCHAR(100) NULL,
  parents_contact VARCHAR(191) NULL,
  class VARCHAR(100) NULL,
  subjects VARCHAR(255) NULL,
  days_per_week VARCHAR(50) NULL,
  estimated_fee VARCHAR(50) NULL,
  tutor_name VARCHAR(191) NULL,
  tutor_fee VARCHAR(50) NULL,
  second_tutors VARCHAR(191) NULL,
  rejected_tutor VARCHAR(191) NULL,
  status VARCHAR(191) NULL,
  feedback TEXT NULL,
  demo_date DATE NULL,
  satisfaction_rating VARCHAR(191) NULL,
  demo_rating VARCHAR(50) NULL,
  sync_flag VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tuitions_tuition_id (tuition_id),
  KEY idx_tuitions_time_hour (time_hour),
  KEY idx_tuitions_demo_date (demo_date)
) ENGINE=InnoDB;

-- ===== SEED ADMIN USER =====
INSERT INTO users (email, password_hash, role)
VALUES ('admin@portal.com', '$2b$10$5Q7QBHInjV5DHrWmF1UjXOwI3Q.NlT4L.tEW6fT5aFWm072D.dCOi', 'admin');

-- ===== DUMMY DATA (edit/remove as you want) =====
INSERT INTO tuitions
(tuition_id, date, time_hour, tuition_name, source, country, parents_contact, class, subjects, days_per_week, estimated_fee, tutor_name, tutor_fee, second_tutors, rejected_tutor, status, feedback, demo_date, satisfaction_rating, demo_rating, sync_flag)
VALUES
('1001', '2026-02-04', 8,  'Ali Tuition',      'Facebook', 'PK', '0300-1111111', '10', 'Math',     '3', '8000',  'Ahsan', '2500', NULL, NULL, 'Pending',  NULL, '2026-02-03', 'Good',   'Average Demo', NULL),
('1002', '2026-02-04', 9,  'Sara Tuition',     'Referral', 'PK', '0300-2222222', '9',  'English',  '2', '7000',  NULL,    NULL,  NULL, NULL,  NULL,       NULL, '2026-02-04', NULL,     'Strong Demo',  NULL),
('1003', '2026-02-04', 10, 'Usman Tuition',    'Website',  'PK', '0300-3333333', '11', 'Physics',  '4', '9000',  'Hina',  '3000', NULL, 'XYZ', 'Confirmed', 'Nice demo', '2026-02-05', 'Excellent', 'Weak Demo',    NULL),
('1004', '2026-02-04', 10, 'Ayesha Tuition',   'Facebook', 'PK', '0300-4444444', '8',  'Chemistry','3', '8500',  NULL,    NULL,  NULL, NULL,  NULL,       NULL, '2026-02-10', NULL,     NULL,          NULL),
('1005', '2026-02-04', 11, 'Hamza Tuition',    'Walk-in',  'PK', '0300-5555555', '12', 'Biology',  '5', '10000', 'Bilal', '3500', NULL, NULL, 'Follow up', 'Call later', '2026-02-02', 'Average', NULL, NULL),
('1006', '2026-02-04', 12, 'Noor Tuition',     'Referral', 'PK', '0300-6666666', '7',  'Science',  '2', '6000',  NULL,    NULL,  NULL, NULL,  NULL,       NULL, '2026-02-06', NULL, 'Average Demo', NULL);
