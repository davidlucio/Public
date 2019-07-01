<?php 
$bypassCredentials = true;
/************************************************************************/
// Turn off error reporting  =          0
// Report runtime errors =              E_ERROR | E_WARNING | E_PARSE
// Report all errors =                  E_ALL
// Report all errors except E_NOTICE =  E_ALL & ~E_NOTICE
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
/************************************************************************/
    
    /** ACCESS CHECK
            LUCIOWARE to-do: make access based of DB info.
        ACCESS CHECK -- LUCIOWARE to-do: make access based of DB info...
    **/
    
    $allowedUsers = array(
        'DENIED'        => 'Nobody', // DEFAULTED FOR LATER
        'hardluckhero'  => 'Lucio',
        'angelinatemp'  => 'Angelina', // Angelina?
        'Fraghatter'    => 'John',
        'ugwTimbear'    => 'Timbre',
        'tedsfriends'   => 'Ted',
        'TheOnlyRantis' => 'Alex'
    );
    
    $applicationList = array(
        'dashboard'         => 'DM Dashboard',
        'charactercreator'  => 'Character Creator',
        'charactersheet'  => 'Character Sheet'
    );
    
    $application  = ( ( isset($_GET["app"]) && array_key_exists($_GET["app"], $applicationList ) ) ? $_GET["app"] : 'dashboard' );
    
    /***** HEADER *****/
    include_once('components/header.php');
        
        $accessID = ( isset($_GET["id"]) ? $_GET["id"] : 'DENIED' );
        
        if( ( $accessID != 'DENIED' && array_key_exists( $accessID, $allowedUsers ) ) || $bypassCredentials ){
            require_once('apps/'.$application.'.php');
        }
        else{
            echo "Access denied";
        }
        
    /***** FOOTER *****/
    include_once('components/footer.php');
?>