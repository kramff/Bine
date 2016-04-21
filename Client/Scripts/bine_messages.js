// bine_messages.js
// stuff for chat / other messages that appear in-game


// Show message on screen from a player / (or other source?)
// Message is some weird object that has text, a target, and some kind of id perhaps? not sure
function AddMessage (message, targetType) {
	if (message.target !== undefined)
	{
		// Target already known from local client
		// Must be player? not sure
		new Message(message.text, message.target, MESG_TARGET_PLAYER);
		return;
	}
	else if (message.id_player !== undefined)
	{
		// Target not set up, but message has a player id to use
		var target = undefined;
		for (var i = 0; i < playerArray.length; i++)
		{
			var otherPlayer = playerArray[i];
			if (otherPlayer.id === message.id_player)
			{
				target = otherPlayer;
				new Message(message.text, target, MESG_TARGET_OTHER_PLAYER)
				return;
			}
		}
	}
	else if (message.id_area !== undefined)
	{
		// Target is an area
		new Message(message.text, target, MESG_TARGET_AREA);
		return;
	}
	else if (message.id_entity !== undefined)
	{
		// Target is an entity
		new Message(message.text, target, MESG_TARGET_ENTITY);
		return;
	}
	else
	{
		// No target: display message without linking to an in-game element (bottom of screen or whatever)
		new message(message.text, undefined, MESG_TARGET_NONE);
		return;
	}
	/*
	message.startTime = Date.now();
	messages.push(message);
	// New message object stuff
	*/
}


// Target Types
var MESG_TARGET_PLAYER = 1;
var MESG_TARGET_OTHER_PLAYER = 2;
var MESG_TARGET_AREA = 3;
var MESG_TARGET_ENTITY = 4;
var MESG_TARGET_NONE = 5;

function Message (text, target, targetType) {
	// Set targetType by what kind of object passed in for target
	this.text = text;
	this.target = target;
	this.targetType = targetType;
	this.x = 300;
	this.y = 300;
	this.timer = 200;

	messages.push(this);
}
