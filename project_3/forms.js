var $dropdownOptionsSet = [0];

var $formComponentBox = [];

var $formComponentBlades = {
    "text"      : "forms.Text_Input_v1-0-1",
    "email"     : "forms.Email_Input_v1-0-1",
    "hidden"    : "forms.Hidden_Input_v1-0-1",
    "dropdown"  : "forms.Dropdown_Select_v1-0-1",
    "radio"     : "forms.Radio_Field_v1-0-1",
    "checkbox"  : "forms.Checkbox_Field_v1-0-1",
    "cta"       : "forms.Cta_Button_v1-0-1",
};

var formHiddenFields = [
    "elqFormName",              // HTML Form Name
    "s",                        // locID
    "elqCampaignId" ,           //
    "elqResponseEmail",         //
    "listLicenseID1",           //
    "listName1",                //
    "leadSourceMostRecent1",    //
    "originalCampaignCode1",    //
    "originalCampaignName1",    //
    "mSCRMLastCampaignID",      //
    "eloquaMSCRMDescription1",  //
    "retURL",                   //
];

var formAutofillFields = [
    "firstName",
    "lastName",
    "emailAddress",
    "busPhone",
    "company",
];

var formLoadTimer = null;

/***** Field Components on Export *****
    fieldtype       // Field or input type
    fieldname       // Eloqua HTML Name
    blade           // Blade Name for this component (for Chris)
    placeholder     // Display Example/Placeholder value
    importvalue     // Imported Default Value (for hidden fields)
    urlparameter    // This is filled out later! Left empty for now.
    defaultvalue    // Empty and/or Key->Value for background
    required        // Is field required for validation?
    elqrequired     // Never changes. Overrides 'required.'
    hidefield       // Manual hidden toggle later...
    autopop         // Auto-population on the backend
/**************************************/

$(document).ready(function () {

    $("button#updateFormDataSubmit").on( 'click', saveEditFormModal );
    $('#thankyou').on('click', toggleThankYouEdit);

    var formComponentBucket = $("#editFormModal .modal-body").get( 0 );
    var sortable = Sortable.create(formComponentBucket, {
        draggable: ".componentEdit",
        handle: '.dragHandle',
        animation: 500
    });


});


