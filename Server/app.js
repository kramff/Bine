//Server for Bine
//Copyright Mark Foster 2015

var io = require("socket.io")(8080);
var fs = require("fs");

var motd = "MESSAG OF DAY";

var serverLevels = [];

var playerNum = 0;

io.on("connection", function(socket) {
	socket.emit("test", {wow: "such data"});
	console.log("a connection");

	// For each connection:
	// - Send the message of the day
	// - Send serverLevels (the list of levels available and how many players are in each level)
	socket.emit("motd", motd);
	socket.emit("serverLevels", serverLevels);

	// When requested:
	// - Send a preview of a level (?)
	// - Send list of players active on a level
	// - Send requested level data

	// Automatically when relevant (during gameplay)
	// - Send player events (movement, etc)
	// - Send level events (areas move, NPC's do actions)
	// - Send new messages from other players
	// - Send level updates (tile/other edits)

	//Input from players
	// - Switching level (Joining multiplayer level, making local level multiplayer, creating a local-only instance of a level, etc...)
	// - Gameplay (movement, etc)
	// - Messages (chat)
	// - Level events (player triggered a switch, etc)
	// - Editor stuff (player edits a tile/edits other stuff)


});


/*
fs.writeFile("test1.bine", "data data wow wow 2", function (err) {
	if (err)
	{
		console.log("failed to write level data");
	}
});

*/
