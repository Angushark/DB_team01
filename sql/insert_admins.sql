USE `team01`;

-- ========================================================
-- 新增 3 位具有 Provider + Administrator 權限的測試帳號
-- ========================================================

-- 插入 Member 基本資料
INSERT INTO `Member` (`member_id`, `username`, `email`, `reg_date`, `password`, `phone_number`) VALUES
(7, 'sarah_admin',  'sarah@mail.com',  '2026-04-01', 'Admin@123', '0911111111'),
(8, 'mike_admin',   'mike@mail.com',   '2026-04-05', 'Admin@123', '0922222222'),
(9, 'lisa_admin',   'lisa@mail.com',    '2026-04-10', 'Admin@123', '0933333333');

-- 所有人也是 Renter
INSERT INTO `Renter` (`member_id`) VALUES (7), (8), (9);

-- 設定為 Provider
INSERT INTO `Provider` (`member_id`, `bank_account`) VALUES
(7, '004-555666777888'),   -- sarah
(8, '012-999888777666'),   -- mike
(9, '808-123123123123');   -- lisa

-- 設定為 Administrator
INSERT INTO `Administrator` (`member_id`) VALUES (7), (8), (9);
