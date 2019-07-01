<?php 
/************************************************************************/
// Turn off error reporting  =          0
// Report runtime errors =              E_ERROR | E_WARNING | E_PARSE
// Report all errors =                  E_ALL
// Report all errors except E_NOTICE =  E_ALL & ~E_NOTICE
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
/************************************************************************/
    
    /***** HEADER *****/
    include_once('components/header.php');
    
    
    /***** PAGE *****/
    require_once('apps/home.php');
    
    
    /***** FOOTER *****/
    include_once('components/footer.php');
?>