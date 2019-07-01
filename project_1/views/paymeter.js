var $ = require('jquery'),
	_ = require('underscore'),
	Backbone = require('backbone');
Backbone.$ = $;

var PaymeterModel = require('../../messaging/views/modal.js');
var events = require('../../events/events.js');

module.exports = PaymeterModel.extend({

	events: function(){
		return _.extend({}, _.result( PaymeterModel.prototype, 'events'), {
			"click .modal .close": "closeModal",
			"click .modal .login": "triggerLogin",
			"click #activateAccountModalLink": "triggerActivateAccount",
			"click #subcribeModalLink": "triggerSubscribeLink"
		})
	},

	initialize: function() {

		this.fn.payMeter = {

			determineModal: function() {

				var currentStoryCount = this.model.get('pm_storyCount');
				var hardWallPageCount = this.model.get('pm_storyCap');
				var intermediateMessagesOn = this.model.get('showMessages');
				var finalMessageOn = this.model.get('paywallOn');
				
				if (this.model.get('currentMessage')) {
					if ( (currentStoryCount < (hardWallPageCount)) && (intermediateMessagesOn == 1) ) {

						this.renderCornerModal();
						events.trigger('paymeter:paywallMessageDisplayed', ['softwall displayed', currentStoryCount]);


					} else if ( (currentStoryCount >= (hardWallPageCount)) && (finalMessageOn == 1) ) {

						this.renderMiddleModal();
						events.trigger('paymeter:paywallMessageDisplayed', ['hardwall displayed', currentStoryCount]);


					}
				}
				
			}

		}

		this.listenTo(events, 'paymeter:institutionalUserVerified', this.removeMessages);
		this.listenTo(events, 'paymeter:paymeterCookieCreated', this.fn.payMeter.determineModal);

	},

});