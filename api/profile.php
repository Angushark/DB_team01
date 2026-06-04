<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include(__DIR__ . '/../db_config.php');

if (!isset($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '尚未登入']);
    exit;
}

$member_id = $_SESSION['member_id'];

$stmt = $conn->prepare("SELECT member_id, username, email, reg_date, phone_number FROM Member WHERE member_id = ?");
$stmt->bind_param("i", $member_id);
$stmt->execute();
$result = $stmt->get_result();
$member = $result->fetch_assoc();
$stmt->close();

if (!$member) {
    echo json_encode(['success' => false, 'message' => '查無會員資料']);
    exit;
}

$roles = ['isRenter' => false, 'isProvider' => false, 'isAdmin' => false];
$r = $conn->query("SELECT member_id FROM Renter WHERE member_id = $member_id");
if ($r && $r->num_rows > 0) $roles['isRenter'] = true;
$r = $conn->query("SELECT member_id FROM Provider WHERE member_id = $member_id");
if ($r && $r->num_rows > 0) $roles['isProvider'] = true;
$r = $conn->query("SELECT member_id FROM Administrator WHERE member_id = $member_id");
if ($r && $r->num_rows > 0) $roles['isAdmin'] = true;
$member['roles'] = $roles;

$stmt = $conn->prepare("SELECT order_id, rent_date, return_date, total_rental, order_state FROM `Order` WHERE renter_id = ? ORDER BY rent_date DESC");
$stmt->bind_param("i", $member_id);
$stmt->execute();
$orderResult = $stmt->get_result();

$orders = [];
while ($order = $orderResult->fetch_assoc()) {
    $oid = $order['order_id'];
    $is = $conn->prepare("SELECT i.item_id, i.name, i.brand, i.model, i.rental FROM Contains c JOIN Item i ON c.item_id = i.item_id WHERE c.order_id = ?");
    $is->bind_param("i", $oid);
    $is->execute();
    $ir = $is->get_result();
    $items = [];
    while ($item = $ir->fetch_assoc()) { $items[] = $item; }
    $is->close();
    $order['items'] = $items;
    $orders[] = $order;
}
$stmt->close();

echo json_encode(['success' => true, 'member' => $member, 'orders' => $orders]);
$conn->close();
?>
