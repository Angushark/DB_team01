<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
function send_json($d) { ob_clean(); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

if (empty($_SESSION['member_id'])) send_json(['success' => false, 'message' => '請先登入']);

require_once '../db_config.php';
require_once 'sync_states.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $oid  = $conn->real_escape_string($data['order_id'] ?? '');
    $mid  = (int)$_SESSION['member_id'];

    if (!$oid) send_json(['success' => false, 'message' => '缺少訂單編號']);

    // 確認訂單存在
    $r = $conn->query("SELECT order_id, renter_id, order_state, total_rental, rent_date, return_date FROM `Order` WHERE order_id='$oid'");
    if (!$r || $r->num_rows === 0) send_json(['success' => false, 'message' => '訂單不存在']);
    $order = $r->fetch_assoc();

    // 確認角色
    $isAdmin = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$mid")->num_rows > 0;
    $isOwner = ((int)$order['renter_id'] === $mid);

    if (!$isAdmin && !$isOwner) send_json(['success' => false, 'message' => '無權限取消此訂單']);

    // 已取消或已完成的訂單不可再取消
    if (in_array($order['order_state'], ['cancelled', 'completed'])) {
        send_json(['success' => false, 'message' => '此訂單狀態無法取消']);
    }

    // Renter 只能取消未付款（unpaid）的訂單
    if (!$isAdmin && $order['order_state'] !== 'unpaid') {
        send_json(['success' => false, 'message' => '訂單已付款，無法自行取消']);
    }

    // 取得品項快照
    $items_r    = $conn->query("SELECT i.name FROM Contains c JOIN Item i ON c.item_id=i.item_id WHERE c.order_id='$oid'");
    $item_names = [];
    if ($items_r) while ($ir = $items_r->fetch_assoc()) $item_names[] = $ir['name'];
    $snapshot = json_encode($item_names, JSON_UNESCAPED_UNICODE);

    // 寫入取消紀錄
    $renter_id   = (int)$order['renter_id'];
    $state       = $conn->real_escape_string($order['order_state']);
    $total       = (int)$order['total_rental'];
    $rent_date   = $conn->real_escape_string($order['rent_date']);
    $return_date = $conn->real_escape_string($order['return_date']);
    $snap        = $conn->real_escape_string($snapshot);

    $conn->query("INSERT INTO OrderDeleteLog
        (order_id, renter_id, deleted_by, order_state, total_rental, item_snapshot, rent_date, return_date)
        VALUES ('$oid', $renter_id, $mid, '$state', $total, '$snap', '$rent_date', '$return_date')");

    // 將訂單狀態改為 cancelled（保留資料，不刪除）
    if (!$conn->query("UPDATE `Order` SET order_state='cancelled' WHERE order_id='$oid'")) {
        send_json(['success' => false, 'message' => '取消失敗：' . $conn->error]);
    }

    sync_item_states($conn);
    send_json(['success' => true, 'message' => '訂單已取消']);

} catch (Throwable $e) {
    send_json(['success' => false, 'message' => '伺服器錯誤：' . $e->getMessage()]);
}
?>
