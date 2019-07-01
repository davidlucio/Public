/***** Global Objects! *****/
var racesObj, classesObj;
var characterObj = {
    'lvl':'1'
};
var calcTimer;

function styler(){
    // Styles the <select> section after choosing...
    $('select').each(function(){
        var selectedOption = $(this).val();
        
        $(this).on('change', function() {
                        
            if(selectedOption != 'null' || selectedOption !== "") {
                $(this).removeClass("emptySelect");
                $(this).addClass("fullSelect");
            }
            
        });
    });
}

function populateFields(){
    
    racesObj = makeAPIget('race','all','verbose');
    classesObj = makeAPIget('class','all','verbose');
    
    // Dropdown Options Clone
    var optionClone = $('option[dummyoption]');
    var dropdownRaces = $('[name=character_race]');
    var dropdownClasses = $('[name=character_class]');
    
    // Races
    for(i=0; i < racesObj.length ; i++){
        var newOption = optionClone.clone();
        newOption.html( racesObj[i].name );
        newOption.val( racesObj[i].id );
        newOption.removeAttr( 'dummyoption' );
        dropdownRaces.append(newOption);
    }

    // Classes
    for(i=0; i < classesObj.length ; i++){
        var newOption = optionClone.clone();
        newOption.html( classesObj[i].name );
        newOption.val( classesObj[i].id );
        newOption.removeAttr( 'dummyoption' );
        dropdownClasses.append(newOption);
    }
    
    // Race Change Mechanics
    dropdownRaces.on('change', function() {
        var raceVal = $(this).val();
        if(raceVal != 'null' || raceVal !== "") {
            // console.log("Race updated: " + raceVal );
            characterObj['race'] = raceVal;
            if( dropdownRaces.val() != undefined && dropdownClasses.val() != undefined ){
                statValUpdate();
            }
        }
    });
    
    // Class Change Mechanics
    dropdownClasses.on('change', function() {
        var classVal = $(this).val();
        if(classVal != 'null' || classVal !== "") {
            // console.log("Class updated: " + classVal );
            characterObj['class'] = classVal;
            if( dropdownRaces.val() != undefined && dropdownClasses.val() != undefined ){
                statValUpdate();
            }
        }
    });
    
    // Ability Score Change Mechanics
    $("input.abilityScore").each(function(){
        $(this).on('change', function() {
            if( dropdownRaces.val() != undefined && dropdownClasses.val() != undefined ){
                clearTimeout(calcTimer);
                calcTimer = setTimeout(function(){ statValUpdate(); }, 500);
            }
        });
    });
    
    return true;
}

/* Validates form contents -- LUCIOWARE TODO */
function formValidator( formContents ){
    console.log( formContents );
}

function statValUpdate(){
    
    // Grab Atrributes from Boxes
    $('div.abilityBox input.abilityScore').each(function(){
        var thisAttrName =  $(this).attr('id').split('_')[1];
        characterObj[thisAttrName] = ( ($(this).val() != '') ? $(this).val() : '0' );
    });
    
    // Grab Modifiers for Race
    var currentRaceInfo = racesObj[ characterObj['race'] - 1 ];
    characterObj['CON'] = parseInt(characterObj['CON']) + parseInt(currentRaceInfo['mod_CON']);
    characterObj['STR'] = parseInt(characterObj['STR']) + parseInt(currentRaceInfo['mod_STR']);
    characterObj['DEX'] = parseInt(characterObj['DEX']) + parseInt(currentRaceInfo['mod_DEX']);
    characterObj['INL'] = parseInt(characterObj['INL']) + parseInt(currentRaceInfo['mod_INL']);
    characterObj['WIS'] = parseInt(characterObj['WIS']) + parseInt(currentRaceInfo['mod_WIS']);
    characterObj['CHA'] = parseInt(characterObj['CHA']) + parseInt(currentRaceInfo['mod_CHA']);
    
    // Grab Modifiers for Class
    var currentClassInfo = classesObj[ characterObj['class'] - 1 ];
    var hitdie = parseInt(currentClassInfo['hitdie']);
    var manadie = parseInt(currentClassInfo['manadie']);
    
    // HP = HitDie max + CON mod
    var modCON = Math.floor( ( parseInt(characterObj['CON']) - 10) / 2 );
    characterObj['HP'] = hitdie + modCON;
    
    // MP = ManaDie Max + INL mod
    var modINL = Math.floor( ( parseInt(characterObj['INL']) - 10) / 2 );
    var manaAdept = manadie + modINL;
    characterObj['MP'] = ( ( manaAdept >= 0 ) ? manaAdept : 0 );
    
    // AC = 10 + DEX mod
    var modDEX = Math.floor( ( parseInt(characterObj['DEX']) - 10) / 2 );
    characterObj['AC'] = 10 + modDEX;
    
    // RC = 11 + WIS mod
    var modWIS = Math.floor( ( parseInt(characterObj['WIS']) - 10) / 2 );
    characterObj['RC'] = 11 + modWIS;
    
    $('div.statWrapper').each(function(){
        var statToFill = $(this).attr('id').split('-')[1];
        var statValObj = $(this).find('span.statValue');
        statValObj.text( characterObj[statToFill] );
        statValObj.attr( 'calculated', 'true' );
    });
    
}

/////
function makeAPIget(reqType, reqKey, reqVal){
    var returnResponse;
    
    if (typeof reqType === "undefined" || reqType === null) { 
        reqType = "instructions";
    }
    
    var apiURL = 'http://hardluckhero.com/resources/private/api.php/'+reqType+'/'+reqKey+'/'+reqVal;
    
    $.ajax({
        url: apiURL, 
        type: 'GET',
        async: false,
        global: false,
        dataType: 'json', 
        success: function(data) {
            returnResponse = data;
            return false;
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.log( 'Failed. Response: \n' + xhr.responseText + ',\n ' + ajaxOptions + ',\n ' + thrownError );
            return false;
        }
    });
    
    return returnResponse;
}

// LUCIOWARE TO-DO: Finish This for DB Submission. !!! Make endpoint first !!!
function makeAPIpost(){
    
}

/** DomReady Function **/
$(document).ready(function(){
    
    styler();
    populateFields();
    
    $( "form" ).on( "submit", function( event ) {
        event.preventDefault();
        // console.log( $(this).serialize() );
        formValidator( $(this).serializeArray() );
    });
    
});