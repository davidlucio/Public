var appName = 'cadmus';
var saveLandingPageTimeout = null;
var saveScrapeLPTimeout = null;

var copyPlaceholderText     = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
var imagePlaceholderSrc     = "http://placehold.it/300x400";
var imagePlaceholderLink    = "http://gettyimages.com";

// Creating Landingpage DataObject
window.dataObject = {
    eloqua_id        : null,
    content          : {
        layout: "normal",
        background_image : "",
        social : [ "facebook", "twitter", "instagram", "linkedin" ],
        pageType: "",
        htmlFormName: "",
        thankYou: [],
        advanced: [],
    },
    components       : [],
};

// Array of hidden form fields
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

var resizeTimeout;

/**
 * Defines the save button id and copy to toggle when there are pending changes to the asset.
 * Required by editor.js for the setPendingChangesForLandingPage function.
 * @return void
 */
var saveButtonMeta = {
    'buttonId'  : '#savePage',
    'buttonLabel' : '#savePage .bLabel',
    'buttonCopy': {
        'saved'   : 'Nothing new to save',
        'unSaved' : 'Save changes (!)',
     },
};


var sidebarElements = {};

$(document).ready(function() {
    var $cadmusIframe = $("iframe#cadmus_template")
    var landingPageID = $cadmusIframe.attr("landingPageID");

    $('#loader').fadeOut();

    collapseMainMenu();

    //toggle_export_capability();

    disableCtas();

    /*
    $(window).on('beforeunload', function() {
        setLeavePageTimeout();
    });
    */

    $('body').on('click', function() {
        setEditorTextValidation();
    });

    $('#imageFileField').on('change', function() {
        validateImage(this);
    });

    $("input[name=ogURL]").on("keyup", function() {
        if ($(this).val() === "" || validateURL($(this).val())) {
            $(".advanced-modal span.social-sharing-url-error").hide();
            $("button.update-advanced-values").prop("disabled", false);
        } else {
            $(".advanced-modal span.social-sharing-url-error").show();
            $("button.update-advanced-values").prop("disabled", true);
        }
    });

    $('#editContentModal').on('hidden.bs.modal', function (e) {
        if ($('#editContentModal #contentToEdit').data('froala.editor')) {
            $('#editContentModal #contentToEdit').froalaEditor('destroy');
        }
    });

    $('div.options').on('click', function (event) {
        $eventTarget = $(event.target).closest(".option-container");
        if ($eventTarget !== undefined) {
            openSidebarOptions($eventTarget);
            toggleThankYouEdit(); // Only Triggers view if Thank You is focused...
            showSelectedEditor($eventTarget.attr("data-editor-type"), $eventTarget.attr("data-editor-id"));
        }
    });

    $('#editContentModal textarea').on("save:copy", function (event, $element) {
        saveAndUpdateComponents('copy', $element);
    });

    $('.imageFileTab').on("save:image", function (event, $element) {
        saveAndUpdateComponents('image', $element);
    });

    $("a#exportPage").on("export:complete", function (event) {
        hideExportLoading();
    });

    $("#savePage").on('click', saveLandingPage);

    $cadmusIframe.load(function() {
        setLayout($cadmusIframe);
        generateSidebar();

        // @todo: These two need to fire in this order otherwise paragraph tags
        //        become uneditable, this needs to be decoupled
        enableCopyEditor();
        enableSlideOutImageEditor(false);

        if ($cadmusIframe.attr("data-retranslate") !== undefined) {
            // @todo:  deal with the fact that the data object attribute
            //         might not exist
            updateFormLocalization(landingPageID, dataObject.content["form-select"]);
        }

        activateResizeCadmusFrame();
    });

    var iframeLandingPageContent = $cadmusIframe.attr("data-landing-page-content");
    if (iframeLandingPageContent !== undefined) {
        window.dataObject = JSON.parse(iframeLandingPageContent);

        $formComponentBox = [];
        $.each([0, 1, 2], function (index) {
            $.each(window.dataObject.components[index], function () {
                if ($(this)[0].name.substr(0,6) === "forms.") {
                    $formComponentBox.push($(this)[0].content);
                }
            });
        });

        getDropdownOptions(landingPageID);

        if ($formComponentBox.length > 0) {
            // Add 'Form Editor' AFTER population...
            $("#form").on("click", function () {
                showEditFormModal();
            });
            setWorkflowStepCompleted('form');
        }

        setWorkflowStepCompleted('social');

        findCurrentStep();
        loadAdvancedValues();
    }

    $("#downloadZip").on('click', function (e) {
        downloadAsset('landing-pages', $("iframe#cadmus_template").attr("landingPageID"));
    });

    // Add the options for the confirm modal since the button is otherwise
    // shared with the email builder
    $("#exportPage").attr("data-toggle", "modal");
    $("#exportPage").attr("data-title", "Export Landing Page To Eloqua");
    $("#exportPage").attr("data-message", "Are you sure you want to export this landing page to Eloqua?");
    $("#exportPage").attr("data-button-text", "Export");
    $("#exportPage").attr("data-button-class", "btn-primary");

    $("#exportPage").on("click", function(e) {
        e.preventDefault();

        setModalData($(this), $("#confirmExportModal"), false);
        $("#confirmExportModal").modal("show");
    });

    $('#confirmExportModal').find('#modal-confirm-button').on('click', function() {
        $('#confirmExportModal').modal("hide");
        showExportLoading();
        exportAsset("landing-pages", $("iframe#cadmus_template").attr("landingPageID"));
    });
});

