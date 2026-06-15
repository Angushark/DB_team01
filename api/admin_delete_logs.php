<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
if (empty($_SESSION['member_id'])) { echo json_encode(['success'=>false,'message'=>'請先登入']); exit; }

require_once '../db_config.php';
$mid = (int)$_SESSION['member_id'];

$r = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$mid");
if (!$r || $r->num_rows === 0) { echo json_encode(['success'=>false,'message'=>'僅限管理員']); exit; }

$result = $conn->query("
    SELECT l.log_id, l.order_id, l.order_state, l.total_rental,
           l.rent_date, l.return_date, l.deleted_at, l.item_snapshot,
           m.username AS renter_name, d.username AS deleted_by_name
    FROM OrderDeleteLog l
    JOIN Member m ON l.renter_id = m.member_id
    JOIN Member d ON l.deleted_by = d.member_id
    ORDER BY l.deleted_at DESC
    LIMIT 100
");

$logs = [];
if ($result) while ($row = $result->fetch_assoc()) $logs[] = $row;
echo json_encode(['success'=>true,'logs'=>$logs], JSON_UNESCAPED_UNICODE);
?>
