<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../db_config.php';

$item_id = $_GET['item_id'] ?? '';
if (!$item_id) { echo json_encode(['success' => false, 'message' => '缺少 item_id']); exit; }

// 取得目標商品的 brand 和 type
$stmt = $conn->prepare("SELECT brand, type FROM `Item` WHERE item_id = ?");
$stmt->bind_param("s", $item_id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row) { echo json_encode(['success' => false, 'message' => '找不到器材']); exit; }

$brand = $row['brand'];
$type  = $row['type'];

// 找同品牌、不同 type 的商品（最多8筆）
$opposite = ($type === 'Equipment') ? 'Accessory' : 'Equipment';
$stmt2 = $conn->prepare(
    "SELECT item_id, name, brand, model, type, rent_state, rental, url
     FROM `Item`
     WHERE brand = ? AND type = ? AND item_id != ?
     ORDER BY item_id
     LIMIT 8"
);
$stmt2->bind_param("sss", $brand, $opposite, $item_id);
$stmt2->execute();
$result = $stmt2->get_result();
$related = [];
while ($r = $result->fetch_assoc()) $related[] = $r;

echo json_encode(['success' => true, 'related' => $related, 'opposite_type' => $opposite], JSON_UNESCAPED_UNICODE);
