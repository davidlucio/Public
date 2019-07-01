var $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone');
Backbone.$ = $;

var events = require('../../events/events.js');

module.exports = Backbone.Model.extend({

    defaults: {
        'eVar42':  '', //Current user type
        'eVar43':  '', //What link did someone click on from the paywall message
        'eVar44':  '', //Error Messages (not yet implemented)
        'eVar50':  '', //Institutional Subscriber Cookie
        'eVar53':  '', //Message about a paywall message being displayed
        'eVar54':  '', //Page view number when a message is shown
        'eVar74':  '', //UUID
        'eVar75':  '', //Subscriber Number (users must be logged in)      
        'event16': '', //Message about a paywall message being displayed
        'prop25':  '', //Number of days into the rotation period 
        'prop40':  '', //Is the meter running on the current page, is the page excluded, or is the section excluded     
        'prop48':  '', //Page view number when a message is shown
        'prop50':  '', //Institutional Subscriber Cookie
        'prop67':  '',  //User's current meter count
        'linkTrackVars': '' //This is a comma separated list of specific variables that you want to send to omniture
    },

    initialize: function(){

        this.on('change', this.setOmnitureGlobals);
        this.listenTo(events, 'user:UUIDProcessed', this.setUUID);
        this.listenTo(events, 'user:subscriberNumberProcessed', this.setSubscriberNumber);
        this.listenTo(events, 'paymeter:paywallMessageDisplayed', this.setMessageVariables);
        this.listenTo(events, 'paymeter:institutionalUserVerified', this.setInstUserLevel);
        this.listenTo(events, 'paymeter:pageStatusDetermined', this.setPageMeterStatusVariables);
        this.listenTo(events, 'paymeter:storyCountUpdated', this.setStoryCount);
        this.listenTo(events, 'paymeter:modalActionTaken', this.setModalAction);
        this.listenTo(events, 'paymeter:userTypeDetermined', this.setUserType);
        this.listenTo(events, 'paymeter:oldestStoryDetermined', this.setDaysIntoRotationPeriod);
    
    },

    setDaysIntoRotationPeriod: function(daysSinceOldestStory) {
        
        var daysSinceString = daysSinceOldestStory.toString();
        this.set('prop25', daysSinceString );
    },

    setInstUserLevel: function(setInstUserLevel) {

        this.set({
            'eVar50': setInstUserLevel,
            'prop50': setInstUserLevel
        });
    },

    setMessageVariables: function(messageInformation) {
        
        this.set({
            'eVar53': messageInformation[0],  //message
            'eVar54': messageInformation[1],  //page count
            'event16': messageInformation[0], //message
            'prop48': messageInformation[1]   //page count
        });
    },

    setModalAction: function(actionType) {
        
        this.addEventToTrack('eVar43');
        this.set('eVar43', actionType);
        this.sendEventsToOmniture(actionType);

    },

    setSubscriberNumber: function(subscriberNumber) {
        
        this.set('eVar75', subscriberNumber);
    },

    setUUID: function(uuId){
        
        this.set('eVar74', uuId);
    },

    addEventToTrack: function(variableName) {
        //set the linkTrackVars var so that omniture knows what variable to send for an event
        var originalLinkTrackVars = this.get('linkTrackVars');
        var newLinkTrackVars = variableName + ',' + originalLinkTrackVars;
        this.set('linkTrackVars', newLinkTrackVars);
    },

    setPageMeterStatusVariables: function(meterStatus) {
        this.set('prop40', meterStatus);
    },

    setStoryCount: function(currentStoryCount) {
        this.set('prop67', currentStoryCount);
    },

    setUserType: function(currentUserType) {
        this.set('eVar42', currentUserType);
    },
    
    setOmnitureGlobals: function() {

        for (var omnitureVariable in this.attributes) {

            window.s[omnitureVariable] = this.attributes[omnitureVariable];
        }
    },

    //this function was named "callOmniTL" in the previous system (in the omniHelper2.js file)
    sendEventsToOmniture: function(messageForOmnitureAdmins) {
        
        if (!messageForOmnitureAdmins) {
            var messageForOmnitureAdmins = "";
        }
        
        window.s.tl(true, 'o', messageForOmnitureAdmins);
    }

    //We currently aren't generating any error messages, or tracking anything like that
    /*sendError: function(errorMessage) {
        this.get('eVar44');
        s.linkTrackVars = 'eVar44';
        CallOmniTL("Meter Message Error");
    }*/
});
