<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';

// 自動取消超過20分鐘未付款的訂單
$conn->query("UPDATE `Order` SET order_state='cancelled' WHERE order_state='unpaid' AND TIMESTAMPDIFF(MINUTE, create_date, NOW()) >= 20");

$oid = $conn->real_escape_string($_GET['order_id'] ?? '');
$mid = $conn->real_escape_string($_SESSION['member_id']);

if (!$oid) { echo json_encode(['success' => false, 'message' => '缺少訂單編號']); exit; }

$res = $conn->query("SELECT o.*, m.username AS renter_name FROM `Order` o JOIN `Member` m ON o.renter_id=m.member_id WHERE o.order_id='$oid' AND o.renter_id='$mid'");
if (!$res || $res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => '訂單不存在']); exit;
}
$order = $res->fetch_assoc();

$ir = $conn->query("SELECT c.item_id, i.name, i.brand, i.type, i.rental FROM `Contains` c JOIN `Item` i ON c.item_id=i.item_id WHERE c.order_id='$oid' ORDER BY c.item_id");
$items = [];
if ($ir) while ($row = $ir->fetch_assoc()) $items[] = $row;
$order['items'] = $items;

echo json_encode(['success' => true, 'order' => $order], JSON_UNESCAPED_UNICODE);
