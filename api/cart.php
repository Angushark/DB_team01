<?php
header('Content-Type: application/json; charset=utf-8');
if (session_status() === PHP_SESSION_NONE) session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $cart = array_values($_SESSION['cart'] ?? []);
    echo json_encode(['success' => true, 'cart' => $cart, 'count' => count($cart)], JSON_UNESCAPED_UNICODE);
    exit;
}

$data   = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

if ($action === 'add') {
    $item_id = trim($data['item_id'] ?? '');
    if ($item_id === '') { echo json_encode(['success' => false, 'message' => '缺少 item_id']); exit; }
    if (!isset($_SESSION['cart'])) $_SESSION['cart'] = [];
    foreach ($_SESSION['cart'] as $c) {
        if ($c['item_id'] === $item_id) {
            echo json_encode(['success' => true, 'already' => true, 'count' => count($_SESSION['cart'])], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    $_SESSION['cart'][] = ['item_id' => $item_id, 'name' => trim($data['name'] ?? ''), 'rental' => (float)($data['rental'] ?? 0)];
    echo json_encode(['success' => true, 'count' => count($_SESSION['cart'])], JSON_UNESCAPED_UNICODE);

} elseif ($action === 'remove') {
    $item_id = trim($data['item_id'] ?? '');
    $_SESSION['cart'] = array_values(array_filter($_SESSION['cart'] ?? [], fn($c) => $c['item_id'] !== $item_id));
    echo json_encode(['success' => true, 'cart' => $_SESSION['cart'], 'count' => count($_SESSION['cart'])], JSON_UNESCAPED_UNICODE);

} elseif ($action === 'clear') {
    $_SESSION['cart'] = [];
    echo json_encode(['success' => true, 'count' => 0]);

} else {
    echo json_encode(['success' => false, 'message' => 'unknown action']);
}
