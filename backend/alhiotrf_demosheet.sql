-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 08, 2026 at 04:15 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alhiotrf_demosheet`
--

-- --------------------------------------------------------

--
-- Table structure for table `otm_tuition_entries`
--

CREATE TABLE `otm_tuition_entries` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `day` varchar(30) NOT NULL,
  `time` varchar(50) DEFAULT NULL,
  `tuition_name` varchar(255) NOT NULL,
  `group_name` varchar(255) DEFAULT NULL,
  `class_start_time` varchar(50) DEFAULT NULL,
  `class_end_time` varchar(50) DEFAULT NULL,
  `status` varchar(80) NOT NULL DEFAULT 'Pending',
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `otm_tuition_entries`
--

INSERT INTO `otm_tuition_entries` (`id`, `user_id`, `day`, `time`, `tuition_name`, `group_name`, `class_start_time`, `class_end_time`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 11, '3', '9:00pm', 'sara', 'lacasislamabad', '9:00pm', '11:00pm', 'online', 'okay', '2026-04-03 16:11:52', '2026-04-03 16:11:52'),
(2, 11, '3', '10pm', 'boy', 'qwerty', '10pm', 'o level', 'active', 'okay', '2026-04-03 16:50:41', '2026-04-03 16:51:34');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int UNSIGNED NOT NULL,
  `tuition_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` date DEFAULT NULL,
  `tuition_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tutor_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tutor_share` decimal(12,2) DEFAULT NULL,
  `lacas_share` decimal(12,2) DEFAULT NULL,
  `total_fees` decimal(12,2) DEFAULT NULL,
  `tuition_status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('Fees Receive','Fee Pending','Tuition Close','Tuition Pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Tuition Pending',
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `otm_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_flag` tinyint(1) NOT NULL DEFAULT '0',
  `assigned_staff_id` int DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedFromTodayDemo` tinyint(1) NOT NULL DEFAULT '0',
  `assigned_to` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_index` int NOT NULL DEFAULT '0',
  `row_color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tuition_name_color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `days_per_week` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `tuition_id`, `payment_date`, `tuition_name`, `country`, `class_name`, `tutor_name`, `tutor_share`, `lacas_share`, `total_fees`, `tuition_status`, `status`, `feedback`, `otm_name`, `created_at`, `updated_at`, `sync_flag`, `assigned_staff_id`, `is_deleted`, `deletedFromTodayDemo`, `assigned_to`, `order_index`, `row_color`, `tuition_name_color`, `days_per_week`, `date`, `notes`) VALUES
(1, '1002', '2026-02-04', 'asdsadsada', NULL, '', '', NULL, NULL, NULL, NULL, '', '', '', '2026-03-10 14:40:12', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 9, '#ffffff', NULL, '0', NULL, NULL),
(6, 'T-7555', '2026-03-04', 'sdfds sdfdssdfdssdfdssdfdssdfdssdfdssdfdssdfdssdfds', '', '', '', NULL, NULL, NULL, NULL, '', '', '', '2026-03-11 12:40:59', '2026-03-26 05:56:37', 0, NULL, 0, 0, NULL, 7, '#ffffff', NULL, '0', NULL, NULL),
(7, 'T-5336', '2026-02-26', NULL, NULL, '', '', NULL, NULL, NULL, NULL, '', '', '', '2026-03-11 12:45:33', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 8, '#ffffff', NULL, '0', NULL, NULL),
(9, 'T-6335', '2026-03-11', 'hello', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '2026-03-11 12:54:34', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 5, '#ffffff', NULL, '0', NULL, NULL),
(10, '1001', '2026-02-03', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '2026-03-11 13:43:21', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 3, '#ffffff', '#ffffff', '0', NULL, NULL),
(11, '1004', '2026-02-04', '', '', '', '', NULL, NULL, NULL, NULL, '', '', '', '2026-03-11 13:43:21', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 11, '#ffffff', NULL, '0', NULL, NULL),
(15, 'T-32423', '1989-08-16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, '2026-03-11 14:29:56', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 12, '#ffffff', NULL, '0', NULL, NULL),
(17, 'T-9674', '2026-02-26', '', '', '', '', NULL, NULL, NULL, NULL, '', '', '', '2026-03-12 12:00:56', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 6, '#ffffff', NULL, '0', NULL, NULL),
(19, 'T-324324', '2017-07-12', '', '', '', '', NULL, NULL, NULL, NULL, '', '', '', '2026-03-12 12:44:23', '2026-03-26 05:42:08', 0, NULL, 0, 0, NULL, 10, '#ffffff', NULL, '0', NULL, NULL),
(31, 'T-2984', '2026-03-17', 'Muskan Huris UAE Online Tuition', 'UAE', 'Grade 9 Federal', '', NULL, NULL, NULL, NULL, 'Tuition Pending', '', 'mahad', '2026-03-18 13:46:24', '2026-03-26 09:54:54', 1, NULL, 0, 0, NULL, 1, '#ffffff', NULL, '4', NULL, ''),
(34, 'T-9331', '2026-03-26', 'ahmed', 'pakistan', 'o level', 'bilal ahmed', '5000.00', '20000.00', '25000.00', NULL, 'Tuition Pending', 'think about satisfied okay think about satisfiedokaythink about satisfiedokaythink about satisfiedokaythink about satisfiedokay  erewrew', 'rafaqat', '2026-03-27 16:01:28', '2026-03-27 16:01:41', 0, NULL, 0, 0, NULL, 0, NULL, NULL, '3', NULL, ''),
(36, 'T-2109', '2026-03-17', 'Abdullah KSA Online Tuition', '', 'Grade 11', '', NULL, NULL, NULL, NULL, 'Tuition Pending', '', 'areeba', '2026-03-31 05:27:08', '2026-03-31 05:27:08', 0, NULL, 0, 0, NULL, 0, NULL, NULL, '4', NULL, ''),
(37, 'T-213213', '2021-05-07', 'almas', 'pakistan ', '9th ', 'Sint amet dolor ulsadsa', '5000.00', '5000.00', '10000.00', NULL, 'Tuition Pending', 'Magnam nemo se', 'Aut perspiciatis po', '2026-03-31 07:08:32', '2026-04-07 07:57:54', 0, NULL, 0, 0, NULL, 0, NULL, NULL, '3', NULL, 'dsfdsds'),
(38, 'T-9404', '2026-03-31', 'some tuitoin', 'pakistan', '', '', '10000.00', NULL, NULL, NULL, 'Tuition Pending', '', 'mahad', '2026-03-31 07:08:33', '2026-04-07 07:43:23', 0, NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, 'qwerty'),
(39, 'T-5086', '2026-03-17', 'Abdul Sattar Saudi Online Tuition', '', 'A Level ', '', NULL, '300.00', '300.00', NULL, 'Tuition Pending', '', 'areeba', '2026-04-02 15:26:46', '2026-04-02 15:26:46', 0, NULL, 0, 0, NULL, 0, NULL, NULL, '3', NULL, ''),
(42, 'T-8475', '2026-03-17', 'Mrs Awias Online Tuition', 'UAE', 'Grade 5', '', NULL, '300.00', '300.00', NULL, 'Tuition Pending', '', 'mahad', '2026-04-02 15:36:34', '2026-04-02 15:36:34', 0, NULL, 0, 0, NULL, 0, NULL, NULL, '4', NULL, ''),
(43, 'T-1600', '2026-03-31', 'bilal junaid', 'pakistan', 'o level', 'firoz', '10000.00', '30000.00', '40000.00', NULL, 'Tuition Pending', 'hello how are you?i\'m good', 'rafaqat', '2026-04-02 16:06:27', '2026-04-07 07:43:12', 0, NULL, 0, 0, NULL, 0, NULL, NULL, '4', NULL, 'sadsadsadsa');

-- --------------------------------------------------------

--
-- Table structure for table `payments_clone`
--

CREATE TABLE `payments_clone` (
  `id` int UNSIGNED NOT NULL,
  `tuition_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` date DEFAULT NULL,
  `date_with_month` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tuition_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tutor_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tutor_share` decimal(12,2) DEFAULT NULL,
  `lacas_share` decimal(12,2) DEFAULT NULL,
  `total_fees` decimal(12,2) DEFAULT NULL,
  `status` enum('Fees Receive','Fee Pending','Tuition Close','Tuition Pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Tuition Pending',
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `otm_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_flag` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_staff_id` int UNSIGNED DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedFromTodayDemo` tinyint(1) NOT NULL DEFAULT '0',
  `assigned_to` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_index` int NOT NULL DEFAULT '0',
  `row_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tuition_name_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `days_per_week` int DEFAULT '0',
  `date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments_clone`
--

INSERT INTO `payments_clone` (`id`, `tuition_id`, `payment_date`, `date_with_month`, `tuition_name`, `country`, `class_name`, `tutor_name`, `tutor_share`, `lacas_share`, `total_fees`, `status`, `feedback`, `otm_name`, `created_at`, `updated_at`, `sync_flag`, `assigned_staff_id`, `is_deleted`, `deletedFromTodayDemo`, `assigned_to`, `order_index`, `row_color`, `tuition_name_color`, `days_per_week`, `date`, `notes`) VALUES
(1, '1002', '2026-02-04', NULL, 'asdsadsada', '', '', '', NULL, NULL, NULL, 'Tuition Pending', '', '', '2026-03-13 08:51:40', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 10, NULL, NULL, 0, NULL, NULL),
(2, 'T-7555', '2026-03-04', 'sadsada', '', 'sadsadsa', 'sadsa', '', NULL, NULL, NULL, 'Tuition Pending', '', '', '2026-03-13 08:51:40', '2026-04-07 12:22:29', NULL, NULL, 0, 0, NULL, 11, NULL, NULL, 0, NULL, NULL),
(3, 'T-5336', '2026-02-26', '3 months', 'bila', 'pakistan', 'o level', 'shameer', '8000.00', '1100.00', '10000.00', 'Tuition Close', 'okay', 'rafaqat', '2026-03-13 08:51:40', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 0, '#fdd835', '#4caf50', 0, NULL, NULL),
(4, 'T-6335', '2026-03-11', 'sadsadsa', 'sadsadsa', 'sadsasad', 'sadsadsa', 'saad', NULL, NULL, NULL, 'Tuition Close', 'asdsada', 'some', '2026-03-13 08:51:40', '2026-04-07 12:23:04', NULL, NULL, 0, 0, NULL, 12, NULL, NULL, 0, NULL, NULL),
(5, '1001', '2026-02-04', NULL, '', 'PK', '10', 'Ahsan', '1000.00', NULL, NULL, 'Tuition Pending', '', 'Facebook', '2026-03-13 08:51:40', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 13, NULL, NULL, 0, NULL, NULL),
(6, '1004', '2026-02-04', NULL, '', '', '', '', NULL, NULL, NULL, 'Tuition Pending', '', '', '2026-03-13 08:51:40', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 14, NULL, NULL, 0, NULL, NULL),
(8, 'T-9674', '2026-02-26', NULL, '', '', '', '', NULL, NULL, NULL, 'Tuition Pending', '', '', '2026-03-13 08:51:40', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 16, NULL, NULL, 0, NULL, NULL),
(9, 'T-324324', '2017-07-12', NULL, '', '', '', '', NULL, NULL, NULL, 'Fees Receive', '', '', '2026-03-13 08:51:40', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 17, NULL, NULL, 0, NULL, NULL),
(10, 'manual-1773659807725', NULL, '6 months', 'bilal', NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Close', NULL, NULL, '2026-03-16 11:16:48', '2026-04-07 12:30:09', NULL, NULL, 0, 0, NULL, 9, '#e8eaf6', '#8bc34a', 0, NULL, NULL),
(13, 'helloi', NULL, NULL, NULL, NULL, 'o level', 'ahmed', NULL, NULL, NULL, '', NULL, NULL, '2026-03-16 11:50:53', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 8, NULL, NULL, 0, NULL, NULL),
(15, 'manual-1773662329307', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Pending', NULL, NULL, '2026-03-16 11:58:50', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 7, NULL, NULL, 0, NULL, NULL),
(16, 'manual-1773662330508', NULL, '2 month', 'sadsa', 'sadas', 'sadsa', NULL, NULL, NULL, NULL, 'Tuition Pending', NULL, 'asdasdsads', '2026-03-16 11:58:51', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 2, NULL, NULL, 0, NULL, NULL),
(17, 'manual-1773662331369', NULL, '2 month', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Pending', NULL, NULL, '2026-03-16 11:58:52', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 1, NULL, NULL, 0, NULL, NULL),
(18, 'manual-1773662332074', NULL, '2 month', NULL, NULL, NULL, 'ASDAS', NULL, NULL, NULL, 'Tuition Pending', NULL, NULL, '2026-03-16 11:58:52', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 3, NULL, NULL, 0, NULL, NULL),
(19, 'manual-1773662332817', NULL, '2 month', NULL, NULL, NULL, 'ADSSA', NULL, NULL, NULL, 'Tuition Pending', NULL, NULL, '2026-03-16 11:58:53', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 4, NULL, NULL, 0, NULL, NULL),
(20, 'manual-1773662333135', NULL, 'fdsdsfds', 'dfs', NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Pending', NULL, NULL, '2026-03-16 11:58:54', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 5, NULL, NULL, 0, NULL, NULL),
(21, 'manual-1773662414473', NULL, '2 month', NULL, 'uae', 'o leve', 'bilal ', NULL, NULL, NULL, 'Tuition Pending', 'asdsadsa', 'sadsadsaa', '2026-03-16 12:00:15', '2026-04-07 12:46:29', NULL, NULL, 0, 0, NULL, 6, NULL, NULL, 0, NULL, NULL),
(23, 'T-32423', '1989-08-16', NULL, 'Sint ex ipsum conseq', 'Ut voluptatem volup', 'Omnis facilis omnis ', 'Dolorem et tempore ', '0.00', '3000.00', '3000.00', 'Tuition Pending', 'satisfied', 'areeba', '2026-03-31 06:56:36', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 15, '#ffffff', '#ffffff', 0, NULL, NULL),
(24, 'manual-1773659845732', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Pending', NULL, NULL, '2026-03-31 06:56:36', '2026-04-07 12:07:44', NULL, NULL, 0, 0, NULL, 18, '#ffffff', '#ffffff', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payments_clone_trash`
--

CREATE TABLE `payments_clone_trash` (
  `id` int UNSIGNED NOT NULL,
  `original_payment_clone_id` int UNSIGNED DEFAULT NULL,
  `tuition_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `date_with_month` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tuition_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tutor_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tutor_share` decimal(12,2) DEFAULT NULL,
  `lacas_share` decimal(12,2) DEFAULT NULL,
  `total_fees` decimal(12,2) DEFAULT NULL,
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `otm_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sync_flag` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_staff_id` int UNSIGNED DEFAULT NULL,
  `deleted_from_today_demo` tinyint(1) NOT NULL DEFAULT '0',
  `assigned_to` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_index` int NOT NULL DEFAULT '0',
  `row_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tuition_name_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments_clone_trash`
--

INSERT INTO `payments_clone_trash` (`id`, `original_payment_clone_id`, `tuition_id`, `payment_date`, `date_with_month`, `tuition_name`, `country`, `class_name`, `tutor_name`, `tutor_share`, `lacas_share`, `total_fees`, `status`, `feedback`, `otm_name`, `sync_flag`, `assigned_staff_id`, `deleted_from_today_demo`, `assigned_to`, `order_index`, `row_color`, `tuition_name_color`, `created_at`, `updated_at`) VALUES
(3, 22, 'T-12121', NULL, '3 months', 'bila', 'pakistan', 'o level', 'shameer', '8000.00', '1100.00', '10000.00', 'Tuition Close', 'okay', 'rafaqat', NULL, NULL, 0, NULL, 1, '#ffffff', '#ffffff', '2026-03-31 07:11:36', '2026-03-31 07:11:36');

-- --------------------------------------------------------

--
-- Table structure for table `payment_change_requests`
--

CREATE TABLE `payment_change_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'payment_sheet_with_date',
  `payment_clone_id` int UNSIGNED DEFAULT NULL,
  `action_type` enum('create','update','delete','reorder') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_user_id` int UNSIGNED NOT NULL,
  `actor_role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_status` enum('pending','approved','rejected','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `changed_columns` json DEFAULT NULL,
  `before_data` json DEFAULT NULL,
  `after_data` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `approved_by` int UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejected_by` int UNSIGNED DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_change_requests`
--

INSERT INTO `payment_change_requests` (`id`, `module_name`, `payment_clone_id`, `action_type`, `actor_user_id`, `actor_role`, `actor_name`, `actor_email`, `request_status`, `changed_columns`, `before_data`, `after_data`, `metadata`, `review_note`, `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'payment_sheet_with_date', 17, 'update', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"className\"]', '{\"status\": \"Tuition Pending\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"manual-1773662331369\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 2, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": \"2 month\", \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"status\": \"Tuition Pending\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": \"sadsadsa\", \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"manual-1773662331369\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 2, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": \"2 month\", \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Edit Cell\", \"changedColumns\": [\"className\"]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 07:54:31', '2026-04-07 07:54:31', '2026-04-07 07:54:31'),
(2, 'payment_sheet_with_date', NULL, 'create', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"tuitionId\", \"paymentDate\", \"dateWithMonth\", \"tuitionName\", \"country\", \"className\", \"tutorName\", \"tutorShare\", \"lacasShare\", \"totalFees\", \"status\", \"feedback\", \"otmName\", \"syncFlag\", \"assignedStaffId\", \"isDeleted\", \"deletedFromTodayDemo\", \"assignedTo\", \"orderIndex\", \"rowColor\", \"tuitionNameColor\"]', NULL, '{\"status\": \"Tuition Pending\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"manual-1775548476838\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 20, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Add Row\"}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 07:54:36', '2026-04-07 07:54:36', '2026-04-07 07:54:36'),
(3, 'payment_sheet_with_date', NULL, 'create', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"tuitionId\", \"paymentDate\", \"dateWithMonth\", \"tuitionName\", \"country\", \"className\", \"tutorName\", \"tutorShare\", \"lacasShare\", \"totalFees\", \"status\", \"feedback\", \"otmName\", \"syncFlag\", \"assignedStaffId\", \"isDeleted\", \"deletedFromTodayDemo\", \"assignedTo\", \"orderIndex\", \"rowColor\", \"tuitionNameColor\"]', NULL, '{\"status\": \"Tuition Pending\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"manual-1775548484727\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 20, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Add Row\"}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 07:54:44', '2026-04-07 07:54:44', '2026-04-07 07:54:44'),
(4, 'payment_sheet_with_date', 16, 'update', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"tutorName\"]', '{\"status\": \"Tuition Pending\", \"country\": \"sadas\", \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": \"sadsa\", \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"manual-1773662330508\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 3, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": \"sadsa\", \"dateWithMonth\": \"2 month\", \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"status\": \"Tuition Pending\", \"country\": \"sadas\", \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": \"sadsa\", \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"manual-1773662330508\", \"tutorName\": \"sadsad\", \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 3, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": \"sadsa\", \"dateWithMonth\": \"2 month\", \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Edit Cell\", \"changedColumns\": [\"tutorName\"]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 07:54:48', '2026-04-07 07:54:48', '2026-04-07 07:54:48'),
(5, 'payment_sheet_with_date', 6, 'update', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"tutorName\"]', '{\"status\": \"Tuition Pending\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"1004\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 15, \"tutorShare\": null, \"paymentDate\": \"2026-02-04\", \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"status\": \"Tuition Pending\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"1004\", \"tutorName\": \"sadsadad\", \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 15, \"tutorShare\": null, \"paymentDate\": \"2026-02-04\", \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Edit Cell\", \"changedColumns\": [\"tutorName\"]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 07:57:58', '2026-04-07 07:57:58', '2026-04-07 07:57:58'),
(6, 'payment_sheet_with_date', NULL, 'create', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"tuitionId\", \"paymentDate\", \"dateWithMonth\", \"tuitionName\", \"country\", \"className\", \"tutorName\", \"tutorShare\", \"lacasShare\", \"totalFees\", \"status\", \"feedback\", \"otmName\", \"syncFlag\", \"assignedStaffId\", \"isDeleted\", \"deletedFromTodayDemo\", \"assignedTo\", \"orderIndex\", \"rowColor\", \"tuitionNameColor\"]', NULL, '{\"status\": \"Tuition Pending\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"manual-1775554756408\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 20, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Add Row\"}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 09:39:16', '2026-04-07 09:39:16', '2026-04-07 09:39:16'),
(7, 'payment_sheet_with_date', 13, 'update', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"country\"]', '{\"status\": \"\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"helloi\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 9, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"status\": \"\", \"country\": \"sadsadsada\", \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"helloi\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 9, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Edit Cell\", \"changedColumns\": [\"country\"]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 10:09:30', '2026-04-07 10:09:30', '2026-04-07 10:09:30'),
(8, 'payment_sheet_with_date', 13, 'update', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"country\"]', '{\"status\": \"\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"helloi\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 9, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"status\": \"\", \"country\": \"sadas\", \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"helloi\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 9, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Edit Cell\", \"changedColumns\": [\"country\"]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 10:17:57', '2026-04-07 10:17:57', '2026-04-07 10:17:57'),
(9, 'payment_sheet_with_date', 13, 'update', 1, 'admin', 'Admin', 'admin@lacas.com', 'pending', '[\"feedback\"]', '{\"status\": \"\", \"country\": null, \"otmName\": null, \"feedback\": null, \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"helloi\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 9, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"status\": \"\", \"country\": null, \"otmName\": null, \"feedback\": \"dsdsfsd\", \"rowColor\": null, \"syncFlag\": null, \"className\": null, \"isDeleted\": false, \"totalFees\": null, \"tuitionId\": \"helloi\", \"tutorName\": null, \"assignedTo\": null, \"lacasShare\": null, \"orderIndex\": 9, \"tutorShare\": null, \"paymentDate\": null, \"tuitionName\": null, \"dateWithMonth\": null, \"assignedStaffId\": null, \"tuitionNameColor\": null, \"deletedFromTodayDemo\": false}', '{\"historyLabel\": \"Edit Cell\", \"changedColumns\": [\"feedback\"]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 10:41:03', '2026-04-07 10:41:03', '2026-04-07 10:41:03'),
(10, 'payment_sheet_with_date', NULL, 'reorder', 1, 'admin', 'Admin', 'admin@lacas.com', 'approved', '[\"orderIndex\"]', NULL, NULL, '{\"message\": \"Rows reordered in payment sheet\", \"afterOrder\": [{\"id\": 3, \"orderIndex\": 0}, {\"id\": 17, \"orderIndex\": 1}, {\"id\": 16, \"orderIndex\": 2}, {\"id\": 18, \"orderIndex\": 3}, {\"id\": 20, \"orderIndex\": 4}, {\"id\": 19, \"orderIndex\": 5}, {\"id\": 21, \"orderIndex\": 6}, {\"id\": 15, \"orderIndex\": 7}, {\"id\": 13, \"orderIndex\": 8}, {\"id\": 10, \"orderIndex\": 9}, {\"id\": 1, \"orderIndex\": 10}, {\"id\": 2, \"orderIndex\": 11}, {\"id\": 4, \"orderIndex\": 12}, {\"id\": 5, \"orderIndex\": 13}, {\"id\": 6, \"orderIndex\": 14}, {\"id\": 23, \"orderIndex\": 15}, {\"id\": 8, \"orderIndex\": 16}, {\"id\": 9, \"orderIndex\": 17}, {\"id\": 24, \"orderIndex\": 18}], \"beforeOrder\": [{\"id\": 3, \"orderIndex\": 0}, {\"id\": 17, \"orderIndex\": 2}, {\"id\": 16, \"orderIndex\": 3}, {\"id\": 18, \"orderIndex\": 4}, {\"id\": 19, \"orderIndex\": 5}, {\"id\": 20, \"orderIndex\": 6}, {\"id\": 21, \"orderIndex\": 7}, {\"id\": 15, \"orderIndex\": 8}, {\"id\": 13, \"orderIndex\": 9}, {\"id\": 10, \"orderIndex\": 10}, {\"id\": 1, \"orderIndex\": 11}, {\"id\": 2, \"orderIndex\": 12}, {\"id\": 4, \"orderIndex\": 13}, {\"id\": 5, \"orderIndex\": 14}, {\"id\": 6, \"orderIndex\": 15}, {\"id\": 23, \"orderIndex\": 16}, {\"id\": 8, \"orderIndex\": 17}, {\"id\": 9, \"orderIndex\": 18}, {\"id\": 24, \"orderIndex\": 19}]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 12:07:42', '2026-04-07 12:07:42', '2026-04-07 12:07:42'),
(11, 'payment_sheet_with_date', NULL, 'reorder', 1, 'admin', 'Admin', 'admin@lacas.com', 'approved', '[\"orderIndex\"]', NULL, NULL, '{\"message\": \"Rows reordered in payment sheet\", \"afterOrder\": [{\"id\": 3, \"orderIndex\": 0}, {\"id\": 17, \"orderIndex\": 1}, {\"id\": 16, \"orderIndex\": 2}, {\"id\": 18, \"orderIndex\": 3}, {\"id\": 19, \"orderIndex\": 4}, {\"id\": 20, \"orderIndex\": 5}, {\"id\": 21, \"orderIndex\": 6}, {\"id\": 15, \"orderIndex\": 7}, {\"id\": 13, \"orderIndex\": 8}, {\"id\": 10, \"orderIndex\": 9}, {\"id\": 1, \"orderIndex\": 10}, {\"id\": 2, \"orderIndex\": 11}, {\"id\": 4, \"orderIndex\": 12}, {\"id\": 5, \"orderIndex\": 13}, {\"id\": 6, \"orderIndex\": 14}, {\"id\": 23, \"orderIndex\": 15}, {\"id\": 8, \"orderIndex\": 16}, {\"id\": 9, \"orderIndex\": 17}, {\"id\": 24, \"orderIndex\": 18}], \"beforeOrder\": [{\"id\": 3, \"orderIndex\": 0}, {\"id\": 17, \"orderIndex\": 1}, {\"id\": 16, \"orderIndex\": 2}, {\"id\": 18, \"orderIndex\": 3}, {\"id\": 20, \"orderIndex\": 4}, {\"id\": 19, \"orderIndex\": 5}, {\"id\": 21, \"orderIndex\": 6}, {\"id\": 15, \"orderIndex\": 7}, {\"id\": 13, \"orderIndex\": 8}, {\"id\": 10, \"orderIndex\": 9}, {\"id\": 1, \"orderIndex\": 10}, {\"id\": 2, \"orderIndex\": 11}, {\"id\": 4, \"orderIndex\": 12}, {\"id\": 5, \"orderIndex\": 13}, {\"id\": 6, \"orderIndex\": 14}, {\"id\": 23, \"orderIndex\": 15}, {\"id\": 8, \"orderIndex\": 16}, {\"id\": 9, \"orderIndex\": 17}, {\"id\": 24, \"orderIndex\": 18}]}', NULL, NULL, NULL, NULL, NULL, '2026-04-17 12:07:44', '2026-04-07 12:07:44', '2026-04-07 12:07:44');

-- --------------------------------------------------------

--
-- Table structure for table `recycle_bin`
--

CREATE TABLE `recycle_bin` (
  `id` int NOT NULL,
  `original_tuition_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `demo_time` time DEFAULT NULL,
  `time_hour` int DEFAULT NULL,
  `tuition_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `source` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `parents_contact` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `class` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `subjects` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tutor_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tutor_fee` decimal(12,2) DEFAULT NULL,
  `rejected_tutor` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_general_ci,
  `demo_date` date DEFAULT NULL,
  `tuition_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `demo_rating` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sync_flag` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `row_color` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '#ffffff',
  `tuition_name_color` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '#ffffff',
  `order_index` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `today_demo`
--

CREATE TABLE `today_demo` (
  `id` int NOT NULL,
  `original_tuition_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `demo_time` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `time_hour` int DEFAULT NULL,
  `tuition_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `source` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `parents_contact` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `class` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `subjects` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tutor_name` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tutor_fee` decimal(12,2) DEFAULT NULL,
  `rejected_tutor` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_general_ci,
  `demo_date` date DEFAULT NULL,
  `tuition_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `demo_rating` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `days_per_week` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sync_flag` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `row_color` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '#ffffff',
  `tuition_name_color` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '#ffffff',
  `order_index` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `removed_from_today` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `today_demo`
--

INSERT INTO `today_demo` (`id`, `original_tuition_id`, `demo_time`, `time_hour`, `tuition_name`, `source`, `country`, `parents_contact`, `class`, `subjects`, `tutor_name`, `tutor_fee`, `rejected_tutor`, `status`, `feedback`, `demo_date`, `tuition_id`, `demo_rating`, `days_per_week`, `sync_flag`, `row_color`, `tuition_name_color`, `order_index`, `created_at`, `updated_at`, `removed_from_today`) VALUES
(1, 'T-2984', '20:00', 20, 'Muskan Huris UAE Online Tuition', 'mahad', 'UAE', '9718283838', 'Grade 9 Federal', 'Math & Physics', NULL, NULL, NULL, 'Tuition Done', NULL, '2026-03-18', 'T-2984', NULL, '4 Days', NULL, '#ffffff', '#ffffff', 1, '2026-03-26 05:39:15', '2026-04-02 16:01:02', 0),
(2, 'T-3548', '15:00', 15, 'Abdul Basit Oman Online Tuition', 'mahad', NULL, '96838328292', 'Grade 1 ', 'English ', NULL, NULL, NULL, '2nd Demo Done', NULL, '2026-03-20', 'T-3548', NULL, '4 Days', NULL, '#ffffff', '#ffffff', 2, '2026-03-26 05:39:41', '2026-04-02 16:01:02', 0),
(3, 'T-9331', '08:35', 8, 'ahmed', 'mahad', 'pakistan', '322432432442', 'o level', 'math,physics', 'bilal ahmed', '5000.00', 'bilal', 'Tuition Done, 2nd Demo Done, 1st Demo Done', 'think about satisfied okay think about satisfiedokaythink about satisfiedokaythink about satisfiedokaythink about satisfiedokay  erewrew', '2026-03-27', 'T-9331', 'Weak Demo', '3 days', 'sync', '#ffffff', '#ffffff', 0, '2026-03-26 06:22:27', '2026-04-02 16:01:02', 0),
(4, 'T-2109', '01:00', 1, 'Abdullah KSA Online Tuition', 'areeba', NULL, '9668838282', 'Grade 11', 'Math & Physics', NULL, NULL, NULL, 'payment Process', NULL, '2025-12-18', 'T-2109', NULL, '4 Days ', NULL, '#ffffff', '#ffffff', 0, '2026-03-26 09:54:52', '2026-04-02 16:01:02', 0),
(5, 'T-5086', '06:00', 6, 'Abdul Sattar Saudi Online Tuition', 'areeba', NULL, NULL, 'A Level ', 'Busniss', NULL, NULL, NULL, 'Tuition Done', NULL, '2026-03-20', 'T-5086', NULL, '3 Days', NULL, '#ffffff', '#ffffff', 3, '2026-03-26 09:54:52', '2026-04-02 16:01:02', 0),
(6, 'T-1058', '12:30', 12, 'Hania O level 1 Online Tuition', 'mahad', 'Saudi', '03202020303d', 'IGCSE', 'English', NULL, NULL, NULL, '1st Demo Done, 2nd Demo Done', 'yes this is working', '2026-03-19', 'T-1058', NULL, '4 Days', NULL, '#ffffff', '#ffffff', 4, '2026-03-26 09:54:53', '2026-04-02 16:01:02', 0),
(7, 'T-1600', '09:00', 9, 'bilal junaid', 'areeba', 'pakistan', '32432423', 'o level', 'math ', 'firoz', '10000.00', NULL, '1st Demo Done, 2nd Demo Done, Tuition Done', 'hello how are you?i\'m good', '2026-04-05', 'T-1600', 'Average Demo', '4 days', NULL, '#ffffff', '#ffffff', 6, '2026-03-31 05:16:51', '2026-04-02 16:08:10', 0),
(8, 'T-213213', '21:00', 21, 'almas', 'mahad', 'pakistan ', '+923230232', '9th ', 'english', 'Sint amet dolor ul', '5000.00', NULL, NULL, 'Magnam nemo se', '2011-12-21', 'T-213213', 'Average Demo', '3 days', 'sync', '#ffffff', '#ffffff', 7, '2026-03-31 06:19:41', '2026-04-02 16:01:02', 0),
(9, 'T-9404', '10:00', 10, 'some tuitoin', 'mahad', 'pakistan', '03240032', NULL, NULL, NULL, '10000.00', NULL, '1st Demo Done', NULL, '2026-03-15', 'T-9404', 'Strong Demo', NULL, NULL, '#ffffff', '#ffffff', 8, '2026-03-31 06:57:57', '2026-03-31 07:02:09', 0),
(10, 'T-8475', '06:00', 6, 'Mrs Awias Online Tuition', 'mahad', 'UAE', '94382819292', 'Grade 5', 'All Subjects', NULL, NULL, NULL, 'Tuition Done', NULL, '2026-03-16', 'T-8475', NULL, '4 Days A week', NULL, '#ffffff', '#ffffff', 5, '2026-04-02 15:36:20', '2026-04-02 16:01:02', 0);

-- --------------------------------------------------------

--
-- Table structure for table `tuitions`
--

CREATE TABLE `tuitions` (
  `id` int UNSIGNED NOT NULL,
  `tuition_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `date` date DEFAULT NULL,
  `demo_time` varchar(50) DEFAULT NULL,
  `time_hour` tinyint UNSIGNED DEFAULT NULL,
  `tuition_name` varchar(191) DEFAULT NULL,
  `source` varchar(191) DEFAULT NULL,
  `otm_name` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `parents_contact` varchar(191) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  `subjects` varchar(255) DEFAULT NULL,
  `days_per_week` varchar(50) DEFAULT NULL,
  `estimated_fee` varchar(50) DEFAULT NULL,
  `tutor_name` varchar(191) DEFAULT NULL,
  `tutor_fee` varchar(50) DEFAULT NULL,
  `second_tutors` varchar(191) DEFAULT NULL,
  `rejected_tutor` varchar(191) DEFAULT NULL,
  `status` varchar(191) DEFAULT NULL,
  `feedback` text,
  `demo_date` date DEFAULT NULL,
  `satisfaction_rating` varchar(191) DEFAULT NULL,
  `demo_rating` varchar(50) DEFAULT NULL,
  `sync_flag` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_staff_id` int UNSIGNED DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deletedFromTodayDemo` tinyint(1) DEFAULT '0',
  `assigned_to` int UNSIGNED DEFAULT NULL,
  `order_index` int DEFAULT '0',
  `row_color` varchar(20) DEFAULT NULL,
  `tuition_name_color` varchar(20) DEFAULT NULL,
  `payment_approval_status` varchar(20) DEFAULT NULL,
  `payment_approval_requested_at` datetime DEFAULT NULL,
  `payment_approved_at` datetime DEFAULT NULL,
  `payment_approved_by` int UNSIGNED DEFAULT NULL,
  `payment_rejection_reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tuitions`
--

INSERT INTO `tuitions` (`id`, `tuition_id`, `date`, `demo_time`, `time_hour`, `tuition_name`, `source`, `otm_name`, `country`, `parents_contact`, `class`, `subjects`, `days_per_week`, `estimated_fee`, `tutor_name`, `tutor_fee`, `second_tutors`, `rejected_tutor`, `status`, `feedback`, `demo_date`, `satisfaction_rating`, `demo_rating`, `sync_flag`, `created_at`, `updated_at`, `assigned_staff_id`, `is_deleted`, `deletedFromTodayDemo`, `assigned_to`, `order_index`, `row_color`, `tuition_name_color`, `payment_approval_status`, `payment_approval_requested_at`, `payment_approved_at`, `payment_approved_by`, `payment_rejection_reason`) VALUES
(3, '1003', '2026-02-04', NULL, 10, 'Usman Tuition', 'Website', NULL, 'PK', '0300-3333333', '11', 'Physics', '4', '9000', 'Hina', '3000', NULL, 'XYZ', 'Tuition Done', 'Nice demo jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', '2026-02-05', 'Excellent', 'Weak Demo', NULL, '2026-02-11 20:03:10', '2026-03-05 12:58:58', NULL, 1, 0, NULL, 0, '#d93030', '#5cffd6', NULL, NULL, NULL, NULL, NULL),
(4, '1004', '2026-02-04', NULL, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Done', NULL, NULL, NULL, 'Strong Demo', NULL, '2026-02-11 20:03:10', '2026-03-13 11:52:43', NULL, 1, 0, NULL, 3, '#ffffff', '#ffffff', NULL, NULL, NULL, NULL, NULL),
(5, '1005', '2026-02-04', NULL, 13, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1st Demo Done', NULL, NULL, 'Average', 'Weak Demo', NULL, '2026-02-11 20:03:10', '2026-03-13 11:52:38', NULL, 1, 0, NULL, 4, '#ffffff', '#ffffff', NULL, NULL, NULL, NULL, NULL),
(7, '32432432', '2026-09-12', NULL, 16, 'bilal', 'bilal', NULL, 'UAE', '+9230403043', '8th', 'math,english', '2', '2131', 'Iusto nisi anim dese', NULL, 'Nostrum deserunt quo', 'In molestiae libero ', 'active', 'In sed quam ducimus', '2025-01-12', 'Molestiae nisi cupid', 'Strong Demo', 'okay', '2026-02-16 14:54:17', '2026-03-25 17:01:08', NULL, 1, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'Minima beatae adipis', '1981-12-06', NULL, 13, 'Corrupti architecto', 'Non omnis lorem magn', NULL, 'Et fugiat a est rep', 'Consectetur rem vol', 'Nostrud proident et', 'Delectus distinctio', 'Maiores alias minima', 'Qui saepe pariatur ', 'Quae possimus delen', 'Non doloremque dolor', 'Dolores iure volupta', 'Doloribus fugit duc', 'pending', 'Placeat rerum sit v', '2006-08-10', 'Accusamus id non des', 'Strong Demo', NULL, '2026-02-17 13:19:57', '2026-03-25 17:00:11', NULL, 1, 0, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'Et cupidatat aliqua', '2018-04-16', NULL, 16, 'saad', 'Laborum Reiciendis ', NULL, 'Maiores sed ut molli', 'Neque officia minus ', 'Ex id Nam saepe aspe', 'english', 'Elit dolore dolore ', 'Aliquip eum dolores ', 'Veniam aut aut aut ', 'Distinctio Quasi ha', 'Unde necessitatibus ', 'Dolores doloribus om', 'okay', 'Assumenda enim paria', '1999-01-15', 'Reiciendis aut in fu', 'Strong Demo', NULL, '2026-02-17 15:24:29', '2026-03-25 17:01:17', NULL, 1, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'T-8378', '1987-02-16', NULL, 12, 'Odit et sunt nihil u', NULL, NULL, 'Autem velit qui lab', 'Ad perferendis vitae', 'Aut perferendis volu', 'Culpa occaecat exer', 'Dolores aut beatae a', 'Enim beatae et labor', 'Quis exercitation co', 'Exercitationem magna', 'Beatae ut laboris un', 'Molestiae impedit e', 'Consectetur et numqu', 'Tempora nesciunt re', '1978-04-23', NULL, 'Strong Demo', NULL, '2026-02-17 15:54:09', '2026-02-23 13:32:40', NULL, 1, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'Architecto amet cil', '1972-04-19', NULL, 11, 'Nemo aperiam molesti', 'mahad', NULL, 'Quia deserunt ducimu', 'Voluptatem sit qui ', 'Officia est omnis de', 'Voluptas anim totam ', 'Perspiciatis vero d', 'Labore et pariatur ', 'Vel sed nisi digniss', 'Sit harum ratione do', NULL, 'Voluptatem odit volu', 'Completed', 'Nice demo jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj', '2023-07-28', NULL, 'Strong Demo', 'Enim numquam tenetur', '2026-02-23 12:47:18', '2026-03-11 12:44:14', NULL, 1, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'Numquam cum qui aut', '1971-10-09', NULL, 13, 'Ullamco magnam provi', 'mahad', NULL, 'Ad ut recusandae Qu', 'Est totam sint vitae', 'Qui ut unde molestia', 'Est ut molestiae en', 'Facilis quisquam exp', 'Debitis provident s', 'Possimus sed error ', 'Quos ab reprehenderi', NULL, 'Ut corrupti molesti', 'Pending', 'Omnis veritatis dolo', '1993-11-22', NULL, 'Weak Demo', 'Expedita commodo est', '2026-02-23 13:26:38', '2026-03-25 17:00:11', NULL, 1, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'T-32423', '2012-07-24', NULL, 8, 'Sint ex ipsum conseq', 'areeba', NULL, 'Ut voluptatem volu', 'Voluptas eiusmod duc', 'Omnis facilis omnis ', 'Et sint esse aliqua', 'Illum deserunt dese', '3000', 'Dolorem et tempore ', 'Consectetur consequ', NULL, 'Omnis nisi eos debi', 'Tuition Cancelled', 'satisfied', '1989-08-16', NULL, 'Strong Demo', 'synced', '2026-02-23 13:33:13', '2026-03-18 14:22:52', NULL, 1, 0, NULL, 1, '#8b8989', NULL, NULL, NULL, NULL, NULL, NULL),
(15, 'T-324324', '2017-07-12', NULL, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Done', NULL, NULL, NULL, 'Strong Demo', 'sync', '2026-02-23 13:52:26', '2026-03-13 11:52:27', NULL, 1, 0, NULL, 0, '#ffffff', NULL, NULL, NULL, NULL, NULL, NULL),
(16, 'T-9502', '2026-02-24', '10:00', 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-24 11:50:05', '2026-02-27 13:26:02', NULL, 1, 0, NULL, 0, '#cbc8c8', NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'T-1170', '2026-02-24', '10:00', 10, 'Mrs awais Online Tuition', 'mahad', NULL, NULL, '32432432432', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-24 11:50:37', '2026-03-04 14:45:52', NULL, 1, 0, NULL, 0, '#00c2a2', NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'T-1649', '2026-02-25', NULL, 12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-25 12:09:22', '2026-02-25 12:09:28', NULL, 1, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 'T-7555', '2026-03-04', NULL, 18, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Done', NULL, NULL, NULL, 'Strong Demo', NULL, '2026-03-03 12:01:20', '2026-03-13 11:52:35', NULL, 1, 0, NULL, 2, '#ffffff', '#fce4ec', NULL, NULL, NULL, NULL, NULL),
(23, 'T-8870', '2026-03-05', NULL, 21, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1st Demo Done', NULL, NULL, NULL, 'Average Demo', 'sync', '2026-03-05 14:25:13', '2026-03-13 11:52:46', NULL, 1, 0, NULL, 6, NULL, '#f8f9fa', NULL, NULL, NULL, NULL, NULL),
(24, 'T-6335', '2026-03-11', NULL, 12, NULL, NULL, 'some', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tuition Done', NULL, NULL, NULL, 'Weak Demo', NULL, '2026-03-11 12:52:04', '2026-03-13 11:52:32', NULL, 1, 0, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 'T-2966', '2026-03-16', '18:07', 18, 'bilal', 'areeba', 'fahad', 'pakistan', '03075447452', 'o level', 'eng,math', '3', '10000', 'bali', '200003000', NULL, 'huzaiffahad', 'Tuition Done', 'updated', '2026-01-12', NULL, 'Average Demo', 'sync', '2026-03-16 10:08:45', '2026-03-17 12:12:29', NULL, 1, 0, NULL, 0, '#fff8e1', '#209024', NULL, NULL, NULL, NULL, NULL),
(26, 'T-8475', '2026-03-17', '06:00', 6, 'Mrs Awias Online Tuition', 'mahad', NULL, 'UAE', '94382819292', 'Grade 5', 'All Subjects', '4 Days A week', 'Parents Offering 300 Dirhams ', NULL, NULL, NULL, NULL, 'Tuition Done', NULL, '2026-03-16', NULL, NULL, NULL, '2026-03-17 12:12:08', '2026-04-02 15:36:34', NULL, 0, 0, NULL, 5, NULL, NULL, 'approved', '2026-04-02 10:36:20', '2026-04-02 15:36:34', 1, NULL),
(27, 'T-1058', '2026-03-17', '12:30', 0, 'Hania O level 1 Online Tuition', 'mahad', NULL, 'Saudi', '03202020303d', 'IGCSE', 'English', '4 Days', 'Parents Offering 300 Dirhams ', NULL, NULL, NULL, NULL, '1st Demo Done, 2nd Demo Done', 'yes this is working', '2026-03-19', NULL, NULL, NULL, '2026-03-17 12:15:48', '2026-04-02 15:38:19', NULL, 0, 0, NULL, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 'T-5086', '2026-03-17', '06:00', 6, 'Abdul Sattar Saudi Online Tuition', 'areeba', NULL, NULL, NULL, 'A Level ', 'Busniss', '3 Days', 'Parents Offering 300 Dirhams', NULL, NULL, NULL, NULL, 'Tuition Done, 1st Demo Done', NULL, '2026-03-20', NULL, NULL, NULL, '2026-03-17 12:17:21', '2026-04-02 15:26:46', NULL, 0, 0, NULL, 3, NULL, NULL, 'approved', '2026-04-02 10:26:26', '2026-04-02 15:26:46', 1, NULL),
(29, 'T-2984', '2026-03-17', '20:00', 20, 'Muskan Huris UAE Online Tuition', 'mahad', NULL, 'UAE', '9718283838', 'Grade 9 Federal', 'Math & Physics', '4 Days', NULL, NULL, NULL, NULL, NULL, 'Tuition Done', NULL, '2026-03-18', NULL, NULL, NULL, '2026-03-17 12:21:49', '2026-03-26 09:54:54', NULL, 0, 0, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'T-2109', '2026-03-17', '01:00', 1, 'Abdullah KSA Online Tuition', 'areeba', NULL, NULL, '9668838282', 'Grade 11', 'Math & Physics', '4 Days ', NULL, NULL, NULL, NULL, NULL, 'Tuition Done', NULL, '2025-12-18', NULL, NULL, NULL, '2026-03-17 12:23:23', '2026-03-31 05:27:08', NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 'T-3548', '2026-03-17', '15:00', 15, 'Abdul Basit Oman Online Tuition', 'mahad', NULL, NULL, '96838328292', 'Grade 1 ', 'English ', '4 Days', 'Parents Offering 300 Dirhams  ', NULL, NULL, NULL, NULL, '2nd Demo Done', NULL, '2026-03-20', NULL, NULL, NULL, '2026-03-17 12:24:38', '2026-03-26 09:55:48', NULL, 0, 0, NULL, 2, '#fdd835', NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'T-9331', '2026-03-26', '08:35', 9, 'ahmed', 'mahad', 'rafaqat', 'pakistan', '322432432442', 'o level', 'math,physics', '3 days', '25000', 'bilal ahmed', '5000', NULL, 'bilal', 'Tuition Done', 'think about satisfied okay think about satisfiedokaythink about satisfiedokaythink about satisfiedokaythink about satisfiedokay  erewrew', '2026-03-27', NULL, 'Weak Demo', 'sync', '2026-03-26 06:22:27', '2026-03-27 16:01:41', NULL, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 'T-1600', '2026-03-31', '09:00', 12, 'bilal junaid', 'areeba', 'rafaqat', 'pakistan', '32432423', 'o level', 'math ', '4 days', '40000', 'firoz', '10000.00', NULL, NULL, '1st Demo Done, 2nd Demo Done, Tuition Done', 'hello how are you?i\'m good', '2026-04-05', NULL, 'Average Demo', NULL, '2026-03-31 05:16:51', '2026-04-02 16:08:10', NULL, 0, 0, NULL, 6, NULL, NULL, 'approved', '2026-04-02 11:05:52', '2026-04-02 16:07:03', 1, NULL),
(34, 'T-213213', '2021-05-07', '21:00', 21, 'almas', 'mahad', 'Aut perspiciatis po', 'pakistan ', '+923230232', '9th ', 'english', '3 days', '10000', 'Sint amet dolor ul', '5000', NULL, NULL, '1st Demo Done, 2nd Demo Done, Tuition Done', 'Magnam nemo se', '2011-12-21', NULL, 'Average Demo', 'sync', '2026-03-31 06:19:41', '2026-03-31 07:08:32', NULL, 0, 0, NULL, 7, NULL, NULL, 'approved', '2026-03-31 01:31:23', '2026-03-31 07:08:32', 1, NULL),
(35, 'T-9404', '2026-03-31', '10:00', 10, 'some tuitoin', 'mahad', NULL, 'pakistan', '03240032', NULL, NULL, NULL, NULL, NULL, '10000', NULL, NULL, '1st Demo Done, Tuition Done', NULL, '2026-03-15', NULL, 'Strong Demo', NULL, '2026-03-31 06:57:57', '2026-03-31 07:08:33', NULL, 0, 0, NULL, 8, NULL, NULL, 'approved', '2026-03-30 20:58:14', '2026-03-31 07:08:33', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(120) DEFAULT NULL,
  `password_hash` varchar(191) NOT NULL,
  `role` enum('admin','staff','hod','otm') NOT NULL DEFAULT 'admin',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `toggle_today_demo_feedback` tinyint(1) DEFAULT '0',
  `status` varchar(255) DEFAULT NULL,
  `time_tuition` varchar(255) DEFAULT NULL,
  `tutor_name` varchar(255) DEFAULT NULL,
  `demo_date` date DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `access_monthly` tinyint(1) DEFAULT '1',
  `access_demo` tinyint(1) DEFAULT '1',
  `access_trash` tinyint(1) DEFAULT '0',
  `access_payment_sheet` tinyint(1) NOT NULL DEFAULT '0',
  `access_tutor_share` tinyint(1) NOT NULL DEFAULT '0',
  `access_lacas_share` tinyint(1) NOT NULL DEFAULT '0',
  `access_total_fees` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password_hash`, `role`, `created_at`, `updated_at`, `toggle_today_demo_feedback`, `status`, `time_tuition`, `tutor_name`, `demo_date`, `rating`, `access_monthly`, `access_demo`, `access_trash`, `access_payment_sheet`, `access_tutor_share`, `access_lacas_share`, `access_total_fees`) VALUES
(1, 'admin@lacas.com', 'Admin', '$2b$10$9wJWkecDnx4Ae/GXFh.qdusfqk9AHvGUqYLib28kCxl7aLAqta9i2', 'admin', '2026-02-11 20:03:10', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 1, 1, 1, 1, 1),
(2, 'staff@lacas.com', 'Staff', '$2a$10$V9C/6aHFCDWpcD4nhG5QvuL0yc2acYzw8ZiiQVJK5/UDgfunO7FdO', 'staff', '2026-02-17 14:44:47', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 1, 1, 0, 0, 0),
(3, 'hod@lacas.com', 'Hod', '$2a$10$CbQNiMphUh/yhHHoxyRfA.aeSm3vegaXYsdO/4pMeK/0CXrP9rRI2', 'hod', '2026-03-05 12:15:05', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0, 0),
(4, 'saad@hod.com', 'Saad', '$2a$10$ZJHutph5FILT/qAR3.23WuW2M/envRZdwTzOHCzqn6QBSlJJ4CxE.', 'hod', '2026-03-09 12:21:52', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0, 0),
(5, 'hod@lacas.com.pk', 'Hod', '$2a$10$fN0daktleAL1XjGPFjxNCekydknraRGTkEd4DgwNfwXF..uKiM2hm', 'hod', '2026-03-11 11:54:22', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0, 0),
(6, 'admin@gmail.com', 'Admin', '$2a$10$HfWm5kCrjyuAHxPvYlwVxejkp0ZCL6PvBWECtu8RzKe2NvB3T72lS', 'admin', '2026-03-11 12:48:49', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 1, 1, 1, 1, 1),
(8, 'khalil@lacas.com', 'Khalil', '$2a$10$JenZUkcqe.5tQwCOkxyZDesgaHjw9Vpf4YnVOnJiTndAGiRbs1cNm', 'staff', '2026-03-12 12:28:19', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0, 0),
(9, 'amir@lacas.com', 'Amir', '$2a$10$LA51IWphq8190p2aDimtQebPeTOdXhuTm.n7xatA2HcKZFaBaRjCO', 'staff', '2026-03-13 11:39:11', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 1, 1, 1, 1),
(10, 'hod@lacashometutors.com', 'Hod', '$2a$10$WnjYd5ZR//NvL9oPOuQYL.jJ9yljVVHlvSV2LHANryoKVAqIBHv/m', 'hod', '2026-03-31 06:22:14', '2026-04-03 10:32:26', 0, NULL, NULL, NULL, NULL, NULL, 1, 1, 0, 0, 0, 0, 0),
(11, 'otm@lacas.com', NULL, '$2a$10$JZahb6IEgB3GoyCWprIqMei1EvhndjkjdT5lijh6jNpj2p0cqFGyK', 'otm', '2026-04-03 06:08:31', '2026-04-03 16:07:35', 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_presence`
--

CREATE TABLE `user_presence` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `session_id` varchar(191) NOT NULL,
  `current_sheet` varchar(50) NOT NULL DEFAULT 'dashboard',
  `is_online` tinyint(1) NOT NULL DEFAULT '1',
  `login_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user_presence`
--

INSERT INTO `user_presence` (`id`, `user_id`, `session_id`, `current_sheet`, `is_online`, `login_at`, `last_seen_at`, `user_agent`, `ip_address`, `created_at`, `updated_at`) VALUES
(1, 2, 'sess-1773326012417-bukl7bevr', 'main', 1, '2026-03-14 18:35:59', '2026-03-12 14:40:08', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-12 14:35:59', '2026-03-12 14:40:08'),
(2, 1, 'sess-1773326012382-g9pfpc793', 'staff', 1, '2026-03-15 02:35:59', '2026-03-12 14:40:10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-12 14:35:59', '2026-03-12 14:40:10'),
(3, 1, 'sess-1773378430555-9robvd5il', 'target', 1, '2026-03-21 21:07:13', '2026-03-13 05:26:07', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '127.0.0.1', '2026-03-13 05:07:13', '2026-03-13 05:26:07'),
(4, 1, 'sess-1773383077140-7fc3x6dls', 'payment', 1, '2026-04-19 02:24:39', '2026-03-13 09:22:32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '127.0.0.1', '2026-03-13 06:24:39', '2026-03-13 09:22:32'),
(5, 1, 'sess-1773401574846-eul1mcokl', 'payment', 1, '2026-04-10 23:36:42', '2026-03-21 08:36:30', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15', '127.0.0.1', '2026-03-13 11:30:58', '2026-03-21 08:36:31'),
(6, 9, 'sess-1773401505612-fkza1kllt', 'target', 1, '2026-03-30 11:49:55', '2026-03-13 12:33:09', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-13 11:31:48', '2026-03-13 12:33:10'),
(7, 1, 'sess-1773405220323-cbvh29q5r', 'payment', 1, '2026-04-12 00:34:10', '2026-03-13 13:57:59', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-13 12:33:43', '2026-03-13 13:57:59'),
(8, 9, 'sess-1773655552682-u7hh10jhy', 'payment', 1, '2026-03-20 06:05:58', '2026-03-16 10:12:23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-16 10:05:58', '2026-03-16 10:12:23'),
(9, 1, 'sess-1773656074668-1oy7f3n1m', 'payment', 1, '2026-04-20 22:14:35', '2026-03-16 12:54:50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '127.0.0.1', '2026-03-16 10:14:35', '2026-03-16 12:54:50'),
(10, 1, 'sess-1773656271767-ax6ml5nei', 'main', 1, '2026-05-10 22:17:53', '2026-03-16 12:54:50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-16 10:17:53', '2026-03-16 12:54:50'),
(11, 9, 'sess-1773750686170-7isi510zc', 'main', 1, '2026-04-06 16:31:27', '2026-03-17 13:40:07', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-17 12:31:27', '2026-03-17 13:40:07'),
(12, 1, 'sess-1773835870724-57vvt5hie', 'main', 1, '2026-05-03 20:11:12', '2026-03-18 14:21:06', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-18 12:11:12', '2026-03-18 14:21:06'),
(13, 1, 'sess-1773843742088-p58gbntwn', 'target', 1, '2026-03-23 18:22:23', '2026-03-18 14:31:30', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '127.0.0.1', '2026-03-18 14:22:23', '2026-03-18 14:31:30'),
(14, 1, 'sess-1774457554495-elcref55s', 'target', 1, '2026-03-18 09:53:58', '2026-03-25 17:04:00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-25 16:53:58', '2026-03-25 17:04:00'),
(15, 1, 'sess-1774502756511-disitt7bc', 'main', 1, '2026-02-02 09:39:42', '2026-03-26 10:14:09', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-26 05:25:56', '2026-03-26 10:14:09'),
(16, 1, 'sess-1774518872333-fyc6x4565', 'staff', 1, '2026-03-20 03:54:32', '2026-03-26 10:14:23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-03-26 09:54:32', '2026-03-26 10:14:23'),
(17, 1, 'sess-1774525374345-njr3sm91h', 'payment', 1, '2026-02-26 03:42:54', '2026-03-26 12:37:23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-26 11:42:54', '2026-03-26 12:37:23'),
(18, 1, 'sess-1774528632255-llrilh7y8', 'payment', 1, '2026-03-24 10:37:12', '2026-03-26 14:03:22', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-26 12:37:12', '2026-03-26 14:03:22'),
(19, 1, 'sess-1774617996505-etgjs567f', 'payment', 1, '2026-01-27 10:15:33', '2026-03-27 16:01:44', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-27 14:15:33', '2026-03-27 16:01:44'),
(20, 1, 'sess-1774617929809-2mf5vi7l5', 'payment', 1, '2026-02-23 22:15:33', '2026-03-27 16:01:54', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-03-27 14:15:33', '2026-03-27 16:01:54'),
(21, 1, 'sess-1774844500167-i8zztaos4', 'payment', 1, '2026-02-28 09:57:33', '2026-03-30 06:16:27', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-30 04:57:33', '2026-03-30 06:16:27'),
(22, 1, 'sess-1774846875742-07gpkhvpa', 'staff', 1, '2026-03-06 16:01:15', '2026-03-30 06:18:59', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-30 05:01:15', '2026-03-30 06:18:59'),
(23, 1, 'sess-1774933765122-qx35nb21g', 'trash', 1, '2026-01-14 19:12:48', '2026-03-31 07:34:32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-31 05:12:48', '2026-03-31 07:34:32'),
(24, 10, 'sess-1774938160774-1tx8qr7rs', 'payment', 0, '2026-03-30 06:33:27', '2026-03-31 07:33:45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-03-31 06:22:40', '2026-03-31 07:33:45'),
(25, 1, 'sess-1775059105136-zwregu2kp', 'main', 1, '2026-02-23 03:58:25', '2026-04-01 16:30:27', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-01 15:58:25', '2026-04-01 16:30:27'),
(26, 1, 'sess-1775143227116-vpz784ijg', 'payment', 1, '2026-03-24 21:25:18', '2026-04-02 15:34:08', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-02 15:25:18', '2026-04-02 15:34:08'),
(27, 1, 'sess-1775144060887-r40gyx53g', 'payment', 1, '2026-02-02 16:34:28', '2026-04-02 17:00:38', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-02 15:34:28', '2026-04-02 17:00:38'),
(28, 1, 'sess-1775191469857-bbwd9pv5l', 'main', 1, '2026-04-02 23:44:29', '2026-04-03 04:44:50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-03 04:44:29', '2026-04-03 04:44:50'),
(29, 1, 'sess-1775196475620-rcndmn7yd', 'otm_management', 1, '2026-03-05 02:07:55', '2026-04-03 10:02:43', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-03 06:07:55', '2026-04-03 10:02:43'),
(30, 1, 'sess-1775210446306-nf4m6u9cy', 'target', 1, '2026-03-29 05:00:53', '2026-04-03 10:04:11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-04-03 10:00:53', '2026-04-03 10:04:11'),
(31, 11, 'sess-1775231494926-wcnmcfm5i', 'otm_management', 1, '2026-03-16 03:06:16', '2026-04-03 16:52:01', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-03 15:51:35', '2026-04-03 16:52:01'),
(32, 1, 'sess-1775231939794-b6ijmqvzi', 'main', 1, '2026-04-03 15:58:59', '2026-04-03 15:58:59', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-04-03 15:59:00', '2026-04-03 15:59:00'),
(33, 1, 'sess-1775232404897-qcahrv9ku', 'staff', 1, '2026-03-26 23:06:45', '2026-04-03 16:47:24', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-03 16:06:45', '2026-04-03 16:47:24'),
(34, 1, 'sess-1775547612031-9pjgo9f14', 'payment', 1, '2026-02-16 17:40:49', '2026-04-07 11:10:58', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-07 07:40:12', '2026-04-07 11:10:58'),
(35, 1, 'sess-1775559304225-sesb875u9', 'payment', 1, '2026-03-31 13:55:04', '2026-04-07 11:11:57', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-07 10:55:04', '2026-04-07 11:11:57'),
(36, 1, 'sess-1775560914010-qe4v37o1j', 'payment', 1, '2026-04-07 01:21:54', '2026-04-07 11:21:57', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-04-07 11:21:54', '2026-04-07 11:21:57'),
(37, 1, 'sess-1775561118584-rubq1t90r', 'payment', 1, '2026-04-06 20:25:18', '2026-04-07 11:25:26', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-04-07 11:25:18', '2026-04-07 11:25:26'),
(38, 1, 'sess-1775561913616-m447fw5mb', 'main', 1, '2026-04-07 11:38:33', '2026-04-07 11:38:33', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-04-07 11:38:33', '2026-04-07 11:38:33'),
(39, 1, 'sess-1775561914908-577e02gga', 'payment', 1, '2026-04-07 06:38:34', '2026-04-07 11:38:37', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '::1', '2026-04-07 11:38:34', '2026-04-07 11:38:37'),
(40, 1, 'sess-1775561997461-bwq95fx29', 'payment', 1, '2026-03-04 22:39:57', '2026-04-07 12:35:58', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-07 11:39:57', '2026-04-07 12:35:58'),
(41, 1, 'sess-1775565724269-7hrqkpgwp', 'main', 1, '2026-04-07 07:42:04', '2026-04-07 12:42:04', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-07 12:42:04', '2026-04-07 12:42:04'),
(42, 1, 'sess-1775565744278-q3uol7hpy', 'payment', 1, '2026-03-30 09:42:24', '2026-04-07 12:53:15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '::1', '2026-04-07 12:42:24', '2026-04-07 12:53:15');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `otm_tuition_entries`
--
ALTER TABLE `otm_tuition_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_otm_entries_user_id` (`user_id`),
  ADD KEY `idx_otm_entries_status` (`status`),
  ADD KEY `idx_otm_entries_day` (`day`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payments_tuition_id` (`tuition_id`),
  ADD KEY `idx_payments_status` (`status`),
  ADD KEY `idx_payments_date` (`payment_date`),
  ADD KEY `idx_payments_tuition_name` (`tuition_name`);

--
-- Indexes for table `payments_clone`
--
ALTER TABLE `payments_clone`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payments_clone_tuition_id` (`tuition_id`);

--
-- Indexes for table `payments_clone_trash`
--
ALTER TABLE `payments_clone_trash`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_change_requests`
--
ALTER TABLE `payment_change_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payment_change_requests_module_status` (`module_name`,`request_status`),
  ADD KEY `idx_payment_change_requests_actor` (`actor_user_id`),
  ADD KEY `idx_payment_change_requests_expires_at` (`expires_at`),
  ADD KEY `idx_payment_change_requests_payment_clone_id` (`payment_clone_id`),
  ADD KEY `fk_payment_change_requests_approved_by` (`approved_by`),
  ADD KEY `fk_payment_change_requests_rejected_by` (`rejected_by`);

--
-- Indexes for table `recycle_bin`
--
ALTER TABLE `recycle_bin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tuition_id` (`tuition_id`);

--
-- Indexes for table `today_demo`
--
ALTER TABLE `today_demo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tuition_id` (`tuition_id`),
  ADD UNIQUE KEY `uq_today_demo_tuition_id` (`tuition_id`),
  ADD KEY `idx_today_time` (`time_hour`,`order_index`),
  ADD KEY `idx_today_tuition_id` (`tuition_id`),
  ADD KEY `idx_today_demo_time_hour` (`time_hour`),
  ADD KEY `idx_today_demo_demo_date` (`demo_date`),
  ADD KEY `idx_today_demo_status` (`status`),
  ADD KEY `idx_today_demo_time_order_id` (`time_hour`,`order_index`,`id`),
  ADD KEY `idx_today_demo_removed_from_today` (`removed_from_today`);

--
-- Indexes for table `tuitions`
--
ALTER TABLE `tuitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tuitions_tuition_id` (`tuition_id`),
  ADD KEY `idx_tuitions_time_hour` (`time_hour`),
  ADD KEY `idx_tuitions_demo_date` (`demo_date`),
  ADD KEY `idx_today_demo` (`deletedFromTodayDemo`,`time_hour`),
  ADD KEY `idx_tuitions_payment_approval_status` (`payment_approval_status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- Indexes for table `user_presence`
--
ALTER TABLE `user_presence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_presence_session` (`session_id`),
  ADD KEY `idx_user_presence_user_id` (`user_id`),
  ADD KEY `idx_user_presence_last_seen_at` (`last_seen_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `otm_tuition_entries`
--
ALTER TABLE `otm_tuition_entries`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `payments_clone`
--
ALTER TABLE `payments_clone`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `payments_clone_trash`
--
ALTER TABLE `payments_clone_trash`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payment_change_requests`
--
ALTER TABLE `payment_change_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `recycle_bin`
--
ALTER TABLE `recycle_bin`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `today_demo`
--
ALTER TABLE `today_demo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tuitions`
--
ALTER TABLE `tuitions`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `user_presence`
--
ALTER TABLE `user_presence`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `otm_tuition_entries`
--
ALTER TABLE `otm_tuition_entries`
  ADD CONSTRAINT `fk_otm_entries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_change_requests`
--
ALTER TABLE `payment_change_requests`
  ADD CONSTRAINT `fk_payment_change_requests_actor_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_change_requests_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_change_requests_payment_clone` FOREIGN KEY (`payment_clone_id`) REFERENCES `payments_clone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_change_requests_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
