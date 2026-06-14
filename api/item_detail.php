<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
function send_json($data) { ob_clean(); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
require_once '../db_config.php';

$item_id = $_GET['item_id'] ?? '';
if (!$item_id) send_json(['success' => false, 'message' => '缺少 item_id']);

try {
    $stmt = $conn->prepare(
        "SELECT i.item_id, i.name, i.brand, i.model, i.type, i.description,
                i.rent_state, i.rental, i.url, i.specs,
                e.equipment_type, e.serial_number,
                e.mount_type   AS e_mount_type,
                e.sensor_size, e.max_resolution, e.weight, e.battery,
                a.accessory_type,
                a.mount_type   AS a_mount_type,
                a.focal_length, a.aperture, a.filter_size
         FROM Item i
         LEFT JOIN Equipment e ON i.item_id = e.item_id
         LEFT JOIN Accessory a ON i.item_id = a.item_id
         WHERE i.item_id = ?"
    );
    if (!$stmt) send_json(['success' => false, 'message' => 'DB prepare 失敗：' . $conn->error]);
    $stmt->bind_param("s", $item_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) send_json(['success' => false, 'message' => '找不到器材']);
    send_json(['success' => true, 'item' => $row]);
} catch (Throwable $e) {
    send_json(['success' => false, 'message' => '伺服器錯誤：' . $e->getMessage()]);
}
