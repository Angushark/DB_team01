<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['member_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']); exit;
}

require_once '../db_config.php';
$mid = $_SESSION['member_id'];

// ── 確認是 Provider ────────────────────────────────────────
$r = $conn->query("SELECT 1 FROM Provider WHERE member_id=$mid");
if (!$r || $r->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => '僅限出租方可上架品項']); exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '僅接受 POST']); exit;
}

$data         = json_decode(file_get_contents('php://input'), true);
$name         = trim($data['name']         ?? '');
$brand        = trim($data['brand']        ?? '');
$model        = trim($data['model']        ?? '');
$type         = trim($data['type']         ?? '');
$description  = trim($data['description']  ?? '');
$rental       = floatval($data['rental']   ?? 0);
$item_subtype = trim($data['item_subtype'] ?? ''); // equipment_type 或 accessory_type
$item_category = trim($data['item_category'] ?? ''); // 'equipment' or 'accessory'
$url          = trim($data['url']          ?? '');

if (!$name || !$rental || !$item_category) {
    echo json_encode(['success' => false, 'message' => '名稱、每日租金、品項類別為必填']); exit;
}
if (!in_array($item_category, ['equipment', 'accessory'])) {
    echo json_encode(['success' => false, 'message' => '品項類別必須為 equipment 或 accessory']); exit;
}

// ── 產生 item_id ───────────────────────────────────────────
$res     = $conn->query("SELECT COALESCE(MAX(CAST(item_id AS UNSIGNED)), 0) + 1 AS next_id FROM `Item`");
$item_id = (string)$res->fetch_assoc()['next_id'];

$n   = $conn->real_escape_string($name);
$b   = $conn->real_escape_string($brand);
$m   = $conn->real_escape_string($model);
$t   = $conn->real_escape_string($type);
$d   = $conn->real_escape_string($description);
$u   = $conn->real_escape_string($url);
$r2  = $conn->real_escape_string((string)$rental);
$iid = $conn->real_escape_string($item_id);

// 新品項預設 unavailable（TRIGGER 也會設，雙重保障）
if (!$conn->query("INSERT INTO Item (item_id, name, brand, model, type, description, rent_state, rental, url) VALUES ('$iid','$n','$b','$m','$t','$d','unavailable',$r2,'$u')")) {
    echo json_encode(['success' => false, 'message' => '新增品項失敗：' . $conn->error]); exit;
}

// 插入子表 Equipment / Accessory
if ($item_category === 'equipment') {
    $valid = ['camera','drone','computer','gimbal','lighting','audio'];
    $et = in_array($item_subtype, $valid) ? $item_subtype : 'camera';
    $et = $conn->real_escape_string($et);
    $conn->query("INSERT INTO Equipment (item_id, equipment_type) VALUES ('$iid','$et')");
} else {
    $valid = ['lens','tripod','battery','storage','filter'];
    $at = in_array($item_subtype, $valid) ? $item_subtype : 'lens';
    $at = $conn->real_escape_string($at);
    $conn->query("INSERT INTO Accessory (item_id, accessory_type) VALUES ('$iid','$at')");
}

// 建立 Provide 關聯（TRIGGER 會再次設 unavailable，無副作用）
$conn->query("INSERT INTO Provide (member_id, item_id) VALUES ($mid,'$iid')");

echo json_encode([
    'success' => true,
    'message' => '品項已上架，狀態為審核中（unavailable），待管理員啟用',
    'item_id' => $item_id
], JSON_UNESCAPED_UNICODE);
?>
