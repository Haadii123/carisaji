-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 24, 2026 at 02:38 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `carisaji`
--

-- --------------------------------------------------------

--
-- Table structure for table `menus`
--

CREATE TABLE `menus` (
  `menu_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `menus`
--

INSERT INTO `menus` (`menu_id`, `restaurant_id`, `item_name`, `price`, `category`) VALUES
(1, 1, 'Super Besar 1 (1 Pc Chicken + Nasi + Coca-Cola Reg)', 41500.00, 'Paket Kombo'),
(2, 1, 'Super Besar 2 (2 Pcs Chicken + Nasi + Coca-Cola Reg)', 54500.00, 'Paket Kombo'),
(3, 1, 'Winger Combo (3 Winger + Nasi + Minum)', 38500.00, 'Paket Kombo'),
(4, 1, 'Iced Kopi Susu Gula Aren', 22000.00, 'KFC Coffee'),
(5, 1, 'Hot Cappuccino', 24000.00, 'KFC Coffee'),
(6, 1, 'Donut Chocolate / Glazed', 12000.00, 'KFC Coffee'),
(7, 2, 'Jagoan Hemat 1 (1 Pc Chicken + Nasi + Aqua)', 31500.00, 'Paket Hemat'),
(8, 2, 'Super Star 1 (1 Pc Chicken + Nasi + Perkedel + Cream Soup + Minum)', 51500.00, 'Paket Kombo'),
(9, 2, 'O.R. Burger Single', 31000.00, 'Burger & Snack'),
(10, 2, 'Perkedel Kentang', 11500.00, 'Side Dish'),
(11, 2, 'KFC Pudding', 11000.00, 'Dessert'),
(12, 3, '9 Pcs Bucket Whole Chicken', 162000.00, 'Paket Keluarga'),
(13, 3, 'Kombo Crispy Box (1 Crispy Burger + 1 Chicken + French Fries + Minum)', 56500.00, 'Paket Kombo'),
(14, 3, 'Twisty', 21500.00, 'Burger & Snack'),
(15, 3, 'French Fries Large', 26500.00, 'Side Dish'),
(16, 3, 'Mocha Float', 15500.00, 'Minuman'),
(17, 4, 'Super Besar 1 (1 Pc Chicken + Nasi + Minum)', 41500.00, 'Paket Kombo'),
(18, 4, 'Fish Fillet Burger', 31000.00, 'Burger & Snack'),
(19, 4, 'Chicken Strips (3 Pcs)', 27000.00, 'Burger & Snack'),
(20, 4, 'Cream Soup', 14000.00, 'Side Dish'),
(21, 4, 'Mango Float', 15500.00, 'Minuman'),
(22, 5, 'Jagoan Hemat 1 (1 Pc Chicken + Nasi + Minum)', 31500.00, 'Paket Hemat'),
(23, 5, 'Super Besar 1 (1 Pc Chicken + Nasi + Minum)', 41500.00, 'Paket Kombo'),
(24, 5, 'Yakiniku Don', 21500.00, 'Rice Bowl'),
(25, 5, 'Oriental Don', 21500.00, 'Rice Bowl'),
(26, 5, 'Crispy Burger', 18000.00, 'Burger & Snack'),
(27, 6, 'PaNas 1 (1 Pc Ayam McD + Nasi + Fruit Tea Lemon)', 41000.00, 'Paket Ayam'),
(28, 6, 'PaNas Spesial (1 Pc Ayam McD + Nasi + Scrambled Egg + Fruit Tea)', 49000.00, 'Paket Ayam'),
(29, 6, 'PaNas 2 (2 Pcs Ayam McD + Nasi + Fruit Tea Lemon)', 53500.00, 'Paket Ayam'),
(30, 6, 'Big Mac Ala Carte', 44500.00, 'Burger'),
(31, 6, 'Double Cheeseburger Ala Carte', 41500.00, 'Burger'),
(32, 6, 'McNuggets 6 Pcs', 38500.00, 'Snack'),
(33, 6, 'McFlurry feat. Oreo', 18500.00, 'Dessert'),
(34, 6, 'Apple Pie', 16500.00, 'Dessert'),
(35, 7, 'Combo 1 Fire Chicken (1 Pc Fire Chicken Level 0-5 + Nasi + Pink Lava)', 45000.00, 'Fire Chicken'),
(36, 7, 'Combo 2 Fire Chicken (2 Pcs Fire Chicken Level 0-5 + Nasi + Pink Lava)', 58500.00, 'Fire Chicken'),
(37, 7, 'Combo Fire Wings (4 Pcs Fire Wings + Nasi + Pink Lava)', 43500.00, 'Fire Wings'),
(38, 7, 'Combo 1 Richicken (1 Pc Ayam Crispy + Nasi + Fruitarian)', 32500.00, 'Richicken'),
(39, 7, 'Fire Burger', 34500.00, 'Burger'),
(40, 7, 'Cheese Crackling', 16500.00, 'Side Dish'),
(41, 7, 'Pink Lava Regular', 15000.00, 'Minuman'),
(42, 8, 'Paket Aroma Chicken 2 Pcs (2 Golden/Spicy Chicken + Nasi + RB)', 55500.00, 'Paket Ayam'),
(43, 8, 'Paket Aroma Chicken 1 Pc + Soup (1 Chicken + Nasi + Soup + RB)', 48500.00, 'Paket Ayam'),
(44, 8, 'Mozza Burger', 45500.00, 'Burger'),
(45, 8, 'Deluxe Burger', 36500.00, 'Burger'),
(46, 8, 'Curly Fries', 29500.00, 'Snack'),
(47, 8, 'Waffle Ice Cream', 31500.00, 'Dessert'),
(48, 8, 'A&W RB (Root Beer) Regular', 17500.00, 'Minuman'),
(49, 9, 'Paket Panas 1 (1 Pc Ayam Crispy/Saudi + Nasi Putih + Minum)', 22000.00, 'Paket Ayam'),
(50, 9, 'Paket Panas 2 (2 Pcs Ayam Crispy/Saudi + Nasi Putih + Minum)', 34000.00, 'Paket Ayam'),
(51, 9, 'Paket Kebuli 1 (1 Pc Ayam Saudi + Nasi Kebuli + Saus Toumiya)', 28000.00, 'Paket Kebuli'),
(52, 9, 'Paket Kebuli 2 (2 Pcs Ayam Saudi + Nasi Kebuli + Saus Toumiya)', 40000.00, 'Paket Kebuli'),
(53, 9, 'Ayam Almaz Ala Carte (1 Pc Dada/Paha Atas)', 16000.00, 'Ala Carte'),
(54, 9, 'Saus Toumiya (Garlic Sauce)', 5000.00, 'Side Dish'),
(55, 10, 'Paket J-1 (1 Pc Ayam Sayap/Paha Bawah + Nasi + Es Teh)', 16000.00, 'Paket Hemat'),
(56, 10, 'Paket J-2 (1 Pc Ayam Dada/Paha Atas + Nasi + Es Teh)', 19000.00, 'Paket Hemat'),
(57, 10, 'Paket J-Geprek (Ayam Crispy Geprek + Nasi + Es Teh)', 20000.00, 'Paket Geprek'),
(58, 10, 'J-Burger Crispy', 18000.00, 'Burger & Snack'),
(59, 10, 'French Fries', 13000.00, 'Snack'),
(60, 11, 'Paket Hemat 1 (Sayap / Paha Bawah + Nasi + Es Teh)', 16000.00, 'Paket Hemat'),
(61, 11, 'Paket Hemat 2 (Dada / Paha Atas + Nasi + Es Teh)', 19000.00, 'Paket Hemat'),
(62, 11, 'Paket Ayam Geprek (Ayam Crispy Sambal Geprek + Nasi)', 18000.00, 'Ayam Geprek'),
(63, 11, 'Paket Ayam Saus Keju (Ayam Crispy + Saus Keju + Nasi)', 21000.00, 'Paket Spesial'),
(64, 11, 'Chicken Skin (Kulit Ayam Crispy)', 12000.00, 'Snack'),
(65, 12, 'Paket Hemat 2 (Dada / Paha Atas + Nasi + Es Teh)', 19000.00, 'Paket Hemat'),
(66, 12, 'Paket Double (2 Pcs Ayam Crispy + Nasi + Es Teh)', 28000.00, 'Paket Kombo'),
(67, 12, 'Paket Ayam Saus Pedas Manis + Nasi', 21000.00, 'Paket Spesial'),
(68, 12, 'Burger Ayam Crispy', 16000.00, 'Burger & Snack'),
(69, 12, 'Kentang Goreng', 12000.00, 'Snack');

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `restaurant_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` text,
  `operating_hours` varchar(100) DEFAULT '10:00 - 22:00',
  `location` point NOT NULL SRID 4326,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `restaurants`
--

INSERT INTO `restaurants` (`restaurant_id`, `name`, `address`, `operating_hours`, `location`, `created_at`) VALUES
(1, 'KFC Coffee Selindung', 'Jl. Jendral Sudirman, Selindung Baru, Kec. Gabek, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33172', '08:00 - 22:00', 0xe610000001010000002c30620326875a40fca2200217ca00c0, '2026-11-18 02:46:07'),
(2, 'KFC Pangkalpinang', 'V4F4+GRH, Rw. Bangun, Kec. Taman Sari, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33684', '09:00 - 22:00', 0xe61000000101000000b602df87da865a40f2d9b468670201c0, '2026-11-18 02:46:07'),
(3, 'KFC Pangkal Pinang Plaza', 'Jl. Kapten Sulaiman Arief No.44, Bintang, Kec. Rangkui, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33119', '10:00 - 22:00', 0xe610000001010000005c69f39374875a409eedc3ad7d0601c0, '2026-11-18 02:46:07'),
(4, 'KFC Bangka Trade Center', 'Gedung Bangka Trade Center, Lt. Dasar unit No. D - 03, Bangka, Kec. Girimaya, Kabupaten Bangka Tengah, Kepulauan Bangka Belitung 33684', '10:00 - 21:30', 0xe61000000101000000865f23166b875a405eadaf331c0a01c0, '2026-11-18 02:46:07'),
(5, 'KFC BOX TJ Mart', 'Jl. Solihin GP No.27, Asam, Kec. Rangkui, Kabupaten Bangka Tengah, Kepulauan Bangka Belitung 33684', '10:00 - 22:00', 0xe6100000010100000035e3d18264865a40b87fb74a382401c0, '2026-11-18 02:46:07'),
(6, 'McDonald\'s Pangkalpinang', 'Jl. Kp. Bintang, Bintang, Kec. Rangkui, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33684', '24 Jam', 0xe61000000101000000cd9a71c5fc865a40a5dadc4ee41001c0, '2026-11-18 02:46:07'),
(7, 'Richeese Factory Pangkal Pinang', 'Jl. Jendral Sudirman No.001A, Gabek Satu, Kec. Gabek, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33172', '10:00 - 22:00', 0xe610000001010000002dddd0d52d875a4043b379c132dd00c0, '2026-11-18 02:46:07'),
(8, 'A&W Transmall Pangkalpinang', 'Jl. Jendral Sudirman No.8, Taman Bunga, Kec. Taman Sari, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33684', '10:00 - 22:00', 0xe61000000101000000bc069cc522875a40b61529e97ceb00c0, '2026-11-18 02:46:07'),
(9, 'ALMAZ Fried Chicken Pangkalpinang', 'V4M6+42H, Jl. A. Yani, Batin Tikal, Kec. Taman Sari, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33684', '10:00 - 22:00', 0xe6100000010100000071f835f10c875a407e25862cf4ef00c0, '2026-11-18 02:46:07'),
(10, 'JChicken Pangkalpinang', 'Jl. A. Yani No.96 A ,B,C,D, RW.01, Rw. Bangun, Kec. Taman Sari, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33684', '09:00 - 22:00', 0xe610000001010000007da483f0e3865a40abd87f6a5b0701c0, '2026-11-18 02:46:07'),
(11, 'Karen Chicken Solihin GP Pangkalpinang', 'Jl. Sungai Selan No.A No.48, Asam, Kec. Rangkui, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33684', '09:30 - 22:00', 0xe61000000101000000608693ab4e865a40df637b8ec02601c0, '2026-11-18 02:46:07'),
(12, 'KAREN CHICKEN BALAI', 'Jl. Balai No.31, Rw. Bangun, Kec. Taman Sari, Kota Pangkal Pinang, Kepulauan Bangka Belitung 33684', '09:30 - 22:00', 0xe6100000010100000079ca90c508875a408981c88e660001c0, '2026-11-18 02:46:07');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int NOT NULL,
  `restaurant_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `restaurant_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 2, 5, 'Tempatnya nyaman buat nugas pagi-pagi karena ada KFC Coffee-nya, parkir juga luas.', '2026-11-18 02:46:07'),
(2, 1, 3, 4, 'Pelayanan cepat dan ayam crispy-nya selalu hangat.', '2026-11-18 02:46:07'),
(3, 2, 4, 5, 'Lokasi sangat strategis di pusat kota dekat Alun-Alun Taman Merdeka.', '2026-11-18 02:46:07'),
(4, 2, 5, 4, 'Ramai kalau malam minggu, tapi antrean kasir cukup tertib.', '2026-11-18 02:46:07'),
(5, 3, 2, 4, 'Enak mampir ke sini setelah belanja di Pangkal Pinang Plaza.', '2026-11-18 02:46:07'),
(6, 3, 4, 5, 'Potongan ayamnya besar-besar dan tempat duduknya bersih.', '2026-11-18 02:46:07'),
(7, 4, 3, 4, 'Praktis banget kalau lagi di BTC, tinggal turun ke lantai dasar.', '2026-11-18 02:46:07'),
(8, 4, 5, 4, 'Rasa standar KFC pada umumnya, pelayanan ramah.', '2026-11-18 02:46:07'),
(9, 5, 2, 4, 'Cocok buat beli bungkus bawa pulang habis belanja di TJ Mart.', '2026-11-18 02:46:07'),
(10, 5, 3, 5, 'Cepat penyajiannya dan tidak perlu antre panjang.', '2026-11-18 02:46:07'),
(11, 6, 4, 5, 'Satu-satunya fast food 24 jam di Pangkalpinang, penyelamat kalau lapar tengah malam!', '2026-11-18 02:46:07'),
(12, 6, 5, 5, 'Drive-thru sangat membantu dan McFlurry Oreo-nya selalu mantap.', '2026-11-18 02:46:07'),
(13, 7, 2, 5, 'Fire Chicken level 3 ditambah saus keju dan Pink Lava juara banget pedasnya.', '2026-11-18 02:46:07'),
(14, 7, 3, 5, 'Restorannya luas, bersih, dan AC-nya dingin.', '2026-11-18 02:46:07'),
(15, 8, 4, 5, 'Aroma Chicken dan Root Beer Float di Transmall selalu jadi favorit keluarga.', '2026-11-18 02:46:07'),
(16, 8, 5, 4, 'Curly fries-nya renyah, pelayanan cukup sigap.', '2026-11-18 02:46:07'),
(17, 9, 2, 5, 'Nasi Kebuli dan Ayam Saudi dengan saus Toumiya-nya mantap, harga ramah di kantong mahasiswa.', '2026-11-18 02:46:07'),
(18, 9, 4, 5, 'Bumbunya meresap sampai ke dalam daging, porsinya mengenyangkan.', '2026-11-18 02:46:07'),
(19, 10, 3, 4, 'Porsi nasinya pas dan ayam crispy-nya renyah tahan lama.', '2026-11-18 02:46:07'),
(20, 10, 5, 4, 'Lokasi mudah ditemukan di pinggir Jl. A. Yani.', '2026-11-18 02:46:07'),
(21, 11, 2, 5, 'Paket hematnya sangat terjangkau buat makan siang anak kos di daerah Solihin GP.', '2026-11-18 02:46:07'),
(22, 11, 3, 4, 'Kulit ayam crispy-nya enak buat camilan.', '2026-11-18 02:46:07'),
(23, 12, 4, 5, 'Dekat pusat kota Jl. Balai, ayam saus kejunya porsi mengenyangkan.', '2026-11-18 02:46:07'),
(24, 12, 5, 4, 'Pelayanan cepat, cocok buat makan siang praktis.', '2026-11-18 02:46:07');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Haadii Dwi Noviandi', 'admin@carisaji.id', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', '2026-11-18 02:46:07'),
(2, 'Rizky Pratama', 'rizky.pkp@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'user', '2026-11-18 02:46:07'),
(3, 'Nadia Safitri', 'nadia.safitri@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'user', '2026-11-18 02:46:07'),
(4, 'Dimas Saputra', 'dimas.bangka@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'user', '2026-11-18 02:46:07'),
(5, 'Aulia Putri', 'aulia.putri@gmail.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'user', '2026-11-18 02:46:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`menu_id`),
  ADD KEY `restaurant_id` (`restaurant_id`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`restaurant_id`),
  ADD SPATIAL KEY `location` (`location`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `restaurant_id` (`restaurant_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `menus`
--
ALTER TABLE `menus`
  MODIFY `menu_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `restaurant_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `menus`
--
ALTER TABLE `menus`
  ADD CONSTRAINT `menus_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
