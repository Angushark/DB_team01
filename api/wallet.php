<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$mid = $_SESSION['member_id'];

// 取得餘額
$stmt = $conn->prepare("SELECT balance FROM Member WHERE member_id = ?");
$stmt->bind_param("i", $mid);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();
$balance = $row ? (float)$row['balance'] : 0;

// 取得交易紀錄（最新 50 筆）
$stmt = $conn->prepare("
    SELECT txn_id, amount, type, order_id, note, created_at
    FROM WalletTransaction
    WHERE member_id = ?
    ORDER BY created_at DESC
    LIMIT 50
");
$stmt->bind_param("i", $mid);
$stmt->execute();
$result = $stmt->get_result();
$transactions = [];
while ($r = $result->fetch_assoc()) $transactions[] = $r;
$stmt->close();

echo json_encode([
    'success'      => true,
    'balance'      => $balance,
    'transactions' => $transactions,
], JSON_UNESCAPED_UNICODE);
?>
