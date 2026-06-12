<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../db_config.php';

$item_id = $_GET['item_id'] ?? '';
if (!$item_id) { echo json_encode(['success'=>false,'message'=>'缺少 item_id']); exit; }

$stmt = $conn->prepare("SELECT item_id, name, brand, model, type, description, rent_state, rental, url, specs FROM `Item` WHERE item_id = ?");
$stmt->bind_param("s", $item_id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row) { echo json_encode(['success'=>false,'message'=>'找不到器材']); exit; }
echo json_encode(['success'=>true,'item'=>$row], JSON_UNESCAPED_UNICODE);
