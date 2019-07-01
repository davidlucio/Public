	/** Sock Feedback Functionality for DevCenter **/
	var feedbackGUID = "";
	
	function generateFeedbackID(){
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();		
	}
	

	function submitWEDCS(actiontype, actionvalue ){
		/** WEDCS Implementation **/
		// This goes alongside all click functions in the feedback sock form
		MscomCustomEvent(
				"wcs.cot", "5",
				actiontype, actionvalue,
				"ms.feedbackid", feedbackGUID
			);
			console.log( actiontype + ": " + actionvalue );		
	}

	function sockNavigation(buttonClicked) {
		switch(buttonClicked){
			case 'yes':
				$(".sock-feedback-question").hide();
				$(".sock-feedback-form").show();
				submitWEDCS("ms.rating", 1);
				break; // End 'yes'
			case 'no':
				$(".sock-feedback-question").hide();
				$(".sock-feedback-form").show();
				submitWEDCS("ms.rating", 0);
				break; // End 'no'
			case 'submit':
				$(".sock-feedback-form").hide();
				$(".sock-feedback-thanks").show();
				submitWEDCS("ms.feedback", $(".sock-feedback-response").val() );
				break; // End 'submit'
			case 'skip':
				$(".sock-feedback-form").hide();
				$(".sock-feedback-thanks").show();
				submitWEDCS("ms.feedback", "");
				break; // End 'skip'
			default:
				console.log( "Error SOCK Feedback." );	// Error: Buttons Failing
		}
		// Escape the function
		return 0;
	}

	$( document ).ready(function() {	
		feedbackGUID = generateFeedbackID();
		console.log( "ms.feedbackid" + ": " + feedbackGUID );	
		$(".sock-feedback-yes").click(function() {sockNavigation('yes');});
		$(".sock-feedback-no").click(function() {sockNavigation('no');});
		$(".sock-feedback-submit").click(function() {sockNavigation('submit');});
		$(".sock-feedback-skip").click(function() {sockNavigation('skip');});
	});