<?php
    ///// GET FUNCTIONS -- Compile Query /////
    
    ///// Player Characters
    function getCharacter( $requestKey, $requestVal ){
        
        /****** INSTRUCTIONS *********************************************************************
        //  Character requests can be made using this call 
        //      
        //      hardluckhero.com/resources/private/api.php/character/<KEY>/<VALUE>
        //  
        //  KEY Options:
        //      all     =   Every character in the database
        //      id      =   Character ID
        //      name    =   Character Name
        //      player  =   User Handle
        //      user    =   User ID || User Name
        
        //  VALUE sub-options:
        //      all -> verbose      =   !WARNING! Returns a full set of data for ALL characters
        //      user-> {numeric}    =   User ID
        //      user-> {varchar}    =   User Handle
        /*****************************************************************************************/
        
        $compiledQuery = "";
        
        $selectClause = "
            Plyr.name       'player',
            Plyr.handle     'handle',
            Toon.id         'id',
            Toon.name       'character',
            Toon.race       'race',
            Toon.class      'class',
            Toon.gender     'gender',
            Toon.lvl        'lvl',
            Toon.HP         'HP',
            Toon.EP         'EP',
            Toon.CON        'CON',
            Toon.STR        'STR',
            Toon.DEX        'DEX',
            Toon.INL        'INL',
            Toon.WIS        'WIS',
            Toon.CHA        'CHA' ";
            
        $whereClause = "";
        if( !empty($requestKey) && !empty($requestVal) ){
            
            switch($requestKey){
                case "id" :
                case "name" :
                    $whereClause = "WHERE Toon." . $requestKey . " LIKE '" . $requestVal . "' LIMIT 1";
                    break;
                case "player" :  
                    $whereClause = "WHERE Plyr.handle LIKE '" . $requestVal . "' LIMIT 1";
                    break;
                case "user" : 
                    $whereClause = "WHERE Plyr." . ( is_numeric($requestVal) ? "id" : "handle") . " LIKE '" . $requestVal . "' LIMIT 1";
                    break;
                default :
                    //
                    break;
            }
        }
        
        if($requestKey == "all"){
            $compiledQuery = "SELECT " . ($requestVal == 'verbose' ? $selectClause : "Toon.name") . "
                FROM characters AS Toon 
                INNER JOIN users AS Plyr
                    ON Toon.player = Plyr.id";
        }
        elseif( !empty($requestKey) && !empty($requestVal) && $requestKey != "all" ){
            $compiledQuery = "SELECT " . $selectClause . "
                FROM characters AS Toon 
                INNER JOIN users AS Plyr
                    ON Toon.player = Plyr.id " .
                $whereClause;
        }
        
        return($compiledQuery);
    }
    
    ///// Creature
    function getCreature( $requestKey, $requestVal ){
        
        $compiledQuery = ""; // Return later...
        
        if($requestKey == "all"){
            $compiledQuery = "SELECT
                Mob.name creature_name,
                Typ.name creature_type,
                Mob.size creature_size,
                Mob.HP_base creature_health,
                Mob.AC_base creature_armor,
                Mob.AP_base creature_attack,
                Mob.HP_dice creature_hitdie
            FROM creatures AS Mob
            INNER JOIN creature_types AS Typ
                ON Mob.type = Typ.id";
        }
        elseif( !empty($requestKey) && !empty($requestVal) ){
            $compiledQuery = "SELECT
                Mob.name creature_name,
                Typ.name creature_type,
                Mob.size creature_size,
                Mob.HP_base creature_health,
                Mob.AC_base creature_armor,
                Mob.AP_base creature_attack,
                Mob.HP_dice creature_hitdie
            FROM creatures AS Mob
            INNER JOIN creature_types AS Typ
                ON Mob.type = Typ.id
            WHERE 
                Mob." . $requestKey . " LIKE '" . $requestVal . "'
            ";
        }
        
        return($compiledQuery);
    }
    
    ///// Race
    function getRace( $requestKey, $requestVal ){
        $compiledQuery = "";
        if($requestKey == "all"){
            $compiledQuery = "SELECT " . ($requestVal == 'verbose' ? "*" : "Race.name") . " FROM character_races AS Race";
        }
        elseif( !empty($requestKey) && !empty($requestVal) ){
            $compiledQuery = "SELECT *
            FROM character_races AS Race
            WHERE 
                Race." . $requestKey . " LIKE '" . $requestVal . "'
            ";
        }
        return($compiledQuery);
    }
    
    ///// Class
    function getClass( $requestKey, $requestVal ){
        $compiledQuery = "";
        if($requestKey == "all"){
            $compiledQuery = "SELECT " . ($requestVal == 'verbose' ? "*" : "Clas.name") . " FROM character_classes AS Clas";
        }
        elseif( !empty($requestKey) && !empty($requestVal) ){
            $compiledQuery = "SELECT *
            FROM character_classes AS Clas
            WHERE 
                Clas." . $requestKey . " LIKE '" . $requestVal . "'
            ";
        }
        return($compiledQuery);
    }
    
    // Get NPC
    
    // Get Spell
    
    // Get Weapon
    
    // Get Attack
    
    // RANDOM ENCOUNTER!
    
    
    //////////////////////////////////////////////////////////
    //    GET REQUEST FORMAT:                               //
    //    /{desired info}/<field key>/<field value>         //
    //    required       optional    optional               //
    //                                                      //
    //    EXAMPLE:                                          //
    //    http://www.site.com/api.php/creature/name/wolf    //
    //////////////////////////////////////////////////////////
    
    // What are we getting?
    switch($info){
        case "character" :
            $query = getCharacter($reqKey, $reqVal);
            break;
        case "npc" :
            //getNPC();
            break;
        case "creature" :
            $query = getCreature($reqKey, $reqVal);
            break;
        case "enemy" :
            //getEnemy();
            break;
        case "class" :
            $query = getClass($reqKey, $reqVal);
            break;
        case "race" :
            $query = getRace($reqKey, $reqVal);
            break;
        default :
            break;
    }
    
?>