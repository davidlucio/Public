<?php
    // DATABASE CONFIG
    require_once('dbconfig.php');
    
    
    // TABLES CONFIG
    // require_once('config.php');
    
    
    // Determine HTTP method, path, and body of the request
    $method = $_SERVER['REQUEST_METHOD'];
    
    // LUCIOWARE - 9/19/18 - Cross Domain Overwrites
    header('Access-Control-Allow-Origin: *');
    header('Content-type: application/json');
    
    $request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
    
    // Determine table and key
    $info = preg_replace( '/[^a-z0-9_]+/i','',array_shift($request) );
    $reqKey = array_shift($request);
    $reqVal = array_shift($request);
    
    $input = json_decode(file_get_contents('php://input'),true);
    
    
    // Establish Database Connection
    $connection = mysqli_connect(
        $dbconfig['server'], 
        $dbconfig['user'], 
        $dbconfig['password'], 
        $dbconfig['database'] 
    );
    mysqli_set_charset($connection, 'utf8');
    
    
    // Choose Functions by Method
    switch ($method) {
        case 'GET':
            //$sql = "select * from `$table`".($key?" WHERE id=$key":'');
            include('functions/get.php');
            // echo "<br/>Here is the trail: <br/>".$info."<br/>".$reqKey."<br/>".$reqVal;
            break;
        // case 'PUT':
        case 'POST':
            //$sql = "update `$table` set $set where id=$key";
            //$sql = "insert into `$table` set $set";
            /////include('functions/set.php');
            break;
        case 'DELETE':
            //$sql = "delete `$table` where id=$key";
            /////include('functions/delete.php');
            break;
    }
    
    
    // Execute SQL Query
    $result = mysqli_query($connection, $query);
    
    if (!$result) {
        http_response_code(404);
        die(mysqli_error());
    }
    
    
    // Output Responses
    if ($method == 'GET') {
        if (!$key) echo '[';
        for ($i=0;$i<mysqli_num_rows($result);$i++) {
            echo ($i>0?',':'').json_encode(mysqli_fetch_object($result));
        }
        if (!$key) echo ']';
    }
    elseif ($method == 'POST') {
        echo mysqli_insert_id($connection);
    }
    else {
        echo mysqli_affected_rows($connection);
    }
    
    
    // End Database Connection
    mysqli_close($connection);