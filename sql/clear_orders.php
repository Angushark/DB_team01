<?php
require_once '../db_config.php';
$conn->query("SET FOREIGN_KEY_CHECKS = 0");
$conn->query("TRUNCATE TABLE `Contains`");
$conn->query("TRUNCATE TABLE `Order`");
$conn->query("SET FOREIGN_KEY_CHECKS = 1");
echo "done";
