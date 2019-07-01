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
            
            <h1>Character Creator</h1>
            <h2>Alpha v1.3</h2>
            
            <form id=characterCreation_1 class="characterSheet" autocomplete="off" >
                
                <input name=player_name type=text class="playerName" placeholder="Player Name" value="<?php echo $allowedUsers[$accessID]; ?>" readonly>
                <input name=player_id type=hidden class="playerID" value="<?php echo $accessID; ?>">
                
                <input name=character_name type=text placeholder="Character Name">
                
                <option value="" dummyoption></option>
                
                <select name=character_race class="emptySelect">
                    <option value="" disabled selected hidden>Race</option>
                </select>
                
                <select name=character_class class="emptySelect">
                    <option value="" disabled selected hidden>Class</option>
                </select>
                
                <fieldset>
                    <legend>Gender</legend>
                    <div class="radioWrapper">
                        <input id="genderM" type="radio" name="gender" value="M">
                        <label for="genderM">Male</label>
                    </div>
                    
                    <div class="radioWrapper">
                        <input id="genderF" type="radio" name="gender" value="F">
                        <label for="genderF">Female</label>
                    </div>
                    
                    <div class="radioWrapper">
                        <input id="genderN" type="radio" name="gender" value="N">
                        <label for="genderN">Non-binary</label>
                    </div>
                </fieldset>
                
                <info>
                    <p>
                        This section is for stat allocation and calculation. In order to properly use this section, first choose a style of rolling:
                    </p>
                    
                    <select name=stat_roller class="emptySelect">
                        <option value="" disabled selected hidden>Style of Rolling</option>
                        
                        <option value="manual" class="tooltip">
                            Manual - Manually roll and input ability points.</span>
                        </option>
                        
                        <option value="points" class="tooltip" disabled>
                            Point Buy - Allocate ability pts wherever; Max of 72 total pts; Max 16 individual pts.
                        </option>
                        
                        <option value="standard" class="tooltip" disabled>
                            Standard - Rolls 3d6, 7 times; Place highest 6 rolls wherever you like.
                        </option>
                        
                        <option value="random" class="tooltip" disabled>
                            Random - Rolls a d20 for each stat, independently.
                        </option>
                        
                        <option value="advantage" class="tooltip" disabled>
                            Advantage - Just like Random, but rolled twice; Higher value is used for each.
                        </option>
                    </select>
                </info>

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
                    
                    <fieldset class=statBox>
                        <legend>Calculated Stats</legend>
                        <div id=calc-HP class="statWrapper tooltip">
                            <span class="tooltipText">Health Points<br/>Based off CON.</span>
                            <span class="statName">HP</span>
                            <span class="statValue" calculated="false">0</span>
                        </div>
                        
                        <div id=calc-AC class="statWrapper tooltip">
                            <span class="tooltipText">Armor Class<br/>Based off DEX.</span>
                            <span class="statName">AC</span>
                            <span class="statValue" calculated="false">0</span>
                        </div>
                        
                        <div id=calc-MP class="statWrapper tooltip">
                            <span class="tooltipText">Mana Points<br/>Based off INT.<br/><i>New concept!</i></span>
                            <span class="statName">MP</span>
                            <span class="statValue" calculated="false">0</span>
                        </div>
                        
                        <div id=calc-RC class="statWrapper tooltip">
                            <span class="tooltipText">Resist Class<br/>Based off WIS.<br/><i>New concept!</i></span>
                            <span class="statName">RC</span>
                            <span class="statValue" calculated="false">0</span>
                        </div>
                        
                    </fieldset>
                    
                </div>
                
                <div class="submitButton clear">
                    <button id=submitCharacter for=characterCreation_1 class="button">I am ready!</button>
                </div>
            </form>
            
        </div>