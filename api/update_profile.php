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
$mid  = (int)$_SESSION['member_id'];
$data = json_decode(file_get_contents('php://input'), true);

$phone       = trim($data['phone_number']   ?? '');
$new_pw      = $data['new_password']        ?? '';
$current_pw  = $data['current_password']    ?? '';

$sets = [];

// 更新電話
if ($phone !== '') {
    $p = $conn->real_escape_string($phone);
    $sets[] = "phone_number='$p'";
}

// 更新密碼
if ($new_pw !== '') {
    if (strlen($new_pw) < 6) {
        echo json_encode(['success' => false, 'message' => '新密碼長度至少 6 位']); exit;
    }
    if (!$current_pw) {
        echo json_encode(['success' => false, 'message' => '請輸入目前密碼']); exit;
    }
    // 驗證目前密碼
    $stmt = $conn->prepare("SELECT password FROM Member WHERE member_id=?");
    $stmt->bind_param("i", $mid); $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc(); $stmt->close();
    $stored = $row['password'] ?? '';
    $is_hashed = (strlen($stored) >= 60 && (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$2b$')));
    $valid  = $is_hashed ? password_verify($current_pw, $stored) : ($current_pw === $stored);
    if (!$valid) {
        echo json_encode(['success' => false, 'message' => '目前密碼不正確']); exit;
    }
    $hashed = password_hash($new_pw, PASSWORD_BCRYPT);
    $h      = $conn->real_escape_string($hashed);
    $sets[] = "password='$h'";
}

if (empty($sets)) {
    echo json_encode(['success' => false, 'message' => '沒有任何要更新的資料']); exit;
}

$sql = "UPDATE Member SET " . implode(', ', $sets) . " WHERE member_id=$mid";
if ($conn->query($sql)) {
    echo json_encode(['success' => true, 'message' => '個人資料已更新'], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success' => false, 'message' => '更新失敗：' . $conn->error]);
}
?>
