// Server for Bine
// Copyright Mark Foster 2015

console.log("starting server \\(^.^)/");

var http = require("http");
var socketio = require("socket.io");

var listener = function (req, res) {
	res.end("wowowow u are leet haxor");
}
var server = http.createServer(listener)
server.listen(process.env.PORT || 5000);

var io = socketio(server);

var motd = "DOWNLOAD MORE RAM";

var serverLevels = ["ye_olde_playground"];

var levelData = [{name: "ye_olde_playground", data: '{"areas":[{"x":16,"y":5,"z":-4,"xSize":10,"ySize":10,"zSize":10,"map":[[[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]]],"rule":0},{"x":26,"y":7,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[3,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[3,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[3,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0]]],"rule":0},{"x":31,"y":9,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,2,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,2,2,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]]],"rule":0},{"x":26,"y":12,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]]],"rule":0},{"x":31,"y":14,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]]],"rule":0}],"player":{"x":33,"y":16,"z":-3}}'}];


var playerArray = [];
var playerNum = 0;

function UpdatePlayer (player) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id == player.id)
		{
			playerArray[i] = player;
			return;
		}
	}
	playerArray.push(player);
}
function RemovePlayer (player) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id == player.id)
		{
			playerArray.splice(i, 1);
			return;
		}
	}
}

io.on("connection", function(socket) {
	console.log("User connected with id: " + socket.id);

	socket.on("disconnect", function () {
		socket.broadcast.emit("disconnection", {"id": socket.id});
		RemovePlayer({"id": socket.id});
	});

	// For each connection:
	// - Send the message of the day
	// - Send serverLevels (the list of levels available and how many players are in each level)
	// - (For now) Send an initial upate for each current player
	socket.emit("motd", motd);
	socket.emit("serverLevels", serverLevels);
	for (var i = 0; i < playerArray.length; i++) {
		socket.emit("playerMove", playerArray[i]);
	};

	//Temporary main level
	socket.emit("chosenLevel", levelData[0]);

	// When requested:
	// - Send list of players active on a level
	// - Send requested level data
	// - Send a preview of a level (?)
	socket.on("getLevelPlayers", function (data) {
		// data - name of level to get current players of
	});
	socket.on("getLevelData", function (data) {
		// data - name of level to send
	});
	socket.on("getLevelPreview", function (data) {
		// data - name of level to send preivew
	});

	// Automatically when input recieved from players 
	// - Send player events (movement, etc)
	// - Send level events (areas move, NPC's do actions)
	// - Send new messages from other players
	// - Send level updates (tile/other edits)

	// Input from players
	// - Switching level (Joining multiplayer level, making local level multiplayer, creating a local-only instance of a level, etc...)
	// - Gameplay (movement, etc) -> send to players in same area
	// - Messages (chat) -> send to players
	// - Level events (player triggered a switch, etc) -> send to players
	// - Editor stuff (player edits a tile/edits other stuff) -> send to players

	socket.on("switchLevel", function (data) {
		// data - name of level to switch to, or "local" if leaving multiplayer

		// Join the socket.io room for that level (?)
	});
	socket.on("playerMove", function (data) {
		// data - new position of player
		data.id = socket.id;
		socket.broadcast.emit("playerMove", data);
		UpdatePlayer(data);
	});
	socket.on("message", function (data) {
		// data - chat message sent by player
		socket.broadcast.emit("message", data);
	});
	socket.on("levelEvent", function (data) {
		// data - data of the level event
		// {type, area, etc...}
		socket.broadcast.emit("levelEvent", data);
	});
	socket.on("edit", function (data) {
		// data - data of the edit information
		// {type, area, x, y, z}
		socket.broadcast.emit("edit", data);
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