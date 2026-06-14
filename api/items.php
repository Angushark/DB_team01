<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
require_once '../db_config.php';

$result = $conn->query(
    "SELECT item_id, name, brand, model, type, rent_state, rental, url
     FROM Item
     WHERE rent_state IN ('available', 'rented')
     ORDER BY item_id"
);
$items = [];
if ($result) while ($row = $result->fetch_assoc()) $items[] = $row;

ob_clean();
echo json_encode(['success' => true, 'items' => $items], JSON_UNESCAPED_UNICODE);
