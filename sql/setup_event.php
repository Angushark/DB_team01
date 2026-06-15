<?php
// 一次性執行腳本：在 MySQL 建立每日自動同步 item 狀態的 EVENT
// 執行方式：http://localhost/DB_team01/sql/setup_event.php
// 注意：SET GLOBAL event_scheduler = ON 需要 SUPER / SYSTEM_VARIABLES_ADMIN 權限
//       若 DB 伺服器已啟用 event_scheduler，此行可忽略失敗

header('Content-Type: text/plain; charset=utf-8');
require_once '../db_config.php';

$steps = [];

// 1. 嘗試啟用 event scheduler（需 SUPER 權限，失敗不影響後續）
$ok = @$conn->query("SET GLOBAL event_scheduler = ON");
$steps[] = ['SET GLOBAL event_scheduler = ON', $ok, $conn->error];
if (!$ok) $conn->errno; // clear error

// 2. 查詢目前 event_scheduler 狀態
$r = $conn->query("SHOW VARIABLES LIKE 'event_scheduler'");
$val = $r ? $r->fetch_assoc()['Value'] : '?';
$steps[] = ["event_scheduler 目前狀態 = $val", true, ''];

// 3. 建立 MySQL EVENT（重建以確保包含最新邏輯）
$conn->query("DROP EVENT IF EXISTS `evt_sync_item_states`");
$sql = "CREATE EVENT `evt_sync_item_states`
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO BEGIN
  UPDATE `Order` SET order_state='completed'
    WHERE order_state='confirmed' AND return_date < CURDATE();
  UPDATE Item SET rent_state = CASE
    WHEN EXISTS (
      SELECT 1 FROM `Contains` c
      JOIN `Order` o ON c.order_id = o.order_id
      WHERE c.item_id = Item.item_id
        AND o.order_state IN ('unpaid','confirmed')
        AND o.rent_date  <= CURDATE()
        AND o.return_date >  CURDATE()
    ) THEN 'rented'
    ELSE 'available'
  END
  WHERE rent_state IN ('available','rented');
END";

$ok = $conn->query($sql);
$steps[] = ['CREATE EVENT evt_sync_item_states', $ok, $conn->error];

// 4. 驗證 event 是否存在
$r2 = $conn->query("SHOW EVENTS WHERE Name = 'evt_sync_item_states'");
$exists = $r2 && $r2->num_rows > 0;
$steps[] = ['驗證 EVENT 存在', $exists, $exists ? '' : 'EVENT 未找到（可能需要 EVENT 權限或 event_scheduler 未啟用）'];

// 5. 立即執行一次 auto-complete + 同步
$ok5a = $conn->query("UPDATE `Order` SET order_state='completed' WHERE order_state='confirmed' AND return_date < CURDATE()");
$completed_rows = $conn->affected_rows;
$steps[] = ["立即自動完成訂單（confirmed+過期）→ completed（影響 {$completed_rows} 筆）", $ok5a, $conn->error];

$ok5 = $conn->query(
    "UPDATE Item SET rent_state = CASE
       WHEN EXISTS (
         SELECT 1 FROM `Contains` c
         JOIN `Order` o ON c.order_id = o.order_id
         WHERE c.item_id = Item.item_id
           AND o.order_state IN ('unpaid','confirmed')
           AND o.rent_date  <= CURDATE()
           AND o.return_date >  CURDATE()
       ) THEN 'rented'
       ELSE 'available'
     END
     WHERE rent_state IN ('available','rented')"
);
$steps[] = ["立即同步 item 狀態（影響 {$conn->affected_rows} 筆）", $ok5, $conn->error];

// 輸出結果
echo "=== MySQL EVENT 設定結果 ===\n\n";
foreach ($steps as [$label, $ok, $err]) {
    echo ($ok ? '✓' : '✗') . "  $label";
    if (!$ok && $err) echo "\n    錯誤：$err";
    echo "\n";
}
echo "\n完成。\n";
