<?php
// sync_states.php — shared helper, require_once this file then call sync_item_states($conn)
// Updates all Item.rent_state (except 'unavailable') based on active orders covering today.

if (!function_exists('sync_item_states')) {
    function sync_item_states($conn) {
        // 自動完成：confirmed 訂單已過歸還日期 → completed
        $conn->query(
            "UPDATE `Order` SET order_state='completed'
             WHERE order_state='confirmed' AND return_date < CURDATE()"
        );
        // 同步 item 狀態（completed 訂單不再佔用 item）
        $conn->query(
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
    }
}
