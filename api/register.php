<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include(__DIR__ . '/../db_config.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '僅接受 POST 請求']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';
$phone    = trim($data['phone_number'] ?? '');

if (!$username || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => '使用者名稱、信箱、密碼為必填欄位']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => '密碼長度至少 6 位']);
    exit;
}

$check = $conn->prepare("SELECT member_id FROM Member WHERE username = ? OR email = ?");
$check->bind_param("ss", $username, $email);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => '使用者名稱或信箱已被註冊']);
    $check->close();
    exit;
}
$check->close();

$reg_date = date('Y-m-d');
$stmt = $conn->prepare("INSERT INTO Member (username, email, reg_date, password, phone_number) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $username, $email, $reg_date, $password, $phone);
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => '註冊失敗：' . $stmt->error]);
    $stmt->close();
    exit;
}
$member_id = $stmt->insert_id;
$stmt->close();

$conn->query("INSERT INTO Renter (member_id) VALUES ($member_id)");

echo json_encode([
    'success'   => true,
    'message'   => '註冊成功！您的會員編號為 ' . $member_id,
    'member_id' => $member_id
]);
$conn->close();
?>
