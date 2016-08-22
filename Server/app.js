// Server for Bine
// Copyright Mark Foster 2015-2016

console.log("starting server \\(^.^)/");

// Local or web
var pathString = "../Isomorphic/";
if (process.env.PORT !== undefined)
{
	pathString = "./Isomorphic/";
}

var Session = require(pathString + "bine_session.js");

var http = require("http");
var socketio = require("socket.io");


var listener = function (req, res) {
	res.end("This is the Bine server - use kramff.github.io");
}
var server = http.createServer(listener)
server.listen(process.env.PORT || 5000);

var io = socketio(server);

var motd = "Join or create a session!";

// Saved worlds
var worldArray = [];
var worldNum = 0;
function GetWorldByID (id) {
	id = Number(id);
	var result = worldArray.filter(function (world) {return world.id === id;});
	if (result[0] !== undefined)
	{
		return result[0];
	}
}

// Active sessions
var sessionArray = [];
var sessionNum = 0;
function GetSessionByID (id) {
	id = Number(id);
	var result = sessionArray.filter(function (session) {
		return session.id === id;
	});
	if (result[0] !== undefined)
	{
		return result[0];
	}
}

// Connected players
var playerArray = [];
var playerNum = 0;

io.on("connection", function(socket) {
	console.log("User connected with id: " + socket.id);

	this.playerID = undefined;

	socket.on("disconnect", function () {
		socket.broadcast.emit("disconnection", {"id": socket.id});
		// RemovePlayer({"id": socket.id});
		this.playerID = undefined;
	});

	// For each connection:
	// - Send the message of the day
	// - Send the list of worlds available
	// - Send the list of sessions available
	// - (disabled for now) Send an initial upate for each current player
	socket.emit("motd", motd);
	socket.emit("worldList", worldArray.map(function (level) {return level.name;}));
	// session data: id, name, mode, worldName, playerCount
	socket.emit("sessionList", sessionArray.map(function (session) {return {id: session.id, name: session.name, mode: session.mode, worldName: session.worldName, playerCount: session.playerCount};}));
	/*for (var i = 0; i < playerArray.length; i++)
	{
		socket.emit("playerMove", playerArray[i]);
	}*/

	socket.on("createSessionNewWorld", function (data) {
		// data - {name}
		var emptyWorldData = {levelDatas: [], tileData: [], worldRules: [], entityTemplates: [], areaTemplates: [], itemData: [], particleData: []};

		// Should use data.name
		var newSession = new Session("Session #" + sessionNum, emptyWorldData);
		newSession.id = sessionNum;
		console.log("created session! session name: " + newSession.name);
		sessionArray.push(newSession);
		sessionNum ++;

		// Send player the world data for the created session
		socket.emit("worldData", newSession.ExportWorld());
		// Add player to session
		newSession.CreatePlayerEntity();

		// Join the socket.io room for this session
		socket.join("session_room " + newSession.id);
	});

	// Functions to give requested information to clients
	// - Send list of players active in a session
	// - Send requested level data
	// - Send a preview of a level (?)
	socket.on("getSessionPlayers", function (data) {
		// data - id of session to get current players of
		var session = GetSessionByID(data);
		socket.emit("sessionPlayers", {"id": session.id, "players": session.currentPlayers});
	});
	socket.on("getWorldData", function (data) {
		// data - id of world to send
		var result = levels.filter(function (level) {return level.id === data;});
		if (result[0] !== undefined)
		{
			socket.emit("worldData", {"id": result[0].id, "data": result[0].data})
			// return result[0].currentPlayers
		}
		var world = GetWorldByID(data);
	});
	socket.on("getLevelPreview", function (data) {
		// data - name of level to send preivew
	});
	socket.on("joinSession", function (data) {
		// data - id of session to join
		var session = GetSessionByID(data);
		// Send world data
		socket.emit("worldData", session.ExportWorld())
		// Add player to session
		session.CreatePlayerEntity();

	})

	// Automatically when input received from players 
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

	//socket.on("switchLevel", function (data) {
		// data - name of level to switch to, or "local" if leaving multiplayer

		// Join the socket.io room for that level (?)
	//});
	socket.on("playerMove", function (data) {
		// data - new position of player
		data.id = socket.id;
		socket.broadcast.emit("playerMove", data);
		// UpdatePlayer(data);
	});
	socket.on("message", function (data) {
		// data - chat message sent by player
		// Set the id and send it out to all other players
		data.id_player = socket.id;
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
	socket.on("tileChange", function (data) {
		socket.broadcast.emit("tileChange", data);
		ReceiveTileChange(data);
	});
	socket.on("createArea", function (data) {
		socket.broadcast.emit("createArea", data);
		ReceiveCreateArea(data);
	});
	socket.on("removeArea", function (data) {
		socket.broadcast.emit("removeArea", data);
		ReceiveRemoveArea(data);
	});


});


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