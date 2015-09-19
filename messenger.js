//var client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var sendgrid = require("sendgrid")(process.env.SENDGRID_API_KEY); 

exports.notifyMentor = function(contactInfo, room, skill) {
	/*client.messages.create({
	    to: "339-223-8868",
	    from: "+13399709476",
	    body: "Help is needed with " + skill + " in room "+room+"."
	}, function(error, message) {
	    if (error) {
	        console.log(error.message);
	    }
	});*/
	var mailOptions = {
		from: "Mentor Hotline <info@lexhack.org>",
		to: "noahm@moroze.com",
		text: "Helped is needed with " + skill + " in room "+room+".",
		subject: "Help request!",
	}; 

	sendgrid.send(mailOptions, function(err, info) {
		if(err) {
			console.log(err);
		} else {
			console.log("Great success!"); 
		}
	}); 
}
