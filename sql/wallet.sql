USE `team01`;

-- ============================================================
-- 1. 在 Member 表加入 balance 欄位
-- ============================================================
ALTER TABLE Member
  ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- ============================================================
-- 2. 建立 WalletTransaction 交易紀錄表
-- ============================================================
CREATE TABLE IF NOT EXISTS WalletTransaction (
    txn_id      INT             PRIMARY KEY AUTO_INCREMENT,
    member_id   INT             NOT NULL,
    amount      DECIMAL(10,2)  NOT NULL,      -- 正數=收入, 負數=支出
    type        ENUM('topup','payment','refund','payout') NOT NULL,
    order_id    INT             DEFAULT NULL,  -- 無對應訂單時為 NULL
    note        VARCHAR(255),
    created_at  DATETIME        DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES Member(member_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id)  REFERENCES `Order`(order_id) ON DELETE SET NULL
);

-- ============================================================
-- 3. TRIGGER：訂單確認（confirmed）→ 從 Renter 錢包扣款
--    並寫入交易紀錄
-- ============================================================
DROP TRIGGER IF EXISTS `trg_wallet_payment`;
DELIMITER $$
CREATE TRIGGER `trg_wallet_payment`
AFTER UPDATE ON `Order`
FOR EACH ROW
BEGIN
    IF NEW.order_state = 'confirmed' AND OLD.order_state != 'confirmed' THEN
        -- 扣款 Renter
        UPDATE Member
           SET balance = balance - NEW.total_rental
         WHERE member_id = NEW.renter_id;

        -- 扣款紀錄
        INSERT INTO WalletTransaction
            (member_id, amount, type, order_id, note)
        VALUES
            (NEW.renter_id, -NEW.total_rental, 'payment', NEW.order_id,
             CONCAT('訂單 #', NEW.order_id, ' 租借付款'));
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- 4. TRIGGER：訂單完成（completed）→ 撥款給 Provider
-- ============================================================
DROP TRIGGER IF EXISTS `trg_wallet_payout_provider`;
DELIMITER $$
CREATE TRIGGER `trg_wallet_payout_provider`
AFTER UPDATE ON `Order`
FOR EACH ROW
BEGIN
    DECLARE v_provider_id INT;

    IF NEW.order_state = 'completed' AND OLD.order_state != 'completed' THEN
        -- 找出訂單品項的 Provider（取第一位，多 Provider 情況可擴充）
        SELECT p.member_id INTO v_provider_id
          FROM Contains c
          JOIN Provide p ON p.item_id = c.item_id
         WHERE c.order_id = NEW.order_id
         LIMIT 1;

        IF v_provider_id IS NOT NULL THEN
            -- 撥款給 Provider
            UPDATE Member
               SET balance = balance + NEW.total_rental
             WHERE member_id = v_provider_id;

            -- 撥款紀錄
            INSERT INTO WalletTransaction
                (member_id, amount, type, order_id, note)
            VALUES
                (v_provider_id, NEW.total_rental, 'payout', NEW.order_id,
                 CONCAT('訂單 #', NEW.order_id, ' 租借收款'));
        END IF;
    END IF;
END$$
DELIMITER ;

-- ============================================================
-- 5. TRIGGER：訂單取消（cancelled，從 confirmed 狀態）→ 退款給 Renter
-- ============================================================
DROP TRIGGER IF EXISTS `trg_wallet_refund`;
DELIMITER $$
CREATE TRIGGER `trg_wallet_refund`
AFTER UPDATE ON `Order`
FOR EACH ROW
BEGIN
    IF NEW.order_state = 'cancelled' AND OLD.order_state = 'confirmed' THEN
        -- 退款給 Renter
        UPDATE Member
           SET balance = balance + NEW.total_rental
         WHERE member_id = NEW.renter_id;

        -- 退款紀錄
        INSERT INTO WalletTransaction
            (member_id, amount, type, order_id, note)
        VALUES
            (NEW.renter_id, NEW.total_rental, 'refund', NEW.order_id,
             CONCAT('訂單 #', NEW.order_id, ' 取消退款'));
    END IF;
END$$
DELIMITER ;
