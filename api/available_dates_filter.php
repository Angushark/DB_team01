<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');

function send_json($data) { ob_clean(); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

require_once '../db_config.php';

$from = $_GET['from'] ?? '';
$to   = $_GET['to']   ?? '';

if (!$from || !$to
    || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)
    || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
    send_json(['success' => false, 'message' => '缺少或格式錯誤的日期參數']);
}

$from = $conn->real_escape_string($from);
$to   = $conn->real_escape_string($to);

// 找出在指定日期範圍內有衝突訂單的 item_id（只考慮 available/rented 的品項）
$sql = "
    SELECT DISTINCT c.item_id
    FROM Contains c
    JOIN `Order` o ON c.order_id = o.order_id
    JOIN Item i ON c.item_id = i.item_id
    WHERE i.rent_state IN ('available', 'rented')
      AND o.order_state IN ('unpaid', 'confirmed')
      AND o.rent_date  < '$to'
      AND o.return_date > '$from'
";

$result = $conn->query($sql);
if ($result === false) {
    send_json(['success' => false, 'message' => 'DB 查詢失敗：' . $conn->error]);
}

$unavailable = [];
while ($row = $result->fetch_assoc()) {
    $unavailable[] = $row['item_id'];
}

send_json(['success' => true, 'unavailable_item_ids' => $unavailable]);
