<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$mid = $conn->real_escape_string($_SESSION['member_id']);

// 查詢前自動取消超過20分鐘未付款的訂單
$conn->query("UPDATE `Order` SET order_state='cancelled' WHERE order_state='unpaid' AND TIMESTAMPDIFF(MINUTE, create_date, NOW()) >= 20");

$result = $conn->query("SELECT order_id, rent_date, return_date, total_rental, order_state, create_date FROM `Order` WHERE renter_id='$mid' ORDER BY CAST(order_id AS UNSIGNED) DESC");
$orders = [];
if ($result) while ($row = $result->fetch_assoc()) $orders[] = $row;
echo json_encode(['success' => true, 'orders' => $orders], JSON_UNESCAPED_UNICODE);
