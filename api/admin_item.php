<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$mid = $_SESSION['member_id'];

// ── 確認是 Admin ───────────────────────────────────────────
$r = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$mid");
if (!$r || $r->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => '僅限管理員操作']); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '僅接受 POST']); exit;
}

$data      = json_decode(file_get_contents('php://input'), true);
$item_id   = $conn->real_escape_string(trim($data['item_id']    ?? ''));
$new_state = $conn->real_escape_string(trim($data['rent_state'] ?? ''));

$valid_states = ['available', 'rented', 'unavailable'];
if (!$item_id || !in_array($new_state, $valid_states)) {
    echo json_encode(['success' => false, 'message' => '缺少 item_id 或狀態無效']); exit;
}

// rented → available 或 unavailable → available 等，都由 Admin 手動執行
if ($conn->query("UPDATE Item SET rent_state='$new_state' WHERE item_id='$item_id'")) {
    echo json_encode(['success' => true, 'message' => "品項 $item_id 狀態已更新為 $new_state"], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success' => false, 'message' => $conn->error]);
}
?>
