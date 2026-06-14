<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['member_id'])) { echo json_encode(['success'=>false,'message'=>'請先登入']); exit; }

require_once '../db_config.php';
$mid = $_SESSION['member_id'];

$r = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$mid");
if (!$r || $r->num_rows === 0) { echo json_encode(['success'=>false,'message'=>'僅限管理員']); exit; }

// 查所有訂單 + 租借者姓名
$result = $conn->query("
    SELECT o.order_id, o.renter_id, m.username,
           o.rent_date, o.return_date, o.total_rental, o.order_state, o.create_date
    FROM `Order` o
    JOIN Member m ON o.renter_id = m.member_id
    ORDER BY CAST(o.order_id AS UNSIGNED) DESC
");

$orders = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        // 查每筆訂單的品項
        $oid = $conn->real_escape_string($row['order_id']);
        $items_res = $conn->query("
            SELECT i.item_id, i.name, i.brand, i.model, i.rental, i.rent_state
            FROM Contains c
            JOIN Item i ON c.item_id = i.item_id
            WHERE c.order_id = '$oid'
        ");
        $items = [];
        if ($items_res) while ($item = $items_res->fetch_assoc()) $items[] = $item;
        $row['items'] = $items;
        $orders[] = $row;
    }
}

echo json_encode(['success'=>true,'orders'=>$orders], JSON_UNESCAPED_UNICODE);
?>
