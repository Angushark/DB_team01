<?php
ob_start();
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

function send_json($data) {
    ob_clean();
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (empty($_SESSION['member_id'])) {
        send_json(['success' => false, 'message' => '請先登入']);
    }

    require_once '../db_config.php';
    $mid = (int)$_SESSION['member_id'];

    // 只有 Renter 才能建立訂單
    $r = $conn->query("SELECT 1 FROM Renter WHERE member_id=$mid");
    if (!$r || $r->num_rows === 0) {
        send_json(['success' => false, 'message' => '僅限租借者身份可建立訂單']);
    }

    $input       = json_decode(file_get_contents('php://input'), true);
    $rent_date   = trim($input['rent_date']   ?? '');
    $return_date = trim($input['return_date'] ?? '');

    if (!$rent_date || !$return_date) {
        send_json(['success' => false, 'message' => '缺少日期欄位']);
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $rent_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $return_date)) {
        send_json(['success' => false, 'message' => '日期格式錯誤']);
    }
    if ($return_date < $rent_date) {
        send_json(['success' => false, 'message' => '歸還日期不可早於租借日期']);
    }

    $cart = $_SESSION['cart'] ?? [];
    if (empty($cart)) {
        send_json(['success' => false, 'message' => '購物車是空的']);
    }

    $rd   = $conn->real_escape_string($rent_date);
    $rrd  = $conn->real_escape_string($return_date);
    $days = max(1, (int)(new DateTime($return_date))->diff(new DateTime($rent_date))->days);

    // 確認購物車內品項都是 available
    foreach ($cart as $item) {
        $iid   = $conn->real_escape_string($item['item_id']);
        $check = $conn->query("SELECT rent_state FROM Item WHERE item_id='$iid'");
        if (!$check || $check->num_rows === 0) {
            send_json(['success' => false, 'message' => "品項 $iid 不存在"]);
        }
        $st = $check->fetch_assoc()['rent_state'];
        if ($st !== 'available') {
            send_json(['success' => false, 'message' => "品項「{$item['name']}」目前無法租借（狀態：$st）"]);
        }
    }

    // 確認日期無衝突（只檢查 unpaid/confirmed 的訂單）
    $item_ids_arr = array_column($cart, 'item_id');
    $ph           = implode(',', array_fill(0, count($item_ids_arr), '?'));
    $types_chk    = str_repeat('s', count($item_ids_arr)) . 'ss';
    $stmt_chk     = $conn->prepare(
        "SELECT c.item_id
         FROM Contains c
         JOIN `Order` o ON c.order_id = o.order_id
         WHERE c.item_id IN ($ph)
           AND o.order_state IN ('unpaid','confirmed')
           AND o.rent_date < ?
           AND o.return_date > ?
         LIMIT 1"
    );
    if (!$stmt_chk) {
        send_json(['success' => false, 'message' => 'DB prepare 失敗：' . $conn->error]);
    }
    $chk_params = array_merge($item_ids_arr, [$rrd, $rd]);
    $stmt_chk->bind_param($types_chk, ...$chk_params);
    $stmt_chk->execute();
    $res_chk = $stmt_chk->get_result();
    if ($res_chk && $res_chk->num_rows > 0) {
        $cid = $res_chk->fetch_assoc()['item_id'];
        send_json(['success' => false, 'message' => "品項 $cid 在所選日期已有其他預訂，請選擇其他日期"]);
    }
    $stmt_chk->close();

    // 產生新 order_id
    $res_id = $conn->query("SELECT COALESCE(MAX(CAST(order_id AS UNSIGNED)), 0) + 1 AS next_id FROM `Order`");
    if (!$res_id) {
        send_json(['success' => false, 'message' => '取得 order_id 失敗：' . $conn->error]);
    }
    $order_id  = $conn->real_escape_string((string)$res_id->fetch_assoc()['next_id']);
    $renter_id = $conn->real_escape_string((string)$mid);

    // 建立訂單
    $ok = $conn->query(
        "INSERT INTO `Order` (order_id, renter_id, rent_date, return_date, total_rental, order_state, create_date)
         VALUES ('$order_id','$renter_id','$rd','$rrd',0,'unpaid',NOW())"
    );
    if (!$ok) {
        send_json(['success' => false, 'message' => '建立訂單失敗：' . $conn->error]);
    }

    // 寫入 Contains
    foreach ($cart as $item) {
        $iid = $conn->real_escape_string($item['item_id']);
        $conn->query("INSERT INTO `Contains` (order_id, item_id) VALUES ('$order_id','$iid')");
    }

    // 更新 total_rental
    $conn->query(
        "UPDATE `Order`
         SET total_rental = (
             SELECT COALESCE(SUM(i.rental), 0)
             FROM `Contains` c
             JOIN Item i ON c.item_id = i.item_id
             WHERE c.order_id = '$order_id'
         ) * $days
         WHERE order_id = '$order_id'"
    );

    $_SESSION['cart'] = [];
    send_json(['success' => true, 'order_id' => $order_id]);

} catch (Throwable $e) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => '伺服器錯誤：' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
