var express = require("express"); 
var bodyParser = require("body-parser");
var app = express(); 
app.use(bodyParser.urlencoded({ extended: false }));


var fs = require("fs"); 

var mongoose = require("mongoose"); 
mongoose.connect("mongodb://localhost/test"); 

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
	fs.readFile('mentors.json.example', 'utf8', function (err, data) {
		if (err) throw err;
		var mentors = JSON.parse(data); 

		for(var i=0; i<mentors.length; i++) {
			mentors[i]["available"] = true; 
			mentors[i]["currentRoom"] = -1; 
		}

		db.collection("mentors").drop(function() {
			db.collection("mentors").insertMany(mentors, function(err, result) {
				if(err) throw err; 
			}); 
		}); 
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

	db.collection("mentors").find( query )
	.each(function(err, doc) {
		if(doc != null) {
			console.log(doc.name);
		} else {
			res.json({"status": "success"}); 
		}
	});
	}
});

var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Example app listening at http://%s:%s", host, port); 
}); 