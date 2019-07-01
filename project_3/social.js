var $shareStatusBucket =  {
    twitter:    false,
    facebook:   false,
    googleplus: false,
    linkedin:   false,
    pinterest:  false,
};

var $socialLinkBucket = [];


$(document).ready(function () {

    $("button.update-social-values").on("click", function (e) {
        updateSocialValues();
        $("#editSocialModal").modal("hide");
    });

});


function showEditSocialModal(element) {
    closeSlideOutImageEditor();
    setSocialModalValues();
    $('#editSocialModal').modal('show');
}


function setSocialModalValues() {
    var socialValues = window.dataObject["content"]["social"];
    var shareValues = $shareStatusBucket;

    $("#editSocialModal input[type=checkbox]").prop("checked", false);

    $.each(socialValues, function (key, value) {
        $("#edit-social-" + value).prop("checked", true);
    });

    $.each(shareValues, function (key, value) {
        if(value){
            $("#edit-share-" + key).prop("checked", true);
        }
    });
}


function updateSocialValues() {
    console.log("updating social values");
    // DEFAULT ALL VALUES!
    var returnLinks = [];
    $shareStatusBucket =  {
        twitter:    false,
        facebook:   false,
        googleplus: false,
        linkedin:   false,
        pinterest:  false,
    };

    // Links
    $("#editSocialModal div[for='LP-socialLinks'] input:checked").each(function () {
        returnLinks.push($(this).val());
    });
    window.dataObject["content"]["social"] = returnLinks;

    // Sharing
    $("#editSocialModal div[for='LP-socialSharing'] input:checked").each(function () {
        $shareStatusBucket[ $(this).val() ] = true;
    });

    updateDisplayedSocialOptions();
}


function updateDisplayedSocialOptions() {

    var $landingPageEditor = $("iframe#cadmus_template").contents();

    // Links
    $landingPageEditor.find(".social-option").hide();
    $.each(window.dataObject["content"]["social"], function (key, value) {
        $landingPageEditor.find(".social-" + value).each(function(){
            $(this).show();
        });
    });

    // Share
    $landingPageEditor.find(".social-share-module").each(function(){
        $(this).find("a").each(function() {
            // Clear All States
            $(this).removeClass("share-active");
            $(this).removeClass("share-hidden");
            var sharePlatform = $(this).attr('platform');

            if( $shareStatusBucket[sharePlatform] === true ){
                $(this).addClass("share-active");
            }
            else{
                $(this).addClass("share-hidden");
            }
        });
    });

    fullSweep();
    setWorkflowStepCompleted("social");
}


function scrapeSocialOptions($editorElement) {
    window.dataObject["content"]["social"] = [];
    var $socialLinkBucket = [];

    $editorElement.find('li.social-option').each(function () {
        if ($(this).css("display") !== "none") {
            var socialIdParts = $(this).attr("id").split("-");
            window.dataObject["content"]["social"].push(socialIdParts[1]);
            $socialLinkBucket.push(socialIdParts[1]);
        }
    });
}


function scrapeSharingOptions($editorElement) {
    $editorElement.find("a").each(function() {
        var sharePlatform = $(this).attr('platform');

        if( $(this).hasClass('share-active') ){
            $shareStatusBucket[sharePlatform] = true;
        }
    });
}


function fullSweep(){
    scrapeLandingPageContents();
    delayedSaveLandingPage();
    activateResizeCadmusFrame();
}