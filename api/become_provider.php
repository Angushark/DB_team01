<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$mid = $_SESSION['member_id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '僅接受 POST']); exit;
}

$data         = json_decode(file_get_contents('php://input'), true);
$bank_account = trim($data['bank_account'] ?? '');

if (!$bank_account) {
    echo json_encode(['success' => false, 'message' => '請填寫銀行帳號']); exit;
}

// 已經是 Provider？
$r = $conn->query("SELECT 1 FROM Provider WHERE member_id=$mid");
if ($r && $r->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => '您已經是出租方身份']); exit;
}

$ba = $conn->real_escape_string($bank_account);
if ($conn->query("INSERT INTO Provider (member_id, bank_account) VALUES ($mid, '$ba')")) {
    echo json_encode(['success' => true, 'message' => '已成功申請成為出租方']);
} else {
    echo json_encode(['success' => false, 'message' => '申請失敗：' . $conn->error]);
}
?>
