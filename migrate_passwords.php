<?php
/**
 * migrate_passwords.php
 * 一次性執行腳本：將資料庫中所有明文密碼改為 bcrypt hash
 * 放到專案根目錄，在瀏覽器執行一次後請立即刪除此檔案
 */
require_once 'db_config.php';

$result = $conn->query("SELECT member_id, password FROM Member");
$updated = 0;
$skipped = 0;

while ($row = $result->fetch_assoc()) {
    // 已經是 bcrypt hash（以 $2y$ 開頭）就跳過
    if (password_get_info($row['password'])['algo'] !== 0) {
        $skipped++;
        continue;
    }
    $hash = password_hash($row['password'], PASSWORD_BCRYPT);
    $hash = $conn->real_escape_string($hash);
    $conn->query("UPDATE Member SET password='$hash' WHERE member_id={$row['member_id']}");
    $updated++;
}

echo "<pre>";
echo "✅ 完成密碼遷移\n";
echo "   已加密：$updated 筆\n";
echo "   已跳過（已是 hash）：$skipped 筆\n";
echo "\n⚠️  請立即刪除此檔案（migrate_passwords.php）\n";
echo "</pre>";
?>
