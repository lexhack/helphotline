var client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'lexhackathon@gmail.com',
        pass: process.env.GMAIL_PASS
    }
});

exports.notifyMentor = function(contactInfo, room, skill) {
	client.messages.create({
	    to: "339-223-8868",
	    from: "+13399709476",
	    body: "Help is needed with " + skill + " in room "+room+"."
	}, function(error, message) {
	    if (error) {
	        console.log(error.message);
	    }
	});
}
