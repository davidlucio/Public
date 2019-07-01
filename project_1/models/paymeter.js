var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone');
Backbone.$ = $;

var events = require('../../events/events.js');

module.exports = Backbone.Model.extend({

    url: SITE.paymeter_config_url ? SITE.paymeter_config_url : '../demo-config.json',

	defaults: {
    	'pm_cookieName':    'pmStories',
		'sso_cookieName':   'st_subscriberdata',
        'inst_cookieName':  'iss01',
        'daysSinceOldestCookie': 0,
  	},

	initialize: function() {

		var self = this;
		var currentUserType = this.set('currentUserType', this.getUserType());

		this.fetch({
			success: function(model, response)  {

        		//after getting the config via Ajax, start the meter
                var institutionalUser = false;
                if( self.get('institutionalOn') && self.get('institutionalOn') != 0 ){
                    institutionalUser = self.getInstData();
                }

        		if( self.isMetered() && !institutionalUser ) {

 		   			// Open Cookie Factory
    				self.meterStart();
    				self.determineCurrentMessage();
    				events.trigger('paymeter:paymeterCookieCreated');
        		}
    		
    		}
    	});
	},

	parse: function(response) {

		this.set({
			excludedSections: response.EXC,
			institutionalOn: response.IDS,
			institutionalSubID: response.IDSC,
			mustIncludeSections: response.INC,
			paywallOn: response.LOn,
			includeArticleInCount: SITE._mcidExclude,
			meterActive: response.MA,
			messageHeaders: response.wall_header,
			messages: response.MSG,
			messageImages: response.wall_img_url,
			urlSubscribe: response.url_subscribe,
			urlRegister: response.url_register,
			urlLogin: response.url_login,
			showMessages: response.OA,
			rotationPeriod: response.RP,
			contentType: SITE._mcidType,
			currentArticleID: SITE._mcidType + "_" + SITE._mcid,
			currentPostCategories: SITE.categories,
			pm_storyCount: 0,
			pm_storyCap: this.getHardwallPageCount(response.MSG),
			allowedContentCount: this.getHardwallPageCount(response.MSG) - 1
		});
        
	},

	isMetered: function() {
		
		if (!this.pageExclude() && !this.sectionExclude() && ( this.get('contentType') !== null )) {
			
			events.trigger('paymeter:pageStatusDetermined' , 'Page Metered');
			return true;
		
		} else {
			return false;
		}
	},
	/** Check Meta Data and SSO Cookie **/
	getUserType: function(){

		var currentUserType;

	    // SSO Cookie
        var sso_tasteCookie = this.meterTaste( this.get('sso_cookieName') );
	    if(sso_tasteCookie != undefined && (sso_tasteCookie != false || sso_tasteCookie === "0")) {
            var sso_cookieValue = this.meterLvlDetect(sso_tasteCookie);
	        switch(sso_cookieValue){
	            case "-1":  currentUserType = 'reg'   /**Registered User**/;    break;
	            case "0":   currentUserType = 'other' /**Print Only Sub**/;     break;
	            default:    currentUserType = 'sub'   /**Digital Subscriber**/; this.meterTrash( this.get('pm_cookieName') );
	        }
	    } else {
	        currentUserType = 'anon'; /**Anonymous User**/
	    }

	    events.trigger('paymeter:userTypeDetermined', currentUserType);
	    return currentUserType;

	},
    
	/** Check Institutional Data and Cookie **/
	getInstData: function(){
	    // Institutional Cookie
        var instUserData = this.meterTaste( this.get('inst_cookieName') );
        
        // Allowed Institutions List
        var allowedInsts = this.get('institutionalSubID');
        
	    if(instUserData == undefined || instUserData == false ){
            var instURL = 'https://secure.site.com/checkip.js';
            var self = this;
            $.ajax({
                url: instURL,
                dataType: 'jsonp',
                async: false,
                callback : null,
                jsonp : 'callback',
                jsonpCallback : this.instCBBust(),
                success: function(data) {
                    var instUserData = data;
                    for(var key in allowedInsts){
                        if(allowedInsts[key] == instUserData){
                            self.instVerified(instUserData);
                            return true;
                        }
                    }
                    return false;
                },
                error: function(xhr, ajaxOptions, thrownError){
                    console.log('Institutional connection failed. Response: ' + xhr.responseText);
                    return false;
                }
            });
	    }
        
        // Run comparison check.
        if( Array.isArray(allowedInsts) ){
            for(var key in allowedInsts){
                if(allowedInsts[key] === instUserData){
                    this.instVerified();
                    return true;
                }
            }
        }
        else{
            if(allowedInsts === instUserData){
                this.instVerified();
                return true;
            }
        }
        
        // Default
        return false;
	},
    
    instCBBust: function(){
        return 'institutionalcallback';
    },
    
    instVerified: function(instUserData){
        console.log('Institutional User Verified')
        events.trigger('institutionalUserVerified', instUserData);
    },

	pageExclude: function() {
		
		var includeArticleInCount = this.get('includeArticleInCount');

		if ( (includeArticleInCount == 1 ) && (this.get('meterActive') == 1 )  ) {
			
			return false;
			
		} else {

			events.trigger('paymeter:pageStatusDetermined' , 'Page Excluded');
			return true;

		}	
	},
    
    /** Evaluate the Subscriber Array **/
	meterLvlDetect: function(ssoInfo){
        var arrayInfo = ssoInfo.split(',');
        if(arrayInfo[1] != undefined) {
            return arrayInfo[1];
        }
        return arrayInfo[0];
	},

	sectionExclude: function(){
		
		var excludedSections = this.get('excludedSections');
		var mustIncludeSections = this.get('mustIncludeSections');
	    var curentPostCategories = this.get('currentPostCategories').split('|');

		//convert the sections in config to arrays if they aren't already
		//this allows us to compare the config values even if there is only a single one set by the admin
		if (!Array.isArray(excludedSections)) {
			excludedSections = [excludedSections];
		}

		if (!Array.isArray(mustIncludeSections)) {
			mustIncludeSections = [mustIncludeSections];
		}

	   	//compare the two arrays of category slugs using UnderscoreJS
	   	//intersection returns an array of values that were present in both arrays
	   	//http://underscorejs.org/#intersection
		var matchedExcludedCategories = _.intersection(excludedSections, curentPostCategories)	   	
		var matchedMustIncludeCategories = _.intersection(mustIncludeSections, curentPostCategories);
		
		//if there is a match for an exluded category and there isn't a match for must-include cateogry
		if ( (matchedExcludedCategories.length > 0) && (matchedMustIncludeCategories.length == 0) ) {
			
			//This section is excluded from the paymeter
			return true;
			events.trigger('paymeter:pageStatusDetermined' , 'Section Excluded');
		
		} else {
			
			//This section is included in the paymeter
			return false;
		
		}

	},

	getHardwallPageCount: function(messagesObject) {
		
		var currentUserType = this.get('currentUserType');
		var arrayOfMessages = _.keys(messagesObject[currentUserType]);
		var hardwallPageCount = Math.max.apply(null, arrayOfMessages);
		return hardwallPageCount;
	},

	determineCurrentMessage: function() {
		
		var currentUserType = this.get('currentUserType');
		var currentStoryCount = this.get('pm_storyCount');
		var currentStoryIsNew = this.get('currentStoryIsNew');
		var wallHeaders = this.get('messageHeaders');
		var messages = this.get('messages');
		var wallImages = this.get('messageImages');

		if(currentStoryIsNew && (currentStoryCount in messages[currentUserType]) ) {
		    							
			this.set('currentMessageHeader', wallHeaders[currentUserType]);	       
			this.set('currentMessage', messages[currentUserType][currentStoryCount]);
			this.set('currentMessageImage', wallImages[currentUserType]);
       	}

	},

	getDateOfOldestArticle: function(storyAccessDate) {
		var currentDate = new Date();
	    var oldestStoryInCookie = this.get('daysSinceOldestCookie');
	    var daysSinceAccessed =  ( Date.parse(currentDate) - storyAccessDate ) / (1000*60*60*24);
		if (daysSinceAccessed > oldestStoryInCookie) {

  			daysSinceAccessed = Math.floor(daysSinceAccessed);
           	this.set('daysSinceOldestCookie', daysSinceAccessed);
	    }
	},

	/** Starts the cookie factory! **/
	meterStart: function(){
	    var pm_thatCookie = this.meterTaste( this.get('pm_cookieName') );
	    var pm_ingredients = {};
	    var newStoryFlag = true;
	    var currentStoryCount = this.get('pm_storyCount');

	    var expirationCheck = new Date();
	    expirationCheck.setTime(expirationCheck.getTime() - (10*100*60*60*24*this.get('rotationPeriod') ) );
	    
	    // Tastes and analyzes the cookie
	    if (pm_thatCookie) {

	        pm_ingredients = $.parseJSON(pm_thatCookie);

	        for (var cookieBite in pm_ingredients){
	            var crumbs = pm_ingredients[cookieBite];            
	            
	            // Remove Old Stories
	            var storyAccessDate = Date.parse(crumbs.timestamp);
	            this.getDateOfOldestArticle(storyAccessDate);
	            
	            if(expirationCheck >= storyAccessDate){
	                delete pm_ingredients[cookieBite];
	            } else{
	        		
	        		currentStoryCount++;

	                if( cookieBite == this.get('currentArticleID') ) {
	                	newStoryFlag = false;
	                }
	            }
	        }
	    	       		
       		this.set('pm_storyCount', currentStoryCount);
	    	this.set('currentStoryIsNew', newStoryFlag);
	    	events.trigger('paymeter:storyCountUpdated', currentStoryCount);
	    	events.trigger('paymeter:oldestStoryDetermined', this.get('daysSinceOldestCookie'));
	    }
	    
	    // Processes the cookie and adds ingredients as necessary
	    if ( newStoryFlag && ( currentStoryCount < this.get('pm_storyCap') )) {
            // PAYME-77
            // The N-1 story will not enter the ingredients...
            if( currentStoryCount < this.get('allowedContentCount') ) {
                var today = new Date();
                var pm_newStory = {
                    'section': this.get('currentPostCategories'),
                    'timestamp': today.toUTCString()
                }
                pm_ingredients[ this.get('currentArticleID') ] = pm_newStory;
            }
	        
            currentStoryCount++;
            this.set('pm_storyCount', currentStoryCount);
   	    	events.trigger('paymeter:storyCountUpdated', currentStoryCount);
	    }
	   	
	    // Calls the baker or trash, for a cookie with current ingredients
        if( this.get('currentUserType') === 'sub') {
            this.meterTrash(this.get('pm_cookieName'));
        }
        else {
            this.meterBake(this.get('pm_cookieName'), pm_ingredients);
        }
	},

	/** Checks existing cookie **/
	meterTaste: function(thisCookieName) {
	    var decodedCookie = decodeURIComponent(document.cookie);
	    var cachedCookies = decodedCookie.split(';');
	    for (var i=0;i<cachedCookies.length;i++){
	        var splitCookie = cachedCookies[i].split('=');
	        var cookieName = splitCookie[0].replace(/^\s+|\s+jQuery/g,"");
	        var cookieData = splitCookie[1];
	        if (cookieName==thisCookieName){

	            return cookieData;
	        }
	    }
	    return false;
	},

	/** Serves a new cookie **/
	meterBake: function (thisCookieName, thisCookieIngredients) {
	    var thisCookieContents = JSON.stringify(thisCookieIngredients);
	    
	    var expire = new Date();
	    expire.setTime(expire.getTime() + ( 10*100*60*60*24*this.get('rotationPeriod')) );
        
	    var domainpath = ";domain=.site.com;path=/";

	    document.cookie = thisCookieName +"=" + encodeURIComponent(thisCookieContents) + ";expires="+ expire.toUTCString() +domainpath;
	},
    
    /** Trashes existing cookie **/
	meterTrash: function (thisCookieName) {
        var trashed_ingredients = {};
	    var domainpath = ";domain=.site.com;path=/";
        document.cookie = thisCookieName + "=" + encodeURIComponent(trashed_ingredients) + "; expires=Thu, 01 Jan 1970 00:00:01 GMT;" + domainpath;
	}
});