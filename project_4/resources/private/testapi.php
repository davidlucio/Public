<?php

    require_once('config.php');
    
    // Determine HTTP method, path, and body of the request
    $method = $_SERVER['REQUEST_METHOD'];
    $request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
    $input = json_decode(file_get_contents('php://input'),true);
    
    // Establish Database Connection
    // $link = mysqli_connect('localhost', 'davidluc_admin', 'ThisIsAStrong1too!', 'davidluc_dnd');
    $link = mysqli_connect( $dbconfig['server'], $dbconfig['user'], $dbconfig['password'], $dbconfig['database'] );
    mysqli_set_charset($link,'utf8');
    
    // Determine table and key
    $functionCall = preg_replace('/[^a-z0-9_]+/i','',array_shift($request));
    switch($functionCall){
        case "enemy" :
            $table = "creature";
            break;
        case "creature" :
            $table = "creature";
            break;
        case "npc" :
            $table = "npcs";
            break;
        default :
            $table = "test";
            break;
    };
    
    $key = array_shift($request)+0;






// escape the columns and values from the input object
$columns = preg_replace('/[^a-z0-9_]+/i','',array_keys($input));
$values = array_map(function ($value) use ($link) {
  if ($value===null) return null;
  return mysqli_real_escape_string($link,(string)$value);
},array_values($input));
 
// build the SET part of the SQL command
$set = '';
for ($i=0;$i<count($columns);$i++) {
  $set.=($i>0?',':'').'`'.$columns[$i].'`=';
  $set.=($values[$i]===null?'NULL':'"'.$values[$i].'"');
}
 
// create SQL based on HTTP method
switch ($method) {
  case 'GET':
    $sql = "select * from `$table`".($key?" WHERE id=$key":''); break;
  case 'PUT':
    $sql = "update `$table` set $set where id=$key"; break;
  case 'POST':
    $sql = "insert into `$table` set $set"; break;
  case 'DELETE':
    $sql = "delete `$table` where id=$key"; break;
}
 
// excecute SQL statement
$result = mysqli_query($link,$sql);
 
// die if SQL statement failed
if (!$result) {
  http_response_code(404);
  die(mysqli_error());
}
 
// print results, insert id or affected row count
if ($method == 'GET') {
  if (!$key) echo '[';
  for ($i=0;$i<mysqli_num_rows($result);$i++) {
    echo ($i>0?',':'').json_encode(mysqli_fetch_object($result));
  }
  if (!$key) echo ']';
} elseif ($method == 'POST') {
  echo mysqli_insert_id($link);
} else {
  echo mysqli_affected_rows($link);
}
 
// close mysql connection
mysqli_close($link);