<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../db_config.php';

$ids_raw = $_GET['item_ids'] ?? '';
if (!$ids_raw) { echo json_encode(['success'=>true,'blocked':[]]); exit; }

// Validate: only allow alphanumeric and commas
$ids = array_values(array_filter(
    array_map('trim', explode(',', $ids_raw)),
    fn($v) => preg_match('/^[a-zA-Z0-9_-]+$/', $v)
));

if (empty($ids)) { echo json_encode(['success'=>true,'blocked':[]]); exit; }

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$types = str_repeat('s', count($ids));

$stmt = $conn->prepare(
    "SELECT DISTINCT o.rent_date, o.return_date
     FROM `Order` o
     JOIN Contains c ON o.order_id = c.order_id
     WHERE c.item_id IN ($placeholders)
       AND o.order_state != 'cancelled'
     ORDER BY o.rent_date"
);
$stmt->bind_param($types, ...$ids);
$stmt->execute();
$result = $stmt->get_result();

$blocked = [];
while ($row = $result->fetch_assoc()) {
    $blocked[] = ['from' => $row['rent_date'], 'to' => $row['return_date']];
}

echo json_encode(['success'=>true,'blocked'=>$blocked], JSON_UNESCAPED_UNICODE);
