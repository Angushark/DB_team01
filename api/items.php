<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../db_config.php';

$result = $conn->query("SELECT item_id, name, brand, model, type, rent_state, rental, url FROM `Item` ORDER BY item_id");
$items = [];
if ($result) while ($row = $result->fetch_assoc()) $items[] = $row;
echo json_encode(['success' => true, 'items' => $items], JSON_UNESCAPED_UNICODE);
