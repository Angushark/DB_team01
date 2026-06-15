<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();
function admin_item_json($d) { ob_clean(); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

if (empty($_SESSION['member_id'])) admin_item_json(['success' => false, 'message' => '請先登入']);

require_once '../db_config.php';
$mid = $_SESSION['member_id'];

// ── 確認是 Admin ───────────────────────────────────────────
$r = $conn->query("SELECT 1 FROM Administrator WHERE member_id=$mid");
if (!$r || $r->num_rows === 0) admin_item_json(['success' => false, 'message' => '僅限管理員操作']);

// ── GET：回傳所有品項（含 unavailable + 出租方名稱）──────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query(
        "SELECT i.item_id, i.name, i.brand, i.model, i.type, i.rent_state, i.rental, i.url,
                m.username AS provider_name
         FROM Item i
         LEFT JOIN Provide p ON i.item_id = p.item_id
         LEFT JOIN Member m ON p.member_id = m.member_id
         ORDER BY CAST(i.item_id AS UNSIGNED) DESC"
    );
    $items = [];
    if ($result) while ($row = $result->fetch_assoc()) $items[] = $row;
    admin_item_json(['success' => true, 'items' => $items]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    admin_item_json(['success' => false, 'message' => '不支援此方法']);
}

$data      = json_decode(file_get_contents('php://input'), true);
$item_id   = $conn->real_escape_string(trim($data['item_id']    ?? ''));
$new_state = $conn->real_escape_string(trim($data['rent_state'] ?? ''));

$valid_states = ['available', 'rented', 'unavailable'];
if (!$item_id || !in_array($new_state, $valid_states)) {
    echo json_encode(['success' => false, 'message' => '缺少 item_id 或狀態無效']); exit;
}

// rented → available 或 unavailable → available 等，都由 Admin 手動執行
if ($conn->query("UPDATE Item SET rent_state='$new_state' WHERE item_id='$item_id'")) {
    echo json_encode(['success' => true, 'message' => "品項 $item_id 狀態已更新為 $new_state"], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success' => false, 'message' => $conn->error]);
}
?>
