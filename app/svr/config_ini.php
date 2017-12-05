<?php
require_once("config.php");

echo json_encode(getConfig($_GET['get']));
?>
