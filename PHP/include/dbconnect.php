<?php
error_reporting(E_ERROR & ~E_WARNING);
ini_set("display_errors", 1);

header("Pragma: no-cache");
header("Pragma: no-cache");
header("Content-Type: text/html; charset=UTF-8");

// db info 
$db_system[host] = "localhost"; 
$db_system[name] = "club1004";
$db_system[id] = "club1004";
$db_system[pw] = "lamxu##$$";


// db 연결
try{
	$connect = mysqli_connect($db_system[host], $db_system[id], $db_system[pw], $db_system[name]);
 	
	if(!$connect) die('Not connected : ' . mysqli_error()); 

}
catch(Exception $e){
	echo "잠시후 다시 연결하십시오. (". $e->getMessage() .")";
}



?>