function setLayout($cadmusIframe) {
    var $formContainer = $cadmusIframe.contents().find(".form-container");

    if ($formContainer.hasClass("narrow-layout")) {
        window.dataObject.content.layout = "narrow";
    } else {
        window.dataObject.content.layout = "wide";
    }
	// TO-DO: Create New Layout for "Normal" vs "Wide"
}

function saveAndUpdateComponents(elementType, $element) {
    var sidebarElement = $.grep(sidebarElements[elementType], function(e) { return e.editor_id == $element.attr("id"); });

    delayedScrapeLandingPageContents();
    delayedSaveLandingPage();
    activateResizeCadmusFrame();

    if (!(elementType === "copy" && isCopyUsingPlaceholder($element))) {
        setWorkflowStepCompleted(sidebarElement[0].sidebar_id);
    }
}

function findCurrentStep() {
    // @todo: This needs to not be so rigid and hardcoded
    // ALSO: Be sure to change the way this goes BACKWARDS when editing!

    if (!(window.dataObject.content.pageType)) {
        disableSidebar($("#type .option-header"));
        toggleWorkflowContent('type');
    } else {
        setPageTypeActive();
        workFlowStepOneConfirm(dataObject.content.pageType, false, function () {
            if ((window.dataObject.content.pageType !== "form" && window.dataObject.content.template)
                || (window.dataObject.content.pageType === "form" && window.dataObject.content.template && window.dataObject.content["form-select"])
            ) {
                setTemplateActive();
                workFlowAdvance(true);
                if (window.dataObject.content.pageType === "form") {
                  setFormRowActive();
                }
                workFlowAdvance(true);
                enableSidebar();
            }

            updateExportStatus();
            activateResizeCadmusFrame();
        });
    }
}

function setPageTypeActive() {
    $("div#pageType a#" + window.dataObject.content.pageType + " img").addClass("active");
    enableWorkflowNextButton("pageType");
}

function setTemplateActive() {
    $("div#template a#" + window.dataObject.content.template + ", div#template a#" + window.dataObject.content.template + " img").addClass("active");
    enableWorkflowNextButton("template");
}

function setFormRowActive() {
    if (window.dataObject.content.pageType === "form") {

        if ($.fn.dataTable.fnTables().length > 0) {
            $("div#form-select_wrapper a#" + window.dataObject.content["form-select"]).closest("tr").addClass("active");
        } else {
            setTimeout(setFormRowActive, 500);
        }
    }
}

function contentInjection(contentHTML, contentType){
    var $templateiFrame = $("iframe#cadmus_template");

    if( contentType == "form" ){
        $templateiFrame.contents().find("#injectForm").html(contentHTML);
    }
    if( contentType == "template" ){
        var iframeDoc = document.getElementById('cadmus_template').contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(contentHTML);
        iframeDoc.close();
    }

    delayedScrapeLandingPageContents();
	delayedSaveLandingPage();
    activateResizeCadmusFrame();
    return;
}

function getTemplateSkeleton(templateName) {

    // This function will wipe out all existing form data on the page, and replace the form element within the template.
    var landingPageID = $("iframe#cadmus_template").attr("landingPageID");
    disableSidebar();

    $.ajax(
        {
            type:           "GET",
            dataType:       "html",
            url:            "/landing-pages/" + landingPageID + "/getTemplate/" + templateName,
        }
    ).done(function(data, textStatus, jqXHR) {
        if (data.hasOwnProperty('errors')) {
            // ERRORS
            console.log("An Error Has Occured.");
            print_message_to_screen('error', format_errors(data.errors));
        }

    }).fail(function(jqXHR, textStatus, errorThrown) {
        print_message_to_screen( 'error', 'Email load error. ' + errorThrown );
        return false;

    }).success(function(data){
        // @todo:  Figure out how to handle reprocessing data in the
        //         components columns when we change templates
        window.dataObject.components = [];

        resultHTML = data;
        contentInjection( resultHTML, "template" );
		delayedSaveLandingPage();
        setTimeout(generateSidebar, 200);

        // @todo: These two need to fire in this order otherwise paragraph tags
        //        become uneditable, this needs to be decoupled
        setTimeout(enableCopyEditor, 500);
        setTimeout(function () {
            enableSlideOutImageEditor(false);
        }, 500);

        return;

    }).always(function() {
        enableSidebar();
    });
}

