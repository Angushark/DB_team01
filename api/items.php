<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
require_once '../db_config.php';

$result = $conn->query(
    "SELECT i.item_id, i.name, i.brand, i.model, i.type, i.rent_state, i.rental, i.url,
            e.equipment_type, a.accessory_type
     FROM Item i
     LEFT JOIN Equipment e ON i.item_id = e.item_id
     LEFT JOIN Accessory a ON i.item_id = a.item_id
     WHERE i.rent_state IN ('available', 'rented')
     ORDER BY i.item_id"
);
$items = [];
if ($result) while ($row = $result->fetch_assoc()) $items[] = $row;

ob_clean();
echo json_encode(['success' => true, 'items' => $items], JSON_UNESCAPED_UNICODE);
