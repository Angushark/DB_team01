-- 0. 清空所有訂單（WHERE 1=1 繞過 safe update mode，先刪子表再刪主表）
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;
SET autocommit = 1;
DELETE FROM `Contains` WHERE 1=1;
DELETE FROM `Order` WHERE 1=1;
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- 1. 新增 create_date 欄位（MySQL 5.7 不支援 IF NOT EXISTS，直接 ADD COLUMN）
ALTER TABLE `Order`
  ADD COLUMN `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. 開啟 MySQL Event Scheduler
SET GLOBAL event_scheduler = ON;

-- 3. 建立定時事件：每分鐘掃描，超過20分鐘未付款的訂單自動設為 cancelled
DROP EVENT IF EXISTS `cancel_unpaid_orders`;
CREATE EVENT `cancel_unpaid_orders`
  ON SCHEDULE EVERY 1 MINUTE
  DO
    UPDATE `Order`
    SET `order_state` = 'cancelled'
    WHERE `order_state` = 'unpaid'
      AND TIMESTAMPDIFF(MINUTE, `create_date`, NOW()) >= 20;
