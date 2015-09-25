//Server for Bine
//Copyright Mark Foster 2015

console.log("starting server");

var io = require("socket.io")(8080);
var fs = require("fs");

var motd = "DOWNLOAD MORE RAM";

var serverLevels = [];

var playerNum = 0;

io.on("connection", function(socket) {
	console.log("User connected with id: " + socket.id);

	// For each connection:
	// - Send the message of the day
	// - Send serverLevels (the list of levels available and how many players are in each level)
	socket.emit("motd", motd);
	socket.emit("serverLevels", serverLevels);

	// When requested:
	// - Send list of players active on a level
	// - Send requested level data
	// - Send a preview of a level (?)
	socket.on("getLevelPlayers", function (data) {
		//data - name of level to get current players of
	});
	socket.on("getLevelData", function (data) {
		//data - name of level to send
	});
	socket.on("getLevelPreview", function (data) {
		//data - name of level to send preivew
	});

	// Automatically when relevant (during gameplay)
	// - Send player events (movement, etc)
	// - Send level events (areas move, NPC's do actions)
	// - Send new messages from other players
	// - Send level updates (tile/other edits)

	//Input from players
	// - Switching level (Joining multiplayer level, making local level multiplayer, creating a local-only instance of a level, etc...)
	// - Gameplay (movement, etc) -> send to players in same area
	// - Messages (chat) -> send to players
	// - Level events (player triggered a switch, etc) -> send to players
	// - Editor stuff (player edits a tile/edits other stuff) -> send to players

	socket.on("switchLevel", function (data) {
		//data - name of level to switch to, or "local" if leaving multiplayer
	});
	socket.on("movement", function (data) {
		//data - new position of player
		socket.broadcast.emit("movement", data)
	});


});


/*
fs.writeFile("test1.bine", "data data wow wow 2", function (err) {
	if (err)
	{
		console.log("failed to write level data");
	}
});

*/
// ░░░░░░░░░░░░▄▐ 
// ░░░░░░▄▄▄░░▄██▄ 
// ░░░░░▐▀█▀▌░░░░▀█▄ 
// ░░░░░▐█▄█▌░░░░░░▀█▄ 
// ░░░░░░▀▄▀░░░▄▄▄▄▄▀▀ 
// ░░░░▄▄▄██▀▀▀▀ 
// ░░░█▀▄▄▄█░▀▀ 
// ░░░▌░▄▄▄▐▌▀▀▀ 
// ▄░▐░░░▄▄░█░▀▀ U HAVE BEEN SPOOKED BY THE 
// ▀█▌░░░▄░▀█▀░▀ 
// ░░░░░░░▄▄▐▌▄▄ 
// ░░░░░░░▀███▀█░▄ 
// ░░░░░░▐▌▀▄▀▄▀▐▄ SPOOKY SKILENTON 
// ░░░░░░▐▀░░░░░░▐▌ 
// ░░░░░░█░░░░░░░░█ 
// ░░░░░▐▌░░░░░░░░░█ 
// ░░░░░█░░░░░░░░░░▐▌