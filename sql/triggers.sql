-- ============================================================
-- 執行方式：phpMyAdmin → 選擇 team01 資料庫 → SQL 頁籤
-- 每個 CREATE TRIGGER 要分開貼上執行（各自貼一次）
-- ============================================================

-- 1. 新會員自動成為 Renter
DROP TRIGGER IF EXISTS trg_auto_renter;
CREATE TRIGGER trg_auto_renter
AFTER INSERT ON Member
FOR EACH ROW
INSERT IGNORE INTO Renter (member_id) VALUES (NEW.member_id);


-- 2. Provider 上架品項後狀態設為 unavailable
DROP TRIGGER IF EXISTS trg_item_unavailable_on_provide;
CREATE TRIGGER trg_item_unavailable_on_provide
AFTER INSERT ON Provide
FOR EACH ROW
UPDATE Item SET rent_state = 'unavailable' WHERE item_id = NEW.item_id;


-- 3. 訂單確認（confirmed）→ 品項自動設為 rented
DROP TRIGGER IF EXISTS trg_order_confirmed_set_rented;
CREATE TRIGGER trg_order_confirmed_set_rented
AFTER UPDATE ON `Order`
FOR EACH ROW
BEGIN
  IF NEW.order_state = 'confirmed' AND OLD.order_state != 'confirmed' THEN
    UPDATE Item i
    JOIN Contains c ON c.item_id = i.item_id
    SET i.rent_state = 'rented'
    WHERE c.order_id = NEW.order_id;
  END IF;
END;


-- 4. 訂單完成（completed）→ 品項自動設回 available
DROP TRIGGER IF EXISTS trg_order_completed_set_available;
CREATE TRIGGER trg_order_completed_set_available
AFTER UPDATE ON `Order`
FOR EACH ROW
BEGIN
  IF NEW.order_state = 'completed' AND OLD.order_state != 'completed' THEN
    UPDATE Item i
    JOIN Contains c ON c.item_id = i.item_id
    SET i.rent_state = 'available'
    WHERE c.order_id = NEW.order_id;
  END IF;
END;


-- 5. 訂單取消（cancelled，從 confirmed）→ 品項設回 available
DROP TRIGGER IF EXISTS trg_order_cancelled_set_available;
CREATE TRIGGER trg_order_cancelled_set_available
AFTER UPDATE ON `Order`
FOR EACH ROW
BEGIN
  IF NEW.order_state = 'cancelled' AND OLD.order_state = 'confirmed' THEN
    UPDATE Item i
    JOIN Contains c ON c.item_id = i.item_id
    SET i.rent_state = 'available'
    WHERE c.order_id = NEW.order_id;
  END IF;
END;
