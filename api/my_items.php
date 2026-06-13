<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$mid = $_SESSION['member_id'];

$r = $conn->query("SELECT 1 FROM Provider WHERE member_id=$mid");
if (!$r || $r->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => '僅限出租方']); exit;
}

$result = $conn->query("
    SELECT i.item_id, i.name, i.brand, i.model, i.type, i.rent_state, i.rental
    FROM Provide p
    JOIN Item i ON p.item_id = i.item_id
    WHERE p.member_id = $mid
    ORDER BY CAST(i.item_id AS UNSIGNED) DESC
");

$items = [];
if ($result) while ($row = $result->fetch_assoc()) $items[] = $row;
echo json_encode(['success' => true, 'items' => $items], JSON_UNESCAPED_UNICODE);
?>
