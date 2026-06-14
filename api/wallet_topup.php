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
$mid = $_SESSION['member_id'];

$data   = json_decode(file_get_contents('php://input'), true);
$amount = floatval($data['amount'] ?? 0);

if ($amount <= 0) {
    echo json_encode(['success' => false, 'message' => '儲值金額必須大於 0']); exit;
}
if ($amount > 50000) {
    echo json_encode(['success' => false, 'message' => '單次儲值上限為 NT$ 50,000']); exit;
}

// 更新餘額
$stmt = $conn->prepare("UPDATE Member SET balance = balance + ? WHERE member_id = ?");
$stmt->bind_param("di", $amount, $mid);
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => '儲值失敗：' . $stmt->error]); exit;
}
$stmt->close();

// 寫入交易紀錄
$note = "錢包儲值";
$stmt = $conn->prepare(
    "INSERT INTO WalletTransaction (member_id, amount, type, order_id, note) VALUES (?, ?, 'topup', NULL, ?)"
);
$stmt->bind_param("ids", $mid, $amount, $note);
$stmt->execute();
$stmt->close();

// 回傳新餘額
$r = $conn->query("SELECT balance FROM Member WHERE member_id=$mid");
$balance = (float)$r->fetch_assoc()['balance'];

echo json_encode([
    'success' => true,
    'message' => '儲值成功',
    'balance' => $balance,
], JSON_UNESCAPED_UNICODE);
?>
