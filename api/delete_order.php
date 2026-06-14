<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
function send_json($d) { ob_clean(); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

if (empty($_SESSION['member_id'])) send_json(['success' => false, 'message' => '請先登入']);

require_once '../db_config.php';
require_once 'sync_states.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $oid  = $conn->real_escape_string($data['order_id'] ?? '');
    $mid  = $conn->real_escape_string($_SESSION['member_id']);

    if (!$oid) send_json(['success' => false, 'message' => '缺少訂單編號']);

    $conn->query("DELETE FROM `Contains` WHERE order_id='$oid'");
    $conn->query("DELETE FROM `Order` WHERE order_id='$oid' AND renter_id='$mid'");
    sync_item_states($conn);
    send_json(['success' => true]);
} catch (Throwable $e) {
    send_json(['success' => false, 'message' => '伺服器錯誤：' . $e->getMessage()]);
}
