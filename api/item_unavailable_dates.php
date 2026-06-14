<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');

function send_json($data) { ob_clean(); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

require_once '../db_config.php';

$ids_raw = $_GET['item_ids'] ?? '';
if (!$ids_raw) { send_json(['success' => true, 'blocked' => []]); }

// 只允許英數字、底線、連字號
$ids = array_values(array_filter(
    array_map('trim', explode(',', $ids_raw)),
    fn($v) => preg_match('/^[a-zA-Z0-9_-]+$/', $v)
));

if (empty($ids)) { send_json(['success' => true, 'blocked' => []]); }

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$types        = str_repeat('s', count($ids));

// 找出這些 item 已有的 unpaid/confirmed 訂單日期範圍（只考慮 available/rented 的品項）
$stmt = $conn->prepare(
    "SELECT DISTINCT o.rent_date, o.return_date
     FROM `Order` o
     JOIN Contains c ON o.order_id = c.order_id
     JOIN Item i ON c.item_id = i.item_id
     WHERE c.item_id IN ($placeholders)
       AND i.rent_state IN ('available', 'rented')
       AND o.order_state IN ('unpaid', 'confirmed')
     ORDER BY o.rent_date"
);

if (!$stmt) { send_json(['success' => false, 'message' => 'DB prepare 失敗：' . $conn->error]); }

$stmt->bind_param($types, ...$ids);
$stmt->execute();
$result = $stmt->get_result();

$blocked = [];
while ($row = $result->fetch_assoc()) {
    $blocked[] = ['from' => $row['rent_date'], 'to' => $row['return_date']];
}

send_json(['success' => true, 'blocked' => $blocked]);
