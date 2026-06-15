<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include(__DIR__ . '/../db_config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '僅接受 POST 請求']); exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => '請輸入電子信箱與密碼']); exit;
}

$stmt = $conn->prepare("SELECT member_id, username, email, reg_date, phone_number, password, balance FROM Member WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$member = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$member) {
    echo json_encode(['success' => false, 'message' => '查無此電子信箱']); exit;
}

$stored    = $member['password'];
$is_hashed = (strlen($stored) >= 60 && (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$2b$')));
$member_id = $member['member_id'];

if ($is_hashed) {
    $valid = password_verify($password, $stored);
} else {
    $valid = ($password === $stored);
    if ($valid) {
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        $escaped = $conn->real_escape_string($newHash);
        $conn->query("UPDATE Member SET password='$escaped' WHERE member_id=$member_id");
    }
}

if (!$valid) {
    echo json_encode(['success' => false, 'message' => '密碼錯誤']); exit;
}

$roles = ['isRenter' => false, 'isProvider' => false, 'isAdmin' => false];
$r = $conn->query("SELECT 1 FROM Renter        WHERE member_id=$member_id"); if ($r && $r->num_rows > 0) $roles['isRenter']   = true;
$r = $conn->query("SELECT 1 FROM Provider      WHERE member_id=$member_id"); if ($r && $r->num_rows > 0) $roles['isProvider'] = true;
$r = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$member_id"); if ($r && $r->num_rows > 0) $roles['isAdmin']    = true;

$_SESSION['member_id'] = $member_id;
$_SESSION['username']  = $member['username'];
$_SESSION['roles']     = $roles;

echo json_encode([
    'success' => true, 'message' => '登入成功',
    'member'  => [
        'member_id'    => $member_id,
        'username'     => $member['username'],
        'email'        => $member['email'],
        'reg_date'     => $member['reg_date'],
        'phone_number' => $member['phone_number'],
        'balance'      => (int)$member['balance'],
        'roles'        => $roles,
    ]
]);
$conn->close();
?>
