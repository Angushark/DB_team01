<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';

$data        = json_decode(file_get_contents('php://input'), true);
$oid         = $conn->real_escape_string($data['order_id']    ?? '');
$order_state = $conn->real_escape_string($data['order_state'] ?? '');
$rent_date   = $conn->real_escape_string($data['rent_date']   ?? '');
$return_date = $conn->real_escape_string($data['return_date'] ?? '');
$mid         = $_SESSION['member_id'];

// ── 確認訂單存在 ───────────────────────────────────────────
$r = $conn->query("SELECT order_id, renter_id, order_state FROM `Order` WHERE order_id='$oid'");
if (!$r || $r->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => '訂單不存在']); exit;
}
$order = $r->fetch_assoc();

// ── 確認角色 ───────────────────────────────────────────────
$isAdmin    = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$mid")->num_rows > 0;
$isOwner    = ((int)$order['renter_id'] === (int)$mid);

// ── 狀態轉換規則 ───────────────────────────────────────────
// Renter(本人): unpaid → cancelled (取消自己的訂單)
// Admin:        任何狀態 → confirmed / completed / cancelled
$allowed = false;
$currentState = $order['order_state'];

if ($isAdmin) {
    // Admin 可以改成 confirmed / completed / cancelled
    $allowed = in_array($order_state, ['confirmed', 'completed', 'cancelled']);
} elseif ($isOwner) {
    // Renter 只能取消自己尚未 confirmed 的訂單
    $allowed = ($order_state === 'cancelled' && $currentState === 'unpaid');
}

if (!$allowed) {
    echo json_encode(['success' => false, 'message' => '權限不足或狀態轉換不允許']); exit;
}

// ── 更新訂單 ───────────────────────────────────────────────
if ($rent_date && $return_date && $isAdmin) {
    // Admin 可同時改日期
    if ($return_date < $rent_date) {
        echo json_encode(['success' => false, 'message' => '歸還日期不可早於租借日期']); exit;
    }
    $sql = "UPDATE `Order` SET
        order_state='$order_state',
        rent_date='$rent_date',
        return_date='$return_date',
        total_rental=(
            SELECT COALESCE(SUM(i.rental),0)
            FROM `Contains` c JOIN `Item` i ON c.item_id=i.item_id
            WHERE c.order_id='$oid'
        ) * GREATEST(1, DATEDIFF('$return_date','$rent_date'))
    WHERE order_id='$oid'";
} else {
    $sql = "UPDATE `Order` SET order_state='$order_state' WHERE order_id='$oid'";
}

if ($conn->query($sql)) {
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success' => false, 'message' => $conn->error]);
}
?>
