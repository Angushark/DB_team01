<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '僅接受 POST']); exit;
}

require_once '../db_config.php';
$mid  = $_SESSION['member_id'];
$data = json_decode(file_get_contents('php://input'), true);
$oid  = intval($data['order_id'] ?? 0);

if (!$oid) {
    echo json_encode(['success' => false, 'message' => '缺少訂單編號']); exit;
}

// 確認訂單屬於此 Renter 且狀態為 unpaid
$stmt = $conn->prepare("SELECT order_id, renter_id, total_rental, order_state FROM `Order` WHERE order_id = ?");
$stmt->bind_param("i", $oid);
$stmt->execute();
$order = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$order) {
    echo json_encode(['success' => false, 'message' => '訂單不存在']); exit;
}
if ((int)$order['renter_id'] !== (int)$mid) {
    echo json_encode(['success' => false, 'message' => '此訂單不屬於您']); exit;
}
if ($order['order_state'] !== 'unpaid') {
    echo json_encode(['success' => false, 'message' => '此訂單狀態無法付款（目前：' . $order['order_state'] . '）']); exit;
}

$amount = floatval($order['total_rental']);

// 確認餘額足夠
$stmt = $conn->prepare("SELECT balance FROM Member WHERE member_id = ?");
$stmt->bind_param("i", $mid);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();
$balance = floatval($row['balance'] ?? 0);

if ($balance < $amount) {
    echo json_encode([
        'success'  => false,
        'message'  => '錢包餘額不足',
        'balance'  => $balance,
        'required' => $amount,
    ]); exit;
}

// 將訂單改為 confirmed
// TRIGGER trg_wallet_payment 會自動扣款並寫交易紀錄
$stmt = $conn->prepare("UPDATE `Order` SET order_state = 'confirmed' WHERE order_id = ?");
$stmt->bind_param("i", $oid);
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => '付款失敗：' . $stmt->error]); exit;
}
$stmt->close();

// 取得付款後的最新餘額
$stmt = $conn->prepare("SELECT balance FROM Member WHERE member_id = ?");
$stmt->bind_param("i", $mid);
$stmt->execute();
$newBalance = floatval($stmt->get_result()->fetch_assoc()['balance']);
$stmt->close();

echo json_encode([
    'success' => true,
    'message' => '付款成功，訂單已確認',
    'balance' => $newBalance,
], JSON_UNESCAPED_UNICODE);
?>
