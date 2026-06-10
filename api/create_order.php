<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$data        = json_decode(file_get_contents('php://input'), true);
$rent_date   = trim($data['rent_date']   ?? '');
$return_date = trim($data['return_date'] ?? '');

if (!$rent_date || !$return_date) {
    echo json_encode(['success' => false, 'message' => '缺少日期欄位']); exit;
}
if ($return_date < $rent_date) {
    echo json_encode(['success' => false, 'message' => '歸還日期不可早於租借日期']); exit;
}

$cart = $_SESSION['cart'] ?? [];
if (empty($cart)) {
    echo json_encode(['success' => false, 'message' => '購物車是空的']); exit;
}

$renter_id   = $conn->real_escape_string($_SESSION['member_id']);
$rd          = $conn->real_escape_string($rent_date);
$rrd         = $conn->real_escape_string($return_date);
$days        = max(1, (int)(new DateTime($return_date))->diff(new DateTime($rent_date))->days);

$res      = $conn->query("SELECT COALESCE(MAX(CAST(order_id AS UNSIGNED)), 0) + 1 AS next_id FROM `Order`");
$order_id = $conn->real_escape_string((string)$res->fetch_assoc()['next_id']);

if (!$conn->query("INSERT INTO `Order` (order_id, renter_id, rent_date, return_date, total_rental, order_state) VALUES ('$order_id','$renter_id','$rd','$rrd',0,'unpaid')")) {
    echo json_encode(['success' => false, 'message' => '建立訂單失敗：' . $conn->error]); exit;
}

foreach ($cart as $item) {
    $iid = $conn->real_escape_string($item['item_id']);
    $conn->query("INSERT INTO `Contains` (order_id, item_id) VALUES ('$order_id','$iid')");
}

$conn->query("UPDATE `Order` SET total_rental=(SELECT COALESCE(SUM(i.rental),0) FROM `Contains` c JOIN `Item` i ON c.item_id=i.item_id WHERE c.order_id='$order_id') * $days WHERE order_id='$order_id'");

$_SESSION['cart'] = [];
echo json_encode(['success' => true, 'order_id' => $order_id], JSON_UNESCAPED_UNICODE);