function getFormSkeleton(landing_page_id, form_id) {

    $.ajax(
        {
            type:           "GET",
            headers:        {
                                "Content-Type": "application/json; charset=utf-8",
                            },
            contentType:    "application/json",
            dataType:       "json",
            url:            "/landing-pages/" + landing_page_id + "/getForm/" + form_id,
        }
    ).done(function(data, textStatus, jqXHR) {
        if (data.hasOwnProperty('errors')) {
            console.log("An Error Has Occured.");
            print_message_to_screen('error', format_errors(data.errors));
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        print_message_to_screen( 'error', 'Email load error. ' + errorThrown );
        return false;

    }).success(function(data){
        skeletonObject = data;
        dataObject.content.htmlFormName = skeletonObject["htmlName"];
        var formFieldsObject = skeletonObject["elements"];
        var formFields = [];

        for( var fieldIterator = 0; fieldIterator < formFieldsObject.length; fieldIterator++ ){
            var currentFieldArray = formFieldsObject[fieldIterator];

            var inputParameters = {
                fieldtype   : "text",                               // Field or input type
                fieldname   : currentFieldArray["htmlName"],        // Eloqua HTML Name
                blade       : "",                                   // Blade Name for this component (for Chris)

                placeholder : currentFieldArray["name"],            // Display Example/Placeholder value
                importvalue : currentFieldArray["defaultValue"],    // Imported Default Value (for hidden fields)

                urlparameter: "",                                   // This is filled out later! Left empty for now.
                defaultvalue: currentFieldArray["defaultValue"],    // Empty and/or Key->Value for background

                required    : "false",                              // Is field required for validation?
                elqrequired : "false",                              // Never changes. Overrides 'required.'
                hidefield   : "false",                              // Manual hidden toggle later...
                autopop     : "false",                              // Auto-population on the backend
            };

            switch ( currentFieldArray["displayType"] ) {
                case "text":
                    inputParameters["fieldtype"] = "text";
                    break;

                case "singleSelect":
                    inputParameters["fieldtype"] = "dropdown";
                    inputParameters["importvalue"] = currentFieldArray["optionListId"];
                    break;

                case "checkbox":
                    inputParameters["fieldtype"] = "checkbox";
                    break;

                case "radio":
                    inputParameters["fieldtype"] = "radio";
                    break;

                case "submit":
                    inputParameters["fieldtype"] = "cta";
                    break;

                default:
                    break;
            }

            if( $.inArray(currentFieldArray["htmlName"], formHiddenFields ) !== -1 ){
                inputParameters["fieldtype"] = "hidden";
                inputParameters["hidefield"] = "true";
            }

            var fieldParameters = currentFieldArray["validations"];
            var fieldParametersLength = fieldParameters ? fieldParameters.length : 0;
            for( var validationParam = 0; validationParam < fieldParametersLength; validationParam++ ){
                var paramRule = fieldParameters[validationParam];
                var paramCondition = paramRule["condition"];
                switch( paramCondition.type ) {
                    case "IsRequiredCondition":
                        inputParameters["required"] = "true";
                        inputParameters["elqrequired"] = "true";
                        break;

                    case "IsEmailAddressCondition":
                        inputParameters["fieldtype"] = "email";
                        break;

                    // case "TextLengthCondition":
                    //    break;

                    // case "PreventUrlCondition":
                    //    break;

                    default:
                        break;
                }
            }

            // Defaulting the blade according to array listing...
            inputParameters["blade"] = $formComponentBlades[inputParameters["fieldtype"]];

            formFields.splice( fieldIterator, 0, inputParameters );
        }

        $formComponentBox = formFields;
        var injectFormHTML = compileFormHTML(formFields);
        contentInjection(injectFormHTML, "form");
        getDropdownOptions(landing_page_id);

        // @todo:  Find a better way to do this other than repeating it in both calls
        setTimeout(generateSidebar, 200);

        // @todo: These two need to fire in this order otherwise paragraph tags
        //        become uneditable, this needs to be decoupled
        setTimeout(enableCopyEditor, 500);
        setTimeout(enableSlideOutImageEditor, 500);

        // Add 'Form Editor' AFTER population...
        $("#form").on("click", function () {
            showEditFormModal();
        });

        saveOnFormLoad();

    }).always(function() {
        // Nothing...
    });
}

function updateFormLocalization(landing_page_id, form_id) {

    $.ajax(
        {
            type:           "GET",
            headers:        {
                                "Content-Type": "application/json; charset=utf-8",
                            },
            contentType:    "application/json",
            dataType:       "json",
            url:            "/landing-pages/" + landing_page_id + "/getForm/" + form_id,
        }
    ).done(function(data, textStatus, jqXHR) {

        if (data.hasOwnProperty('errors')) {
            print_message_to_screen('error', format_errors(data.errors));
        }

    }).fail(function(jqXHR, textStatus, errorThrown) {

        print_message_to_screen( 'error', 'Email load error. ' + errorThrown );
        return false;

    }).success(function(data){

        var $cadmusIframe = $("iframe#cadmus_template").contents();

        // Ignore dropdowns since that happens on page load
        $.each(data.elements, function () {
            switch ($(this)[0].displayType) {
                case "email":
                case "text":
                case "hidden":
                    $cadmusIframe.find("[name='" + $(this)[0].htmlName + "']").first().attr("placeholder", $(this)[0].name);
                    break;

                case "checkbox":
                    $cadmusIframe.find("[name='" + $(this)[0].htmlName + "']").first().parent().parent().find(".placeholder").text($(this)[0].name);
                    break;

                case "radio":
                    break;

                case "submit":
                    $cadmusIframe.find("[name='" + $(this)[0].htmlName + "']").first().text($(this)[0].name);
                    break;
            }
        });
    });
}


function compileFormHTML(formObject){
    var formHTML = "";                              // Empty Object to Populate
    var $formFieldNest = $(".form-component-nest"); // Blank Form Fields

    for( var fieldIterator = 0; fieldIterator < formObject.length; fieldIterator++ ){

        var currentField = formObject[fieldIterator];
        var currentFieldHTML = $formFieldNest.find('[fieldtype="' + currentField.fieldtype + '"]');

        var clonedField = currentFieldHTML.clone();

        var placeholderText = currentField.placeholder;
        if( currentField.required === "true" || currentField.required === true ){
            placeholderText = "* " + currentField.placeholder;
        }

        switch(currentField.fieldtype){

            case "text":
            case "email":
            case "hidden":
                clonedField.attr( 'name',               currentField.fieldname );
                clonedField.attr( 'elqrequired',        currentField.elqrequired );
                clonedField.attr( 'placeholder',        placeholderText );
                clonedField.attr( 'data-label-name',    placeholderText );
                break;

            case "dropdown":
                var dropdownChild = clonedField.find("select");
                var dropdownGrandchild = dropdownChild.find("option.placeholder");
                dropdownChild.attr( 'name',             currentField.fieldname );
                dropdownChild.attr( 'elqrequired',      currentField.elqrequired );
                dropdownChild.attr( 'data-label-name',  placeholderText );
                dropdownGrandchild.text( placeholderText );
                break;

            case "radio":
                // NO EXAMPLES YET! SEND HELP!
                break;

            case "checkbox":
                var checkboxChild = clonedField.find("input");
                var checkboxGrandchild = clonedField.find("label.placeholder");
                checkboxChild.attr( 'name',             currentField.fieldname );
                checkboxChild.attr( 'elqrequired',      currentField.elqrequired );
                clonedField.attr( 'data-label-name',    placeholderText );
                checkboxGrandchild.text( placeholderText );
                break;

            case "cta":
                clonedField.text( placeholderText );
                break;

            default:
                break;
        }

        if( currentField.hidefield === "true" || currentField.hidefield === true ){
            clonedField.hide();
        }

        formHTML += clonedField.prop('outerHTML') + "\n";
    }

    return formHTML;
}


function showEditFormModal(element) {
    closeSlideOutImageEditor();
    $('#editFormModal .modal-body').html( populateEditFormModal() );
    $('#editFormModal').modal('show');
    exclusiveCheckToggles( 'required', 'hidefield' );
}


function saveEditFormModal(element){
    scrapeEditFormModal()
    $("#editFormModal").modal('hide');
    delayedSaveLandingPage();
}


function populateEditFormModal(){
    var modalHTML = "";

    $.each($formComponentBox, function( index, fieldValues ){

        ///// CLONED OBJECT FOR EDITING
        var currentEditField = $('.componentEditExample').clone();
        currentEditField.attr('for', fieldValues.fieldname );

        ///// FIELD TYPE
        fieldtypeSpan = currentEditField.find("span[arrayKey='fieldtype']");
            fieldtypeSpan.attr( 'value', fieldValues.fieldtype );
            fieldtypeSpan.text( fieldValues.fieldtype + ": " );

        ///// FIELD NAME
        fieldnameSpan = currentEditField.find("span[arrayKey='fieldname']");
            fieldnameSpan.attr( 'value', fieldValues.fieldname );
            fieldnameSpan.text( fieldValues.fieldname );

        ///// PLACEHOLDER
        placeholderField = currentEditField.find("[arrayKey='placeholder']");
            placeholderField.attr( 'value', fieldValues.placeholder );

        ///// IMPORTED VALUE
        importvalueField = currentEditField.find("[arrayKey='importvalue']");
            importvalueField.attr( 'value', fieldValues.importvalue );
            if( !(fieldValues.fieldtype === "hidden") ){ importvalueField.addClass("hushnow"); }
            else{ placeholderField.addClass("hushnow"); }

        ///// URL PARAMETER
        urlparameterField = currentEditField.find("[arrayKey='urlparameter']");
            urlparameterField.attr( 'value', fieldValues.urlparameter );
            if( fieldValues.fieldtype === "dropdown" ){ urlparameterField.addClass("hushnow"); }
            if( fieldValues.fieldtype === "checkbox" || fieldValues.fieldtype === "radio" || fieldValues.fieldtype === "cta" ){
                urlparameterField.addClass("hushnow");
                placeholderField.addClass("fullwidth");
            }

        ///// DEFAULT VALUE
        defaultvalueField = currentEditField.find("[arrayKey='defaultvalue']");
            if( !(fieldValues.fieldtype === "dropdown") ){ defaultvalueField.addClass("hushnow"); }
            else{
                var optionList = $dropdownOptionsSet[fieldValues.importvalue];
                var injectOptionsHTML = "<option value='' ";
                if( fieldValues.importvalue === fieldValues.defaultvalue ){
                    injectOptionsHTML += "selected";
                }
                injectOptionsHTML += ">Default Value</option>";

                $.each( optionList, function( countryCode, countryName ){
                    injectOptionsHTML += "\n<option value='" + countryCode + "'";
                    if( fieldValues.defaultvalue === countryCode ){
                        injectOptionsHTML += " selected ";
                    }
                    injectOptionsHTML += ">" + countryName + "</option>";

                });

                defaultvalueField.html(injectOptionsHTML);
            }

        ///// REQUIRED CHECKBOX
        requiredField = currentEditField.find("[arrayKey='required']");
        requiredWrapper = requiredField.parent();
            requiredWrapper.attr('for', fieldValues.fieldname+"-required");
            requiredField.attr('id', fieldValues.fieldname+"-required");
            if( fieldValues.required === "true" || fieldValues.required === true ){ requiredField.prop('defaultChecked', true); }
            if( fieldValues.elqrequired === "true" || fieldValues.elqrequired === true || fieldValues.fieldtype === "hidden" ){
                requiredField.attr('disabled', true);
                requiredWrapper.addClass("disabledOption");
            }

        ///// HIDE FIELD CHECKBOX
        hidefieldField = currentEditField.find("[arrayKey='hidefield']");
        hidefieldWrapper = hidefieldField.parent();
            hidefieldWrapper.attr('for', fieldValues.fieldname+"-hidefield");
            hidefieldField.attr('id', fieldValues.fieldname+"-hidefield");
            if( fieldValues.hidefield === "true" || fieldValues.hidefield === true ){ hidefieldField.prop('defaultChecked', true); }
            if( fieldValues.fieldtype === "hidden" || fieldValues.elqrequired === "true" || fieldValues.elqrequired === true ){
                hidefieldField.attr('disabled', true);
                hidefieldWrapper.addClass("disabledOption");
            }

        ///// AUTO-POPULATE FIELD CHECKBOX
        autopopField = currentEditField.find("[arrayKey='autopop']");
        autopopWrapper = autopopField.parent();
            autopopWrapper.attr('for', fieldValues.fieldname+"-autopop");
            autopopField.attr('id', fieldValues.fieldname+"-autopop");
            if( fieldValues.autopop === "true" || fieldValues.autopop === true){ autopopField.prop('defaultChecked', true); }
        if( $.inArray( fieldValues.fieldname, formAutofillFields ) === -1 ){
            autopopWrapper.addClass('hushnow');
        }


        ///// SPECIAL CTA LOGIC
        if( fieldValues.fieldtype === "cta" ){
            defaultvalueField.addClass("hushnow");
            requiredWrapper.addClass("hushnow");
            hidefieldWrapper.addClass("hushnow");
            autopopWrapper.addClass("hushnow");
        }

        ///// APPEND TO HTML
        currentEditField.removeClass("componentEditExample");
        modalHTML += currentEditField.prop('outerHTML') + "\n";
    });

    return modalHTML;
}


function getDropdownOptions(landing_page_id){

    $.each($formComponentBox, function( index, fieldValues ){

        if( fieldValues.fieldtype === "dropdown" && fieldValues.importvalue != "" ){

            $.ajax(
                {
                    type:           "GET",
                    dataType:       "html",
                    url:            "/landing-pages/" + landing_page_id + "/getSelectOptions/" + fieldValues.importvalue,
                }
            ).done(function(data, textStatus, jqXHR) {
                if (data.hasOwnProperty('errors')) {
                    // ERRORS
                    console.log("An Error Has Occured. No options found for eloqua field: " + fieldID);
                    print_message_to_screen('error', format_errors(data.errors));
                }

            }).fail(function(jqXHR, textStatus, errorThrown) {
                print_message_to_screen( 'error', 'Email load error. ' + errorThrown );
                return false;

            }).success(function(data){
                var dataArray = JSON.parse(data);
                $dropdownOptionsSet[fieldValues.importvalue] = dataArray;
                return;

            }).always(function() {
                // Nothing...
            });
        }
    });
}


function exclusiveCheckToggles(arrayKey1, arrayKey2){
        
    $("input[arraykey='"+arrayKey1+"']").each( function(){
        
        var fieldIDArray = $(this).attr('id').split("-");
        var checkboxObject1 = $("input[id='" + fieldIDArray[0] + "-" + arrayKey1 + "']");
        var checkboxObject2 = $("input[id='" + fieldIDArray[0] + "-" + arrayKey2 + "']");
        
        checkboxObject1.on('change', function(){            
            if( $(this).is(":checked") ){
                checkboxObject2.prop('defaultChecked', false);
                checkboxObject2.attr('disabled', true);
                checkboxObject2.parent().addClass("disabledOption");
            }
            if( !$(this).is(":checked") ){
                checkboxObject2.attr('disabled', false);
                checkboxObject2.parent().removeClass("disabledOption");
            }
        });
        
        checkboxObject2.on('change', function(){            
            if( $(this).is(":checked") ){
                checkboxObject1.prop('defaultChecked', false);
                checkboxObject1.attr('disabled', true);
                checkboxObject1.parent().addClass("disabledOption");
            }
            
            if( !($(this).is(":checked")) ){
                checkboxObject1.attr('disabled', false);
                checkboxObject1.parent().removeClass("disabledOption");
            }
        });
    });
}

function scrapeEditFormModal(){

    // TEST
    var editedFormObject = []; // Bucket
    var fieldIterator = 0;

    $(".form-modal .modal-body .componentEdit").each( function(){

        var inputParameters = {
            fieldtype   : "",           // Field or input type
            fieldname   : "",           // Eloqua HTML Name
            blade       : "",           // Blade Name for this component (for Chris)

            placeholder : "",           // Display Example/Placeholder value
            importvalue : "",           // Imported Default Value (for hidden fields)

            urlparameter: "",           // This is filled out later! Left empty for now.
            defaultvalue: "",           // Empty and/or Key->Value for background

            required    : "",           // Is field required for validation?
            elqrequired : "",           // Never changes. Overrides 'required.'
            hidefield   : "",           // Manual hidden toggle later...
            autopop     : "",           // Auto-population on the backend
        };

        // inputParameters['fieldname'] = $(this).attr('for');

        inputParameters['fieldtype'] = $(this).find("[arrayKey='fieldtype']").attr('value');
        inputParameters['fieldname'] = $(this).find("[arrayKey='fieldname']").attr('value');
        inputParameters['blade'] = $formComponentBlades[inputParameters['fieldtype']];

        inputParameters['placeholder'] = $(this).find("[arrayKey='placeholder']").val();
        inputParameters['importvalue'] = $(this).find("[arrayKey='importvalue']").val();

        inputParameters['urlparameter'] = $(this).find("[arrayKey='urlparameter']").val();
        var defaultDropdown = $(this).find("[arrayKey='defaultvalue']");
            inputParameters['defaultvalue'] = defaultDropdown.find("option:selected").val();

        inputParameters['required'] = $(this).find("[arrayKey='required']").is(":checked");
        inputParameters['elqrequired'] = ( $(this).find("[arrayKey='required']").is(":disabled") &&  $(this).find("[arrayKey='required']").is(":checked") );
        inputParameters['hidefield'] = $(this).find("[arrayKey='hidefield']").is(":checked");
        inputParameters['autopop'] = $(this).find("[arrayKey='autopop']").is(":checked");

        editedFormObject.splice( fieldIterator, 0, inputParameters );
        fieldIterator++;
    });

    $formComponentBox = editedFormObject;
    var injectFormHTML = compileFormHTML(editedFormObject);
    contentInjection(injectFormHTML, "form");
    setTimeout(generateSidebar, 200);
}

function toggleThankYouEdit(){

    var $templateiFrame = $("iframe#cadmus_template");
    var thankyouButton = $("#thankyou");

    if ( thankyouButton.hasClass("selected-option") ){
        $templateiFrame.contents().find(" .form-container").hide();
        $templateiFrame.contents().find(" .thank-you").show();
        thankyouButton.addClass("editing-toggle");
    }
    else{
        $templateiFrame.contents().find(" .form-container").show();
        $templateiFrame.contents().find(" .thank-you").hide();
        thankyouButton.removeClass("editing-toggle");
    }
}

function saveOnFormLoad(){
    scrapeLandingPageContents();
    setWorkflowStepCompleted('form');
    delayedSaveLandingPage();
}