function activateResizeCadmusFrame(){
    // Clears the timeout actions, THEN fires the resize again...
    var iframeDoc = document.getElementById('cadmus_template');
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function(){
        resizeiFrame(iframeDoc);
    }, 200);
}

function resizeiFrame(element) {
    // NOTE: scrollHeight was displaying the incorrect value after the initial iFrame resize.
    var offsetHeight = 65;
    var iframeContentHeight = element.contentWindow.document.body.clientHeight + offsetHeight;
    element.height = iframeContentHeight + "px";
}

function generateSidebar() {
    var $cadmusIframe = $("iframe#cadmus_template").contents();
    var $firstEditorCategory = $("#template").next();

    resetSidebar();
    addSidebarSubOptions($cadmusIframe);
    removeUnusedSidebarHeaders($cadmusIframe);
    updateAllParentMenuOptions();
    updateExportStatus();

    $("#advanced").on("click", function () {
        showEditAdvancedModal();
    });

    openSidebarOptions($firstEditorCategory);
}

function resetSidebar() {
    sidebarElements = {
        copy:       [],
        image:      [],
        thankYou:   [],
    };

    $(".sub-option").off("mouseenter.landingpage_sidebar mouseleave.landingpage_sidebar");
    $(".sub-options").empty();
}

function disableSidebar(allowedElements) {
    var $disabledElements = $(".option-container, .option-header, .sub-option");
    if (allowedElements !== undefined) {
        $disabledElements = $disabledElements.not(allowedElements);
    }
    $disabledElements.css("pointerEvents", "none");
}

function enableSidebar() {
    $(".option-container, .option-header, .sub-option").css("pointerEvents", "auto");
}

function addSidebarSubOptions($cadmusIframe) {
    var $sidebarCopyOptionContainer = $("div#copy div.sub-options");
    var $sidebarImageOptionContainer = $("div#images div.sub-options");
    var $sidebarThankYouOptionContainer = $("div#thankyou div.sub-options");

    createStaticSubOptions($cadmusIframe, $sidebarImageOptionContainer);

    $cadmusIframe.find(".editContent, .editImage, .editSocial, .editSharing").each(function () {

        var $editorElement = $(this);
        var $editorParent = $(this).parent();

        if ($editorElement.hasClass('editContent') && !($editorParent.hasClass('editThankYou')) ) {
            createSidebarEntry($editorElement, 'copy', $sidebarCopyOptionContainer);
        } else if ($editorElement.hasClass('editImage')) {
            createSidebarEntry($editorElement, 'image', $sidebarImageOptionContainer);
        } else if ($editorElement.hasClass('editContent') && $editorParent.hasClass('editThankYou') ) {
            createSidebarEntry($editorElement, 'copy', $sidebarThankYouOptionContainer);
        } else if ($editorElement.hasClass('editSocial')) {
            $("#social").unbind('click');
            $("#social").on("click", function () {
                showEditSocialModal();
            });
        } else if ($editorElement.hasClass('editSharing')) {
            scrapeSharingOptions($editorElement);
            $("#social").unbind('click');
            $("#social").on("click", function () {
                showEditSocialModal();
            });
        }

        $editorElement.off('mouseenter.landingpage_sidebar mouseleave.landingpage_sidebar');
        $editorElement.on('mouseenter.landingpage_sidebar mouseleave.landingpage_sidebar', function () {
            $editorElement.toggleClass('highlight-option');
        });
    });
}

