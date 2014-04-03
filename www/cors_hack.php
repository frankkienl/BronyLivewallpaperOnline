<?php
header("Access-Control-Allow-Origin: *");
$file = $_GET['file'];
if (strpos($file, "..")){
    exit; //no going up in the filesystem
}
readfile($file);
?>