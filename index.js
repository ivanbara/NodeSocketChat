var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var ranColor = require('randomcolor');


var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/chat', function(err){
	if (err) {
		console.log(err);
	} else{
		console.log('connected to mongodb');
	}
});

var mongSchema = mongoose.Schema({
	username: String,
	message: String,
	color: String,
	created: {type: Date, default: Date.now}
});

var mongChatModel = mongoose.model('ChatMessage', mongSchema);

var numUsers = 0;
var users = {};
var userColors = {};

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));


// socket
io.on('connection', function(socket){
	var addedUser = false;

	var query = mongChatModel.find({});
	query.sort({created: -1}).limit(10).exec(function(err, docs){
		if(err) throw err;
		socket.emit('load old messages', docs);
	});

  	socket.on('add user', function (username) {
    	if (addedUser) return;

	    socket.userColor = ranColor.randomColor({luminosity: 'light'});
	    socket.username = username;
	    socket.emit('usercolor', {color: socket.userColor});

	    numUsers++;
	    addedUser = true;
	    socket.emit('login', {
	      numUsers: numUsers
	    });
	    // tell everyone that someone has joined the chat
	    socket.broadcast.emit('user joined', {
	      username: socket.username,
	      numUsers: numUsers
	    });

		users[socket.username] = socket;
		userColors[socket.username] = socket.userColor;
		updateNicknames();
  	});

  	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users), userColors);
	}

  	socket.on('new message', function (data) {
    	socket.broadcast.emit('new message', {
      		username: socket.username,
      		message: data,
      		color: socket.userColor
    	});
    	// save message to database
    	var msg = new mongChatModel({
    		username: socket.username,
      		message: data,
      		color: socket.userColor
    	});
    	
    	msg.save(function (err, data) {
			if (err) console.log(err);
			else console.log('Saved : ', data );
		});
  	});


  	// when the user disconnects.. perform this
  	socket.on('disconnect', function () {
    	if (addedUser) {
      		--numUsers;

          	socket.broadcast.emit('user left', {
	        	username: socket.username,
	        	numUsers: numUsers
	      	});
	      	delete users[socket.username];
	      	delete userColors[socket.username];
			updateNicknames();
    	}
  	});

});






