var $advancedValuesBox = [];

$(document).ready(function () {

    $("button.update-advanced-values").on("click", function (e) {
        scrapeAdvancedModal();
        $("#editAdvancedModal").modal("hide");
        delayedSaveLandingPage();
    });

    $("#editAdvancedModal [for='LP-redirect'] input#redirectCheck:checkbox").change( function(){
        redirectOptin( $(this).is(":checked") );
    });

});

function redirectOptin( useRedirect ){
    var redirectOptionWindow = $("#editAdvancedModal [for='LP-redirect']");

    if( useRedirect ){
        redirectOptionWindow.removeClass('collapsed');
    }
    else{
        redirectOptionWindow.addClass('collapsed');
    }

}

function showEditAdvancedModal(element) {
    var lp_brand = $("iframe#cadmus_template").attr('brand');
    var advancedModal = $('#editAdvancedModal');

    var brandPlaceholder = advancedModal.find('#vanityURLbrand:first');

    switch(lp_brand) {
        case "IS":
            brandPlaceholder.html('http://engage.istockphoto.com/');
            break;

        default:
            brandPlaceholder.html('http://engage.gettyimages.com/');
            break;
    }

    closeSlideOutImageEditor();
    loadAdvancedValues();
    advancedModal.modal('show');
}

function scrapeAdvancedModal(){

    var advancedModal = $('#editAdvancedModal');
    var returnValues = {};

    advancedModal.find('input, textarea').each(function(){

        if( $(this).attr('type') === "text" || $(this).attr('type') === "textarea" ){
            returnValues[ $(this).attr('name') ] = $(this).val();
        }

        if( $(this).attr('type') === "checkbox" ){
            returnValues[ $(this).attr('name') ] = $(this).is(":checked");
        }

    });

    window.dataObject.content.advanced = returnValues;
    advancedWorkflowStatus();
    return;
}

function loadAdvancedValues() {

    $advancedValuesBox =  window.dataObject["content"]["advanced"];
    var advancedModal = $('#editAdvancedModal');

    if( !( $.isEmptyObject($advancedValuesBox) ) ){
        advancedModal.find('input, textarea').each(function(){

            if( ( $(this).attr('type') === "text" ) || ( $(this).attr('type') === "textarea" ) ){
                $(this).val( $advancedValuesBox[ $(this).attr('name') ] );
            }

            if( ( $(this).attr('type') === "checkbox" ) && ( $advancedValuesBox[ $(this).attr('name') ] === true ) ){
                $(this).prop('defaultChecked', true);
                redirectOptin( true );
            }
        });
    }

    advancedWorkflowStatus();
    return;
}

function advancedWorkflowStatus(){

    $advancedValuesBox = window.dataObject.content.advanced;
    var advancedModal = $('#editAdvancedModal');
    var completedStep = true;

    if( !( $.isEmptyObject($advancedValuesBox) ) ){
        advancedModal.find( '[requiredfield="true"]' ).each(function(){
            if( $advancedValuesBox[ $(this).attr('name') ] == "" ){
                completedStep = false;
            }
        });
    }
    else{
        completedStep = false;
    }

    if(completedStep){
        setWorkflowStepCompleted('advanced');
    }
    else{
        setWorkflowStepIncomplete('advanced');
    }
}