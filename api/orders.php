<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$mid    = $conn->real_escape_string($_SESSION['member_id']);
$result = $conn->query("SELECT order_id, rent_date, return_date, total_rental, order_state FROM `Order` WHERE renter_id='$mid' ORDER BY CAST(order_id AS UNSIGNED) DESC");
$orders = [];
if ($result) while ($row = $result->fetch_assoc()) $orders[] = $row;
echo json_encode(['success' => true, 'orders' => $orders], JSON_UNESCAPED_UNICODE);
