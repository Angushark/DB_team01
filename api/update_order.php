<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
function send_json($d) { ob_clean(); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

if (empty($_SESSION['member_id'])) send_json(['success' => false, 'message' => '請先登入']);

require_once '../db_config.php';
require_once 'sync_states.php';

try {
    $data        = json_decode(file_get_contents('php://input'), true);
    $oid         = $conn->real_escape_string($data['order_id']    ?? '');
    $order_state = $conn->real_escape_string($data['order_state'] ?? '');
    $rent_date   = $conn->real_escape_string($data['rent_date']   ?? '');
    $return_date = $conn->real_escape_string($data['return_date'] ?? '');
    $mid         = (int)$_SESSION['member_id'];

    // ── 確認訂單存在 ───────────────────────────────────────────
    $r = $conn->query("SELECT order_id, renter_id, order_state FROM `Order` WHERE order_id='$oid'");
    if (!$r || $r->num_rows === 0) send_json(['success' => false, 'message' => '訂單不存在']);
    $order = $r->fetch_assoc();

    // ── 確認角色 ───────────────────────────────────────────────
    $isAdmin = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$mid")->num_rows > 0;
    $isOwner = ((int)$order['renter_id'] === $mid);

    // ── 狀態轉換規則 ───────────────────────────────────────────
    $allowed      = false;
    $currentState = $order['order_state'];

    if ($isAdmin) {
        $allowed = in_array($order_state, ['confirmed', 'completed', 'cancelled']);
    } elseif ($isOwner) {
        if ($currentState === 'unpaid') {
            // Renter 可取消、或在 unpaid 狀態下修改日期（order_state 保持 unpaid）
            $allowed = ($order_state === 'cancelled' || $order_state === 'unpaid');
        }
    }

    if (!$allowed) send_json(['success' => false, 'message' => '權限不足或狀態轉換不允許']);

    // ── 更新訂單 ───────────────────────────────────────────────
    if ($rent_date && $return_date && ($isAdmin || ($isOwner && $currentState === 'unpaid'))) {
        if ($return_date <= $rent_date) send_json(['success' => false, 'message' => '歸還日期必須晚於租借日期']);
        $sql = "UPDATE `Order` SET
            order_state='$order_state',
            rent_date='$rent_date',
            return_date='$return_date',
            total_rental=ROUND((
                SELECT COALESCE(SUM(i.rental),0)
                FROM `Contains` c JOIN `Item` i ON c.item_id=i.item_id
                WHERE c.order_id='$oid'
            ) * GREATEST(1, DATEDIFF('$return_date','$rent_date')))
        WHERE order_id='$oid'";
    } else {
        $sql = "UPDATE `Order` SET order_state='$order_state' WHERE order_id='$oid'";
    }

    if ($conn->query($sql)) {
        sync_item_states($conn);
        send_json(['success' => true]);
    } else {
        send_json(['success' => false, 'message' => $conn->error]);
    }
} catch (Throwable $e) {
    send_json(['success' => false, 'message' => '伺服器錯誤：' . $e->getMessage()]);
}
