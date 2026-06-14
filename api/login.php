<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include(__DIR__ . '/../db_config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '僅接受 POST 請求']);
    exit;
}

$data      = json_decode(file_get_contents('php://input'), true);
$member_id = intval($data['member_id'] ?? 0);
$password  = $data['password'] ?? '';

if (!$member_id || !$password) {
    echo json_encode(['success' => false, 'message' => '請輸入會員編號與密碼']);
    exit;
}

$stmt = $conn->prepare("SELECT member_id, username, email, reg_date, phone_number, password FROM Member WHERE member_id = ?");
$stmt->bind_param("i", $member_id);
$stmt->execute();
$result = $stmt->get_result();
$member = $result->fetch_assoc();
$stmt->close();

if (!$member) {
    echo json_encode(['success' => false, 'message' => '查無此會員編號']);
    exit;
}
if ($password !== $member['password']) {
    echo json_encode(['success' => false, 'message' => '密碼錯誤']);
    exit;
}

$roles = ['isRenter' => false, 'isProvider' => false, 'isAdmin' => false];

$r = $conn->query("SELECT member_id FROM Renter WHERE member_id = $member_id");
if ($r && $r->num_rows > 0) $roles['isRenter'] = true;
$r = $conn->query("SELECT member_id FROM Provider WHERE member_id = $member_id");
if ($r && $r->num_rows > 0) $roles['isProvider'] = true;
$r = $conn->query("SELECT member_id FROM Administrator WHERE member_id = $member_id");
if ($r && $r->num_rows > 0) $roles['isAdmin'] = true;

$_SESSION['member_id'] = $member['member_id'];
$_SESSION['username']  = $member['username'];
$_SESSION['roles']     = $roles;

echo json_encode([
    'success' => true,
    'message' => '登入成功',
    'member'  => [
        'member_id'    => $member['member_id'],
        'username'     => $member['username'],
        'email'        => $member['email'],
        'reg_date'     => $member['reg_date'],
        'phone_number' => $member['phone_number'],
        'roles'        => $roles
    ]
]);
$conn->close();
?>