function createStaticSubOptions($cadmusIframe, $sidebarImageOptionContainer) {
    var $backgroundImage = $cadmusIframe.find("body").css("background-image");

    // background image
    $sidebarImageOptionContainer.append(
        "<div class=\"sub-option\" id=\"background-image\">Background Image</div>"
    );

    $("#background-image").on("click", function (e) {
        var backgroundImage = $backgroundImage.replace(/^url\(['"](.+)['"]\)/, '$1');

        e.stopPropagation();

        openSlideOutImageEditor(backgroundImage, null, null, null, null, false, saveAndDisplayBackgroundImage);
    });

    if ($backgroundImage !== "none") {
        setWorkflowStepCompleted("background-image");
    }
}

function saveAndDisplayBackgroundImage() {
    var has_errors = false;
    var $cadmusIframe = $("iframe#cadmus_template").contents();
    var backgroundImage = $cadmusIframe.find("body").css("background-image").replace(/^url\(['"](.+)['"]\)/, '$1');

    var uploadImageCallbackFunction = function done(data, textStatus, jqXHR){
        if( data.code == 1 ) {

            //success
            $cadmusIframe.find("body").css("background-image", "url(" + data.response + ")");
            window.dataObject.content.background_image = data.response;
            setWorkflowStepCompleted("background-image");
            delayedSaveLandingPage();

            //reset the file upload
            $('.imageFileTab').find('a.fileinput-exists').click();
            return true;

        } else if( data.code == 0 ) {
            print_message_to_screen( 'error', 'Something went wrong: ' + data.response );
            return false;
        }
    }

    //do we need to upload an image?
    if ($('input#imageFileField').val() != '') {
        has_errors = uploadImage(uploadImageCallbackFunction);


        if( !has_errors ){
            // add the image to the background
            $cadmusIframe.find("body").css("background-image", "url(" + $('input#internalLinksCustom').val() + ")");
            window.dataObject.content.background_image = $('input#internalLinksCustom').val();
            setWorkflowStepCompleted("background-image");
        }

    } else {
        //no image to upload, just a SRC change
        if ($('input#imageURL').val() != '' && $('input#imageURL').val() != backgroundImage) {

            show_imgpro_loader();

            jQuery.ajax({
                url: "/image/processor",
                type: "GET",
                data: {
                    "id": $('input#imageURL').val(),
                },
                headers: {
                    "Authorization": "Basic SW1hZ2VEb3ROZXRAZ2V0dHlpbWFnZXMuY29tOlJlbWVtYmVyMSE=",
                },
            })
            .done(function(data, textStatus, jqXHR) {
                var obj = JSON.parse(data);

                if( obj.errors ){
                    print_message_to_screen( 'error', "HTTP Request Failed" + obj.errors );
                    has_errors = true;
                    hide_imgpro_loader(false);
                    return;
                }

                function waiting_for_image() {
                    $.get(obj.image_links.desktop_retina)
                        .done(function() {
                            // Do something now you know the image exists.
                            $cadmusIframe.find("body").css("background-image", "url(" + obj.image_links.desktop_retina + ")");
                            window.dataObject.content.background_image = obj.image_links.desktop_retina;
                            setWorkflowStepCompleted("background-image");
                            delayedSaveLandingPage();
                            hide_imgpro_loader(false);

                        }).fail(function() {
                            // Image doesn't exist yet
                            setTimeout(
                                function(){
                                    waiting_for_image();
                                },
                                 1000
                             )
                        })
                }

                waiting_for_image();
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.log("HTTP Request Failed");
                print_message_to_screen( 'error', "HTTP Request Failed" + errorThrown );
                has_errors = true;
                hide_imgpro_loader();
            })
        } else {

            //applyImageEditorFieldValues($el);

        }
    }

    $('#detailsAppliedMessage').fadeIn(600, function(){
        if( has_errors === false ){

            print_message_to_screen( 'success', $('#detailsAppliedMessage').text() );

        }
        closeSlideOutImageEditor();
    });
}

function createSidebarEntry($editorElement, sidebarItemType, $sidebarOptionsContainer) {
    var count               = sidebarElements[sidebarItemType].length + 1;
    var id_string           = sidebarItemType + "-" + count;
    var sidebar_id_string   = "sidebar-" + id_string;
    var editor_id_string    = $editorElement.id !== undefined ? $editorElement.id : "editor-" + id_string;
    var elementLabel        = $editorElement.attr("data-label-name");
    var sidebar_label       = elementLabel !== undefined ? elementLabel : (capitalizeFirstLetter(sidebarItemType) + " " + count);
    var $sidebarSubOption   = null;

    $sidebarOptionsContainer.append(
        "<div class=\"sub-option\" id=\"" + sidebar_id_string + "\">"
            + sidebar_label
        + "</div>"
    );

    $sidebarSubOption = $("#" + sidebar_id_string);

    $editorElement.attr('id', editor_id_string);
    sidebarElements[sidebarItemType].push({
        sidebar_id: sidebar_id_string,
        editor_id:  editor_id_string,
    });

    $sidebarSubOption.on('mouseenter.landingpage_sidebar mouseleave.landingpage_sidebar', function () {
        $editorElement.toggleClass('highlight-option');
    });

    $sidebarSubOption.on('click', function (e) {
        e.stopPropagation();
        $editorElement.click();
    });

    // @todo:  This is fragile, need to come up with a better
    //         way of tracking placeholders
    switch (sidebarItemType) {
        case "copy":
            if ($editorElement.html().trim() !== copyPlaceholderText) {
                setWorkflowStepCompleted(sidebar_id_string);
            }
            break;

        case "image":
            if ($editorElement.attr("src") !== imagePlaceholderSrc
                && $editorElement.parent().attr("href") !== imagePlaceholderLink
            ) {
                setWorkflowStepCompleted(sidebar_id_string);
            }
            break;
    }
}

function removeUnusedSidebarHeaders($cadmusIframe) {

    // LUCIOWARE Social Links & Sharing
    if ($cadmusIframe.find(".editSocial, .editSharing").length === 0) {
        $("#social").hide();
        $("#social").off("click");
    } else {
        // Links Sub Category
        if ($cadmusIframe.find(".editSocial").length === 0) {
            $("#editSocialModal [for='LP-socialLinks']").hide();
        } else {
            $("#editSocialModal [for='LP-socialLinks']").show();
        }

        // Sharing Sub Category
        if ($cadmusIframe.find(".editSharing").length === 0) {
            $("#editSocialModal [for='LP-socialSharing']").hide();
        } else {
            $("#editSocialModal [for='LP-socialSharing']").show();
        }

        $("#social").show();
        $("#social").on("click", function () {
            showEditSocialModal();
        });
    }

    if (window.dataObject.content.pageType !== "form") {
        $("#thankyou").hide();
        $("#thankyou").off("click");
    } else {
        $("#thankyou").show();
        $("#thankyou").on("click", function () {
            toggleThankYouEdit()
        });
    }

    // Redirect - FORM ONLY
    if ($cadmusIframe.find("#injectForm").length === 0) {
        $(".option-container#form").hide();
        $("#editAdvancedModal [for='LP-redirect']").hide();
    } else {
        $(".option-container#form").show();
        $("#editAdvancedModal [for='LP-redirect']").show();
    }
}

function scrapeLandingPageContents() {
    $cadmusIframe = $("iframe#cadmus_template").contents();
    window.dataObject.components = [];

    $cadmusIframe.find(".headline.content-header").each(function() {
        window.dataObject.content.headline = $(this).text();
    });

    $cadmusIframe.find(".landing-page-column").each(function() {
        var columnId = $(this).attr("column-id");
        window.dataObject.components[columnId] = [];

        $(this).find(".editContent, .editImage, .editForm, .editSharing").each(function() {
            if ($(this).hasClass("editContent")) {
                window.dataObject.components[columnId].push({
                    name:       "Copy_v1-0-0",
                    content:    {
                        copy:   $(this).html().replace( /\s+/g ," "),
                    }
                });
            } else if ($(this).hasClass("editImage")) {
                window.dataObject.components[columnId].push({
                    name:   "Image_Link_v1-0-0",
                    content: {
                        src:        $(this).attr("src"),
                        link:       $(this).parent().attr("href"),
                        title:      $(this).attr("title"),
                        alt:        $(this).attr("alt"),
                        height:     $(this).attr("height"),
                        width:      $(this).attr("width"),
                        asset_id:   $(this).attr("data-assetid")
                    }
                });
            } else if ($(this).hasClass('editForm')) {
                $.each($formComponentBox, function (componentIndex, componentContent) {
                    window.dataObject.components[columnId].push({
                        name: componentContent.blade,
                        content: componentContent
                    });
                });
            } else if ($(this).hasClass("editSharing")) {

                $(this).find("a").each(function() {
                    var sharePlatform = $(this).attr('platform');
                    if( $(this).hasClass('share-active') ){
                        $shareStatusBucket[sharePlatform] = true;
                    }
                });

                window.dataObject.components[columnId].push({
                    name:   "Sharing_v1-0-0",
                    content: $shareStatusBucket
                });
            }
        });
    });

    window.dataObject.content.frontSocial = false;
    window.dataObject.content.thanksSocial = false;
    window.dataObject.content.frontLegal = false;
    window.dataObject.content.thanksLegal = false;
    $cadmusIframe.find(".editSocial, .editLegal").each(function() {
        var parentDiv = $(this).parent();

        if($(this).hasClass("editSocial")) {
            if( parentDiv.hasClass("form-container") ){
                window.dataObject.content.frontSocial = true;
            }
            if( parentDiv.hasClass("thank-you") ){
                window.dataObject.content.thanksSocial = true;
            }
        }
        else if($(this).hasClass("editLegal")) {
            if( parentDiv.hasClass("form-container") ){
                window.dataObject.content.frontLegal = true;
            }
            if( parentDiv.hasClass("thank-you") ){
                window.dataObject.content.thanksLegal = true;
            }
        }
    });

    $("iframe#cadmus_template").contents().find(".editThankYou").each(function() {
        // @TODO: Fix this?
        window.dataObject.components[99] = [];

        $(this).find(".editContent, .editImage").each(function() {
            if ($(this).hasClass('editContent') && $(this).hasClass('header') ) {
                window.dataObject.components[99].push({
                    name:       "Headline_Reveal_v1-0-0",
                    content:    {
                        copy:   $(this).html().replace( /\s+/g ," "),
                    }
                });
            } if ($(this).hasClass('editContent') && !($(this).hasClass('header')) ) {
                window.dataObject.components[99].push({
                    name:       "Copy_v1-0-0",
                    content:    {
                        copy:   $(this).html().replace( /\s+/g ," "),
                    }
                });
            } else if ($(this).hasClass('editImage')) {
                window.dataObject.components[99].push({
                    name:   "Image_Link_v1-0-0",
                    content: {
                        src:    $(this).attr('src'),
                        link:   $(this).parent().attr('href'),
                        title:  $(this).attr('title'),
                        alt:    $(this).attr('alt'),
                        height: $(this).attr('height'),
                        width:  $(this).attr('width')
                    }
                });
            }
        });
    });
}

function delayedScrapeLandingPageContents() {
    if (saveScrapeLPTimeout) {
        clearTimeout(saveScrapeLPTimeout);
    }
    // setPendingChangesForLandingPage(true);
    saveScrapeLPTimeout = setTimeout(
        function () {
            scrapeLandingPageContents();
        },
        1000
    );
}

function saveLandingPage() {
    $.ajax(
        {
            type:           "POST",
            contentType:    "application/json; charset=utf-8",
            dataType:       "json",
            url:            "/landing-pages/" + $("#landing-page-id").val() + "/update",
            data:           JSON.stringify(window.dataObject)
        }
    ).done(function(data, textStatus, jqXHR) {
        if (data.hasOwnProperty('errors')) {
            // @todo:  Fix this to actually print out the errors once I figure
            //         out how validation errors are being sent back, may end
            //         up being the same format function as the emails
            // print_message_to_screen('error', format_email_module_errors(data.errors));
            print_message_to_screen('error', 'errors go here');
        }
        else {
            print_message_to_screen( 'success', 'Landing Page Updated' );
            setPendingChangesForLandingPage(false);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        print_message_to_screen( 'error', 'Landing page save error. ' + errorThrown );
    });
}

function delayedSaveLandingPage() {
    if (saveLandingPageTimeout) {
        clearTimeout(saveLandingPageTimeout);
    }
    setPendingChangesForLandingPage(true);
    saveLandingPageTimeout = setTimeout(
        function () {
            saveLandingPage();
        },
        2000
    );
}

function setLeavePageTimeout() {
    timeout = setTimeout(function() {
        $('#loader').fadeOut();
    }, 2000);

    if (pendingChanges) {
        return "You have unsaved changes on this page. Do you want to leave this page and discard your changes or stay on this page?";
    }
}

/***** Probably won't need this *****/
function disableCtas() {
    $('#updateCtaInFrameSubmit').addClass('disabled');
    $('button#updateCtaInFrameSubmit').prop("disabled",true);
}

function toggleWorkflow() {
    $("#landing-page-workflow-container, #landing-page-editor").toggle();
}

function toggleWorkflowContent(workflowContentId) {
    $("#landing-page-workflow-container div.content").hide();
    $("#landing-page-workflow-container div#" + workflowContentId).show();
}

function openSidebarOptions($selectedOption) {
    var $subOptions = $selectedOption.find('.sub-options');
    var currentlyOpen = false;

    $('.selected-option').removeClass('selected-option');
    $selectedOption.addClass('selected-option');

    $('.sub-options').not($subOptions).hide();
    $subOptions.toggle();
}

function showSelectedEditor(selectedEditor, selectedEditorId) {
    if (selectedEditor === 'workflow') {
        if ($("#landing-page-workflow-container").css('display') === 'none') {
            toggleWorkflow();
        }
        toggleWorkflowContent(selectedEditorId);
    } else if (selectedEditor === 'editor') {
        if ($("#landing-page-editor").css('display') === 'none') {
            toggleWorkflow();
        }
        activateResizeCadmusFrame();
    }
}

function setWorkflowStepCompleted(workflowId) {
    var $menuElement = $('.options div#' + workflowId + ' > div, .options .sub-options #' + workflowId);
    $menuElement.addClass('completed-option');
    updateParentMenuOption($menuElement);
    updateExportStatus();
}

function setWorkflowStepIncomplete(workflowId) {
    var $menuElement = $('.options div#' + workflowId + ' > div, .options .sub-options #' + workflowId);
    $menuElement.removeClass('completed-option');
    updateParentMenuOption($menuElement);
    updateExportStatus();
}

function updateParentMenuOption($menuElement) {
    if ($menuElement.hasClass("sub-option")) {
        if ($menuElement.parent().children().not(".completed-option").length === 0) {
            var $optionHeader = $menuElement.parent().parent();
            setWorkflowStepCompleted($menuElement.parent().parent().attr("id"));
        } else {
            setWorkflowStepIncomplete($menuElement.parent().parent().attr("id"));
        }
    }
}

function updateAllParentMenuOptions() {
    $(".option-container").each(function () {
        var workflowStepId = $(this).attr("id");

        if (workflowStepId === "advanced") {
            if (window.dataObject.content.advanced
                && window.dataObject.content.advanced.pagetitle
                && window.dataObject.content.advanced.vanityurl
            ) {
                setWorkflowStepCompleted(workflowStepId);
            } else {
                setWorkflowStepIncomplete(workflowStepId);
            }
        } else {
            if ($(this).find(".sub-option").not(".completed-option").length === 0) {
                setWorkflowStepCompleted(workflowStepId);
            } else {
                setWorkflowStepIncomplete(workflowStepId);
            }
        }
    });
}

function updateExportStatus() {
    if ($(".option-header").not(".completed-option").length === 0) {
        $("a#exportPage, a#downloadZip").removeClass("disabled");
    } else {
        $("a#exportPage, a#downloadZip").addClass("disabled");
    }
}

function hideExportLoading() {
    var $exportButton = $("a#exportPage");
    $exportButton.removeClass("disabled loading");
    $exportButton.find("i.fa-spinner").remove();
}

function showExportLoading() {
    $("a#exportPage").addClass("disabled");
    $("a#exportPage span.spinner-container").append('<i class="fa fa-spinner fa-spin button-spinner"></i>');
}

function workFlowStepOneConfirm(pageType, allowSave, callbackFunction) {
    if (pageType === undefined) {
        if (dataObject.content.pageType !== $("a img.active").parent().attr("id")) {
            dataObject.content.template = null;
            dataObject.content["form-select"] = null;
        }
        dataObject.content.pageType = $("a img.active").parent().attr("id");
    }

    disableSidebar();

    if (allowSave !== false) {
        delayedSaveLandingPage();
    }

    $("#landing-page-workflow-container").hide();
    $('#loader').fadeIn();

    $.ajax(
    {
        type:           "GET",
        headers: {
                        "Content-Type": "application/json; charset=utf-8",
        },
        contentType:    "application/json",
        dataType:       "json",
        url:            "/landing-pages/workflow/" + dataObject.content.pageType,
    }).done(function(data, textStatus, jqXHR) {
        $('#loader').fadeOut();
        $("#landing-page-workflow-container").show();

        if (data.hasOwnProperty('errors')) {
            // ERRORS
            console.log("An Error Has Occured.");
            print_message_to_screen('error', format_errors(data.errors));
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        print_message_to_screen( 'error', 'Email load error. ' + errorThrown );

    }).success(function(data){
        if ( ! data.hasOwnProperty('errors')) {
            injectMarkUp(data);

            // This is terrible but works for development phase. Once we confirm the flow then i will relocate this.
            //$.getScript( document.location.origin + '/js/datatables.js');
            initDataTable($('#form-select'), {
                "order": [[ 1, "desc" ]]
            });

            setWorkflowStepCompleted('type');
            $('html,body').scrollTop(0);

            enableSidebar();
            disableSidebar($("#type .option-header, #template .option-header"));

            if (callbackFunction !== undefined) {
                callbackFunction();
            }
        }
    });
}

function injectMarkUp(data) {

    if (data["view"] !== undefined) {
        $("#landing-page-workflow").html(data["view"]);
    }

    var allViews = $('.workflow-content');
    var firstView = $('#landing-page-workflow .workflow-content')[0];

    $(allViews).hide();
    $(firstView).show();

    workFlowFormSelectListener(firstView.id);
    workFlowClickListener(firstView.id);
}

function workFlowFormSelectListener(workflowId){

    $('.single-form a').click( function( elm, idx ){

        // Preventing the browser from following the src='#' on click
        elm.preventDefault();

        // Dynamically identifying selection in case we have multiple items using this view
        var objectKey = elm.currentTarget.offsetParent.parentNode.parentNode.parentNode.id;

        // Removing the border from previously selected elements
        var options = $('#form-select tr');

        options.each( function(elementIndex, optionElement){
            //Only removing active from elements within this div
            if( optionElement.offsetParent.id === objectKey ){
                $(this).removeClass('active');
            }

        })

        // Adding an active class to the selected element
        $(elm.target).addClass('active');
        $(elm.target).closest("tr").addClass('active');

        enableWorkflowNextButton(workflowId);

    });
}

function workFlowClickListener(workflowId) {

    $("#" + workflowId + " .option-select-thumbnail").click( function( elm, idx ){

      // Preventing the browser from following the src='#' on click
        elm.preventDefault();

        // Adding selection to dataObject
        var objectKey = elm.currentTarget.offsetParent.parentNode.id;

        // Removing the border from previously selected elements

        var options = $("#" + workflowId + " .option-select-thumbnail");
        options.each( function(elementIndex, optionElement){

            //Only removing active from elements within this div
            if( optionElement.offsetParent.parentNode.id === objectKey ){
                var $firstElementChild = $(this.firstElementChild);
                $firstElementChild.removeClass("active");
                $firstElementChild.parent().removeClass("active");
            }

        })

        // Adding an active class to the selected element
        $(elm.target).addClass("active");
        $(elm.target).parent().addClass('active');

        enableWorkflowNextButton(workflowId);

    });
}

function enableWorkflowNextButton(workflowId) {
    var enableWorkflowButton = true;

    if ($("#" + workflowId + " .option-select-thumbnail img").length > 0 && $("#" + workflowId + " .option-select-thumbnail img.active").length === 0) {
        enableWorkflowButton = false;
    }

    if ($("#" + workflowId + " .single-form a").length > 0) {
        // need to add a tiny delay for the datatable to actually load
        setTimeout(function() {
            if ($("#" + workflowId + " table tr.active").length === 0) {
                enableWorkflowButton = false;
            }
        }, 50);
    }

    if (enableWorkflowButton) {
        $("#" + workflowId + ".view-container").closest("div.workflow-container").find("a.btn-primary").removeClass("disabled");
    }
}

function workFlowAdvance(skipPast) {
    var landingPageID = $("iframe#cadmus_template").attr("landingPageID");
    var $currentWorkflowStep = $(".workflow-content:visible");
    var $lastWorkflowStep = $(".workflow-content").last();

    $currentWorkflowStep.find(".view-container").each(function () {
        var objectKey = $(this).attr("id");

        if (!(skipPast)) {
            dataObject.content[objectKey] = $(this).find('a.active').attr('id');
        }

        // form-select is not actually in the sidebar
        if (objectKey !== "form-select") {
            setWorkflowStepCompleted(objectKey);
        }
    });

    if ($currentWorkflowStep.attr("id") !== $lastWorkflowStep.attr("id")) {
        $currentWorkflowStep.hide();
        $currentWorkflowStep.next().show();
        $('html,body').scrollTop(0);
    } else {
        if (!(skipPast)) {
            getTemplateSkeleton(dataObject.content.template);
            if (dataObject.content["form-select"]) {
                getFormSkeleton(landingPageID, dataObject.content["form-select"]);
            }
        }
        toggleWorkflow();
        $('html,body').scrollTop(0);
    }

    if (!(skipPast)) {
        delayedSaveLandingPage();
    }
}

/**
 * Toggles save button lable pending unsaved changes
 * @param {Boolean} true = the are changes pending save; false = no changes to be saved
 * @return Updates the save button with copy defined in the 'saveButtonMeta' object
 */
function setPendingChangesForLandingPage(v) {
    if (v === true) {
        $(saveButtonMeta.buttonLabel).text(saveButtonMeta.buttonCopy.unSaved);
        pendingChanges = true;
        $(saveButtonMeta.buttonId).removeClass('disabled');
        $('a#exportPage, a#downloadZip').addClass('disabled');
    } else {
        $(saveButtonMeta.buttonLabel).text(saveButtonMeta.buttonCopy.saved);
        pendingChanges = false;
        $(saveButtonMeta.buttonId).addClass('disabled');
        updateExportStatus();
    }
}

function isCopyUsingPlaceholder($element) {
    return $element.html() === copyPlaceholderText;
}