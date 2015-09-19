var express = require("express"); 
var bodyParser = require("body-parser");
var app = express(); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var twitterAPI = require('node-twitter-api');
var twitter = new twitterAPI({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
});
var twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN; 
var twitterAccessSecret = process.env.TWITTER_ACCESS_SECRET;

var fs = require("fs"); 

var Messenger = require("./messenger.js"); 

var mongoose = require("mongoose"); 
mongoose.connect("mongodb://localhost/test"); 

var announcementSchema = mongoose.Schema({
	body: String,
	date: Date,
	timeLoaded: Date, 
});

var Announcement = mongoose.model("Announcement", announcementSchema); 

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
	fs.readFile('mentors.json.example', 'utf8', function (err, data) {
		if (err) throw err;
		var mentors = JSON.parse(data); 

		for(var i=0; i<mentors.length; i++) {
			mentors[i]["available"] = 0; 
			mentors[i]["currentRoom"] = -1; 
		}
		db.collection("announcements").drop(); 
		db.collection("mentors").drop(function() {
			db.collection("mentors").insertMany(mentors, function(err, result) {
				if(err) throw err; 
			}); 
		}); 
	});
});

var updateAnnouncements = function(callback) {
	db.collection("announcements").drop(function() {
		twitter.getTimeline("user_timeline", {
				user_id: "2526062724",
			}, 
			twitterAccessToken,
		    twitterAccessSecret,
		    function(error, data, response) {
		    	if(error) {
		    		console.log("oh my goodness error"); 
		    		console.log(error); 
		    	}
		    	else {
		    		var tweets = []; 
		    		for(var i=0; i<data.length; i++) {
		    			var date = new Date(data[i].created_at);
					if(date.getDate() == 19 && date.getMonth() == 8) {
						tweets.push({
		    					body: data[i].text,
		    					date: date,
		    					timeLoaded: Date.now(),
		    				});
					} 
		    		}
		    		Announcement.create(tweets, function(err) {
		    			if(err) {
		    				console.log(err); 
		    			}
		    			else {
						if(callback)
		    					callback(); 
		    			}
		    		});
		    	}
		    }
		); 
	}); 
}

updateAnnouncements(); 

app.get("/announcements", function(req, res) {
	var response = []; 
	db.collection("announcements").findOne(function(err, obj) {
		if(err) {
			console.log(err); 
		}
		else {
			var dt = 30001; 
			if(obj) {
				dt = Date.now() - obj.timeLoaded;
			}
				
			if(dt > 30000) {
				updateAnnouncements(function() {
					db.collection("announcements").find().each(function(err, doc) {
						if(doc) {
							response.push(doc); 
						}
						else {
							res.json(response); 
						}
					}); 
				}); 
			} else {
				db.collection("announcements").find().each(function(err, doc) {
					if(doc) {
						response.push(doc); 
					}
					else {
						res.json(response); 
					}
				}); 
			}
		}
		//else {
		//	console.log("no announcements"); 
		//}
	});
}); 

app.get("/available", function(req, res) {
	var response = {
		"languages": [],
		"mentors": [], 
	}
	db.collection("mentors").find().each(function(err, doc) {
		if(err) throw err; 
		if(doc != null) {
			console.log(doc); 
			response["mentors"].push(doc.name); 
			var langs = doc.skills; 
			for(var i=0; i<langs.length; i++) {
				if(response["languages"].indexOf(langs[i]) == -1) { // if language not already in list
					response["languages"].push(langs[i]); 
				}
			}
		} else {
			res.json(response); 
		}
	}); 
}); 

app.post("/request", function(req, res) {
	console.log(req.body);
	var query = {}; 
	if(req.body.skill) 
		query["skills"] = req.body.skill; 
	if(req.body.name) 
		query["name"] = req.body.name; 

	db.collection("mentors").findOne( { $query:  query, $orderby: { "available": 1}}, function(err, doc) {
		if(doc != null) {
			var id = doc._id; 
			Messenger.notifyMentor(doc.contact, req.body.room, query["skills"]); 
			console.log(doc.name);
			db.collection("mentors").update({_id:id}, {$inc: {"available": 1}}, {upsert: true}, function(err) {
				if(err) {
					console.log(err); 
				} else {
					console.log("great success");
					res.json(doc);  
				}
			}); 
		} else {
			res.json({"status": "no mentors found"}); 
		}
	});
});

app.post("/clear-mentor", function(req, res) {
	var id = mongoose.Types.ObjectId(req.body.id);  
	db.collection("mentors").update({_id: id}, {$inc: {"available": -1}}, {upsert: true}, function(err) {
		if(err) {
			console.log(err);
		}
	}); 
	res.json({"status": "absolutely peachy"}); 
});

var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Example app listening at http://%s:%s", host, port); 
}); 
