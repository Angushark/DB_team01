USE `team01`;

-- ============================================================
-- 1. 訂單刪除紀錄表
-- ============================================================
CREATE TABLE IF NOT EXISTS OrderDeleteLog (
    log_id          INT           PRIMARY KEY AUTO_INCREMENT,
    order_id        VARCHAR(20)   NOT NULL,
    renter_id       INT           NOT NULL,
    deleted_by      INT           NOT NULL,   -- 執行刪除的 member_id
    deleted_at      DATETIME      DEFAULT NOW(),
    order_state     VARCHAR(20),              -- 刪除當時的訂單狀態
    total_rental    INT,                      -- 刪除當時的金額（整數）
    item_snapshot   TEXT,                     -- 品項名稱快照（JSON）
    rent_date       DATE,
    return_date     DATE
);

-- ============================================================
-- 2. 餘額改為整數（ROUND 所有現有小數）
-- ============================================================
UPDATE Member SET balance = ROUND(balance);
ALTER TABLE Member MODIFY COLUMN balance INT NOT NULL DEFAULT 0;

-- WalletTransaction 的 amount 也改整數
ALTER TABLE WalletTransaction MODIFY COLUMN amount INT NOT NULL;

-- ============================================================
-- 3. 密碼欄位長度改為 255（支援 bcrypt hash）
--    bcrypt hash 固定 60 字元，VARCHAR(255) 已足夠
--    現有密碼保持不動，login.php 會自動識別並遷移
-- ============================================================
ALTER TABLE Member MODIFY COLUMN password VARCHAR(255) NOT NULL;

-- ============================================================
-- 4. 現有測試帳號密碼的 bcrypt hash 對照
--    （請用以下 PHP 產生後手動 UPDATE，或讓使用者下次登入時自動遷移）
--    password_hash('Admin@123', PASSWORD_BCRYPT)
--    password_hash('password123', PASSWORD_BCRYPT)
--    ↑ 由 migrate_passwords.php 自動完成，無需手動執行
-- ============================================================
