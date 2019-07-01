<?php
    $tables = [
        '{tablename}' => [
            'columns' => [
                '{column_name}',
                '{column_name}',
                '{column_name}'
            ],
            'joins' => [
                '{this_column}' => '{shorthand}.{column_name}',
                '{this_column}' => '{shorthand}.{column_name}',
                '{this_column}' => '{shorthand}.{column_name}'
            ]
        ],
        
        'characters' => [
            'columns' => [
                'id',
                'player',
                'name',
                'gender',
                'race',
                'class',
                'lvl',
                'HP',
                'CON',
                'STR',
                'DEX',
                'INL', // Intellect
                'WIS',
                'CHA',
                'date_created'
            ],
            'joins' => [
                '{this_column}' => '{shorthand}.{column_name}',
                '{this_column}' => '{shorthand}.{column_name}',
                '{this_column}' => '{shorthand}.{column_name}'
            ]
        ],
        
        'character_races' => [
            'columns' => [
                'id',
                'name',
                'size',
                'mod_CON',
                'mod_STR',
                'mod_DEX',
                'mod_INL', // Intellect
                'mod_WIS',
                'mod_CHA',
                'traits'
            ],
            'joins' => []
        ],
        
        '{tablename}' => [
            'columns' => [
                '{column_name}',
                '{column_name}',
                '{column_name}'
            ],
            'joins' => [
                '{this_column}' => '{shorthand}.{column_name}',
                '{this_column}' => '{shorthand}.{column_name}',
                '{this_column}' => '{shorthand}.{column_name}'
            ]
        ]
        
    ];
    
    /**********/
    foreach ($tables as $key => $value){
        echo "<h1>" . $key . "</h1>";
        foreach($tables[$key] as $property => $propval){
            
            if( is_array($propval) && count($propval) ){
                echo "<p>" . $property . " (" . count($propval) . "):</p><pre>";
                var_dump($propval);
                echo "</pre>";
            }
            elseif( (is_array($propval) && !count($propval)) || ( !is_array($propval) && empty($propval) ) ){
                echo "<p>" . $property . "  (0)";
            }
            else{
                echo "<p>" . $property . " = " . $propval . "</p>";
            }
            
            echo "<br/>";
        }
    }
    /**********/
    
?>