<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$data = json_decode(file_get_contents('php://input'), true);
$oid  = $conn->real_escape_string($data['order_id'] ?? '');
$iid  = $conn->real_escape_string($data['item_id']  ?? '');
$mid  = $conn->real_escape_string($_SESSION['member_id']);

if (!$oid || !$iid) { echo json_encode(['success' => false, 'message' => '缺少欄位']); exit; }

$chk = $conn->query("SELECT order_id FROM `Order` WHERE order_id='$oid' AND renter_id='$mid'");
if (!$chk || $chk->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => '訂單不存在']); exit;
}

if (!$conn->query("INSERT INTO `Contains` (order_id, item_id) VALUES ('$oid','$iid')")) {
    echo json_encode(['success' => false, 'message' => '新增失敗：' . $conn->error]); exit;
}
$conn->query("UPDATE `Order` SET total_rental=(SELECT COALESCE(SUM(i.rental),0) FROM `Contains` c JOIN `Item` i ON c.item_id=i.item_id WHERE c.order_id='$oid') * GREATEST(1,DATEDIFF(return_date,rent_date)) WHERE order_id='$oid'");
echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
