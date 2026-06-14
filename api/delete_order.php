<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$data = json_decode(file_get_contents('php://input'), true);
$oid  = $conn->real_escape_string($data['order_id'] ?? '');
$mid  = $conn->real_escape_string($_SESSION['member_id']);

if (!$oid) { echo json_encode(['success' => false, 'message' => '缺少訂單編號']); exit; }

$conn->query("DELETE FROM `Contains` WHERE order_id='$oid'");
$conn->query("DELETE FROM `Order` WHERE order_id='$oid' AND renter_id='$mid'");
echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
