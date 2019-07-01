<?php 
    /***** DM DASHBOARD APPLICATION - Character Creator *****/
    //
    //  $allowedUsers[]
    //  $applicationList[]
    //  $accessID
    //  $application
    // 
    /********************************************************/
?>
        <div class=pageContainer>
            
            <h1>Character Sheet</h1>
            <h2>Alpha v1.0</h2>
            
            <pre id=infoDump></pre>
            
            <div id=characterSheet userID="<?php echo $accessID; ?>" class="characterSheet" autocomplete="off" >
                
                <div class=characterPortrait>
                    <span>
                        <img src="resources/images/heroportrait_.png">
                    </span>
                </div>
                
                <h3 class=characterName >
                    <span id=characterField-character>Character Name</span>
                    <label class=characterFieldLabel>PLAYER: <?php echo $allowedUsers[$accessID]; ?></label>
                </h3>
                
                <div class="characterData">
                    
                    <p class="characterField">
                        <span id=characterField-race>Race</span>
                        <label class=characterFieldLabel>Race</label>
                    </p>
                    
                    <p class="characterField">
                        <span id=characterField-class>Class</span>
                        <label class=characterFieldLabel>Class</label>
                    </p>
                    
                    <p class="characterField narrow">
                        <span id=characterField-lvl>Lvl</span>
                        <label class=characterFieldLabel>Lvl</label>
                    </p>
                    
                    <p class="characterField narrow">
                        <span id=characterField-gender>Gender</span>
                        <label class=characterFieldLabel>Gender</label>
                    </p>
                    
                </div>
                
                <div class="calcStatBox">
                    <div id=calc-HP class="statWrapper tooltip">
                        <span class="tooltipText">Health<br/>CON Mod.</span>
                        <span class="statValue">0</span>
                    </div>
                    
                    <div id=calc-EP class="statWrapper tooltip">
                        <span class="tooltipText">Energy<br/>Spell Mod.<br/><i>New!</i></span>
                        <span class="statValue">0</span>
                    </div>
                    
                    <div id=calc-AC class="statWrapper tooltip">
                        <span class="tooltipText">Armor<br/>DEX Mod.</span>
                        <span class="statValue">0</span>
                    </div>
                    
                    <div id=calc-RC class="statWrapper tooltip">
                        <span class="tooltipText">Resist<br/>WIS Mod.<br/><i>New!</i></span>
                        <span class="statValue">0</span>
                    </div>
                    
                    <div id=calc-SP class="statWrapper tooltip">
                        <span class="tooltipText">Speed<br/>Class +/- Gear</span>
                        <span class="statValue">0</span>
                    </div>
                    
                </div>
                
                <div class="statController">
                    
                    <div class=abilityBox>
                        <input id=attr_CON name=attr_CON type=number min="0" max="20" class="abilityScore" placeholder="CON" value="10">
                        <label for="attr_CON">CON<span class=modifier></span></label>
                        
                        <input id=attr_STR name=attr_STR type=number min="0" max="20" class="abilityScore" placeholder="STR" value="10">
                        <label for="attr_STR">STR</label>
                        
                        <input id=attr_DEX name=attr_DEX type=number min="0" max="20" class="abilityScore" placeholder="DEX" value="10">
                        <label for="attr_DEX">DEX</label>
                        
                        <input id=attr_INL name=attr_INL type=number min="0" max="20" class="abilityScore" placeholder="INT" value="10">
                        <label for="attr_INL">INT</label>
                        
                        <input id=attr_WIS name=attr_WIS type=number min="0" max="20" class="abilityScore" placeholder="WIS" value="10">
                        <label for="attr_WIS">WIS</label>
                        
                        <input id=attr_CHA name=attr_CHA type=number min="0" max="20" class="abilityScore" placeholder="CHA" value="10">
                        <label for="attr_CHA">CHA</label>
                    </div>

                </div>
                
                <br class="clear" />
                
            </div>
            
        </div>