<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$data        = json_decode(file_get_contents('php://input'), true);
$oid         = $conn->real_escape_string($data['order_id']   ?? '');
$rent_date   = $conn->real_escape_string($data['rent_date']  ?? '');
$return_date = $conn->real_escape_string($data['return_date'] ?? '');
$order_state = $conn->real_escape_string($data['order_state'] ?? '');
$mid         = $conn->real_escape_string($_SESSION['member_id']);

$valid_states = ['unpaid', 'confirmed', 'completed', 'cancelled'];
if (!$oid || !$rent_date || !$return_date || !in_array($order_state, $valid_states)) {
    echo json_encode(['success' => false, 'message' => '缺少欄位或狀態無效']); exit;
}
if ($return_date < $rent_date) {
    echo json_encode(['success' => false, 'message' => '歸還日期不可早於租借日期']); exit;
}

$sql = "UPDATE `Order` SET
  rent_date='$rent_date', return_date='$return_date', order_state='$order_state',
  total_rental=(SELECT COALESCE(SUM(i.rental),0) FROM `Contains` c JOIN `Item` i ON c.item_id=i.item_id WHERE c.order_id='$oid')
               * GREATEST(1, DATEDIFF('$return_date','$rent_date'))
WHERE order_id='$oid' AND renter_id='$mid'";

if ($conn->query($sql)) {
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success' => false, 'message' => $conn->error]);
}
