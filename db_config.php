<?php
$servername = "140.122.184.121";
$username = "team01";
$password = "DHUueh9e@3Ez";
$dbname = "team01";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    if (ob_get_level()) ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => '資料庫連線失敗: ' . $conn->connect_error]);
    exit;
}

// 嘗試設定 charset，失敗也不中斷（解決之前 exit 的問題）
@$conn->set_charset("utf8mb4") || @$conn->set_charset("utf8");
?>
