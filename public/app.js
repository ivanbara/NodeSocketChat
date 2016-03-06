$(function(){
	var FADE_TIME = 200; // ms

	var $window = $(window);
	var $usernameInput = $('.usernameInput'); // Input for username
  	var $messages = $('.messages'); // Messages area
  	var $inputMessage = $('.inputMessage');
  	var $nicknamePage = $('.nickname.page');
  	var $chatPage = $('.chat.page');
  	var $userListUser = $('.userListUser');
  	var $usersNumber = $('#usersNumber');
  	var socket = io();
  	var userColor = '';

  	$chatPage.hide();
  	
  	$usersNumber.text('Number of users online: ');

  	var username;
  	var connected = false;
  	var typing = false;
  	var lastTypingTime;
  	var $currentInput = $usernameInput.focus()

  	// Sets the client's username
  	function setNickname () {
	    username = cleanInput($usernameInput.val().trim());
	    // If the username is valid
	    if (username) {
	      $nicknamePage.fadeOut();
	      $chatPage.show();
	      $nicknamePage.off('click');
	      $currentInput = $inputMessage.focus();

	      // Tell the server your username
	      socket.emit('add user', username);
	    }
  	}


  	// Prevents input from having injected markup
	function cleanInput (input) {
		return input;
	}

	// Keyboard events

	$window.keydown(function (event) {
		if (!(event.ctrlKey || event.altKey || event.metaKey)) {
		  $currentInput.focus();
		}
		// On ENTER key down
		if (event.which === 13) {
		  if (username) {
		    sendMessage();
		    socket.emit('not typing');
		    typing = false;
		  } else {
		    setNickname();
		  }
		}
	});

	// Sends a chat message
	function sendMessage () {
	    var message = cleanInput($inputMessage.val());
	    if (message) {
	      $inputMessage.val('');
	      addChatMessage({
	        username: username,
	        message: message,
	        color: userColor
	      });
	      socket.emit('new message', message);
	    }
	}

		// Adds the visual chat message to the message list
	function addChatMessage (data, options) {
	    var $usernameDiv = $('<span class="username"/>').text(data.username).css('color', data.color);
	    var $messageBodyDiv = $('<span class="messageBody">').text(data.message).css('color', data.color);

	    var $messageDiv = $('<li class="message"/>')
	      .data('username', data.username)
	      .append($usernameDiv, $messageBodyDiv);

	    addMessageDom($messageDiv);
	}

	$inputMessage.on('input', function() {
		
	});

	function addMessageDom(msg){
		var $msg = $(msg);
		$msg.hide().fadeIn(FADE_TIME);
		$messages.append($msg);
		// scroll to most recent message
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}

	// Click events

	// Focus input when clicking anywhere on login page
	$nicknamePage.click(function () {
		$currentInput.focus();
	});

	// Focus input when clicking on the message input's border
	$inputMessage.click(function () {
		$inputMessage.focus();
	});

	function addParticipantsMessage (data) {
	    var message = '';
	    if (data.numUsers === 1) {
	      message += "There is only 1 user in chat :(";
	    } else {
	      message += "There are " + data.numUsers + " users in chat :)";
	    }
    	log(message);
  	}

  	function addToUserList(name){
  		var $name = $('<li>').addClass('uList').text(name);
		$userListUser.append($name);
  	}

  	function removeFromUserList(name){

  	}

	// Log a message
  	function log (message) {
    	var $el = $('<li>').addClass('log').text(message);
    	addMessageDom($el);
  	}

	// Socket events

	socket.on('login', function (data) {
	    // Display the welcome message
	    var message = "Welcome to Chat!";
	    log(message);
	    addParticipantsMessage(data);
  	});

		// Whenever the server emits 'new message', update the chat body
	socket.on('new message', function (data) {
	    addChatMessage(data);
	});

	  // Whenever the server emits 'user joined', log it in the chat body
	socket.on('user joined', function (data) {
	    log(data.username + ' joined');
	    addParticipantsMessage(data);
	});

	  // Whenever the server emits 'user left', log it in the chat body
	socket.on('user left', function (data) {
	    log(data.username + ' left');
	    addParticipantsMessage(data);
	});

	socket.on('usernames', function(data, data2){
		$userListUser.html('');
		for(i = 0; i < data.length; i++){
			var $usernameSpan = $('<div class="userL"/>').text(data[i]).css('color', data2[data[i]]);
			$userListUser.append($usernameSpan);
		}		
	});

	socket.on('usercolor', function(data){
		userColor = data.color;
	});



});