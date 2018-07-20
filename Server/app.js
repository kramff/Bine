// Server for Bine
// Multiplayer level editor project
// Copyright Mark Foster 2015-2016

TimeLog("starting server \\(^.^)/");

// Local or web
var pathString = "../Isomorphic/";
if (process.env.PORT !== undefined)
{
	pathString = "./Isomorphic/";
}

var Session = require(pathString + "bine_session.js");

var http = require("http");
var fs = require("fs");
var socketio = require("socket.io");

function TimeLog (text) {
	console.log("[" + (new Date().toUTCString()) + "] " + text);
}

var listener = function (req, res) {
	res.end("This is the Bine session server - use kramff.com/Bine");
}
var server = http.createServer(listener)
server.listen(process.env.PORT || 5000);

var io = socketio(server);

// Currently using http and not ws exclusively
//io.set("transports", ["websocket"]);

var motd = "Join or create a session!";

// Saved worlds
var worldArray = [];
var worldNum = 1;

// Get saved worlds from filesystem
var fileWorlds = fs.readdirSync("Worlds");

for (var i = 0; i < fileWorlds.length; i++) {
	var fileWorldPath = fileWorlds[i];
	var fileWorldData = fs.readFileSync("Worlds/" + fileWorldPath, "utf8");
	var fileWorld = JSON.parse(fileWorldData);
	worldArray.push(fileWorld);
	fileWorld.id = worldNum;
	worldNum += 1;
}

function GetWorldByID (id) {
	id = Number(id);
	var result = worldArray.filter(function (world) {
		return world.id === id;
	});
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

// Create a starting session for each saved world
for (var i = 0; i < worldArray.length; i++) {
	var startingWorldData = worldArray[i];
	var newSession = new Session("Session #" + sessionNum, startingWorldData);
	newSession.id = sessionNum;
	TimeLog("created starting session! session name: " + newSession.name);
	sessionArray.push(newSession);
	sessionNum += 1;
}


// Connected players
var playerArray = [];
var playerNum = 0;

io.on("connection", function(socket) {
	TimeLog("User connected with id: " + socket.id);

	this.playerID = undefined;
	this.roomName = undefined;

	this.inSession = false;
	this.curSession = undefined;

	this.inLevel = false;
	this.curLevel = undefined;

	this.inPlayer = false;
	this.curPlayer = undefined;

	socket.on("disconnect", function (reason) {
		TimeLog("User disconnected with id: " + socket.id + ", and reason: " + reason);
		ExitPlayer(this);
		// socket.broadcast.emit("disconnection", {"id": socket.id});
		// RemovePlayer({"id": socket.id});
		this.playerID = undefined;
	});

	// For each connection:
	// - Send the message of the day
	// - Send the list of worlds available
	// - Send the list of sessions available
	// - (disabled for now) Send an initial upate for each current player
	socket.emit("motd", motd);
	// socket.emit("worldList", worldArray.map(function (level) {return level.name;}));
	socket.emit("worldList", worldArray.map(function (world) {return world.id;}));
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
		TimeLog("created session! session name: " + newSession.name);
		sessionArray.push(newSession);
		sessionNum ++;

		// Send player the world data for the created session
		socket.emit("worldData", newSession.ExportWorld());
		// Add player to session
		// newSession.CreatePlayerEntity();

		// Join the socket.io room for this session
		this.roomName = "session_room " + newSession.id;
		socket.join(this.roomName);
		this.inSession = true;
		this.curSession = newSession;

		// Notify all connected users of new session
		io.emit("newSession", {id: newSession.id, name: newSession.name, mode: newSession.mode, worldName: newSession.worldName, playerCount: newSession.playerCount});
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
		var world = GetWorldByID(data);
		socket.emit("worldData", world);
	});
	socket.on("getLevelPreview", function (data) {
		// data - name of level to send preivew
	});
	socket.on("joinSession", function (data) {
		// data - id of session to join
		var session = GetSessionByID(data);
		// Send world data
		socket.emit("worldData", session.ExportWorld());
		// Add player to session
		// session.CreatePlayerEntity();

		// Join the socket.io room for this session
		this.roomName = "session_room " + session.id;
		socket.join(this.roomName);
		this.inSession = true;
		this.curSession = session;
	});
	socket.on("createNewLevel", function (data) {
		if (this.inSession)
		{
			this.curSession.levelCounter ++;
			var blankLevelData = {
				name: "level name",
				id: this.curSession.levelCounter,
				entityDatas: [],
				areaDatas: [],
			}
			var newLevel = this.curSession.AddLevel(blankLevelData);
			this.inLevel = true;
			this.curLevel = newLevel;
			// io.to(this.roomName).emit("newLevel", levelID);
			var levelData = newLevel.Export();
			io.to(this.roomName).emit("newLevel", levelData)
			socket.emit("enterLevel", newLevel.id);
		}
	});
	socket.on("joinLevel", function (data) {
		if (this.inSession)
		{
			var joinedLevel = this.curSession.GetLevelByID(data);
			socket.emit("enterLevel", joinedLevel.id);
			this.inLevel = true;
			this.curLevel = joinedLevel;
		}
	});
	socket.on("createNewArea", function (data) {
		if (this.inSession && this.inLevel)
		{
			this.curLevel.areaCounter ++;
			var blankAreaData = {
				id: this.curLevel.areaCounter,
				x: data.x,
				y: data.y,
				z: data.z,
				xSize: 5,
				ySize: 5,
				zSize: 5,
				settings: [],
				map: [],
				extra: [],
				style: [],
				rules: [],
				templates: [],
			};
			var area = this.curLevel.AddArea(blankAreaData);

			var areaData = area.Export();
			io.to(this.roomName).emit("newArea", {levelID: this.curLevel.id, areaData: areaData});
		}
	});
	socket.on("createNewEntity", function (data) {
		if (this.inSession && this.inLevel)
		{
			this.curLevel.entityCounter ++;
			var blankEntityData = {
				id: this.curLevel.entityCounter,
				x: data.x,
				y: data.y,
				z: data.z,
				settings: [],
				style: [],
				variables: [],
				rules: [],
				templates: [],
				variableCounter: 0,
			};
			var entity = this.curLevel.AddEntity(blankEntityData);

			var entityData = entity.Export();
			io.to(this.roomName).emit("newEntity", {levelID: this.curLevel.id, entityData: entityData});
		}
	});
	socket.on("testAsPlayer", function (data) {
		if (this.inSession && this.inLevel)
		{
			this.curLevel.entityCounter ++;
			var newPlayerData = {
				id: this.curLevel.entityCounter,
				x: data.x,
				y: data.y,
				z: data.z,
				style: [],
				settings: [],
				variables: [],
				rules: [],
				templates: [],
			}
			var newPlayer = this.curLevel.AddEntity(newPlayerData);
			io.to(this.roomName).emit("newEntity", {levelID: this.curLevel.id, entityData: newPlayerData});
			socket.emit("assignPlayerEntity", newPlayer.id);
			this.inPlayer = true;
			this.curPlayer = newPlayer;
		}
	});
	socket.on("stopTestingPlayer", function () {
		ExitPlayer(this);
	});
	socket.on("exitLevel", function () {
		this.inLevel = false;
		this.curLevel = undefined;
	});
	socket.on("exitSession", function () {
		this.inSession = false;
		this.curSession = undefined;
	});

	socket.on("tileChange", function (data) {
		if (this.inSession && this.inLevel)
		{
			var levelID = data.levelID;
			var areaID = data.areaID;
			var tileData = data.tileData;
			this.curSession.EditTile(levelID, areaID, tileData);
			io.to(this.roomName).emit("tileChange", data);
		}
	});

	socket.on("inputUpdate", function (data) {
		// Player has changed their input keys
		if (this.inSession && this.inLevel && this.inPlayer)
		{
			this.curPlayer.SetMoveDirections(data.up, data.down, data.left, data.right);
			data.entityID = this.curPlayer.id;
			data.levelID = this.curLevel.id;
			socket.broadcast.to(this.roomName).emit("inputUpdate", data);
		}
	});

	socket.on("locationCorrection", function (data) {
		// Player sends a location correction periodically (every few seconds)
		// Smoothly adjust player's location to the correction location
		if (this.inSession && this.inLevel && this.inPlayer)
		{
			this.curPlayer.SetLocationCorrection(data.x, data.y, data.z, data.xMov, data.yMov, data.zMov, data.moveTime, data.moveDuration);
			data.entityID = this.curPlayer.id;
			data.levelID = this.curLevel.id;
			socket.broadcast.to(this.roomName).emit("locationCorrection", data);
		}
	});

	socket.on("deleteArea", function (data) {
		if (this.inSession && this.inLevel)
		{
			var level = this.curSession.GetLevelByID(data.levelID);
			level.RemoveArea(data.areaID);
			io.to(this.roomName).emit("deleteArea", data);
		}
	});

	socket.on("entityChange", function (data) {
		if (this.inSession && this.inLevel)
		{
			io.to(this.roomName).emit("entityChange", data);
			this.curSession.ChangeEntity(data.levelID, data.entityID, data.entityData);
		}
	});

	socket.on("message", function (data) {
		// Player has sent a message
		// data - text of message sent by player
		TimeLog("Player: " + this.curPlayer.id + " sent a message: " + data);
		if (this.inSession && this.inLevel && this.inPlayer)
		{
			// this.curPlayer.SetMoveDirections(data.up, data.down, data.left, data.right);
			messageObj = {text: data, entityID: this.curPlayer.id, levelID: this.curLevel.id};
			socket.broadcast.to(this.roomName).emit("message", messageObj);
		}
		// // data - chat message sent by player
		// // Set the id and send it out to all other players
		// data.id_player = socket.id;
		// socket.broadcast.emit("message", data);
	});

	socket.on("throwBall", function (data) {
		if (this.inSession && this.inLevel && this.inPlayer)
		{
			ballThrowObj = {ballData: data, entityID: this.curPlayer.id, levelID: this.curLevel.id};
			socket.broadcast.to(this.roomName).emit("throwBall", ballThrowObj);
		}
	});

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
	/*
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
	*/


});

// Functions for client to call
function ExitPlayer (client) {
	if (client.inSession && client.inLevel && client.inPlayer)
	{
		io.to(client.roomName).emit("removeEntity", {levelID: client.curLevel.id, entityID: client.curPlayer.id});
		client.curSession.RemoveEntity(client.curLevel.id, client.curPlayer.id)
		client.inPlayer = false;
		client.curPlayer = undefined;
	}
}


// Gameplay loop
function MainUpdate () {
	setTimeout(MainUpdate, 16);

	for (var i = 0; i < sessionArray.length; i++) {
		var session = sessionArray[i];
		for (var j = 0; j < session.levels.length; j++) {
			var level = session.levels[j];
			level.Update();
		}
	}
}
if (false)
{
	MainUpdate();
}


if (Math.random() > 0.99)
{	
	TimeLog("\x1b[36m");
	TimeLog("░░░░░░░░░░░░▄▐ ");
	TimeLog("░░░░░░▄▄▄░░▄██▄ ");
	TimeLog("░░░░░▐▀█▀▌░░░░▀█▄ ");
	TimeLog("░░░░░▐█▄█▌░░░░░░▀█▄ ");
	TimeLog("░░░░░░▀▄▀░░░▄▄▄▄▄▀▀ ");
	TimeLog("░░░░▄▄▄██▀▀▀▀ ");
	TimeLog("░░░█▀▄▄▄█░▀▀ ");
	TimeLog("░░░▌░▄▄▄▐▌▀▀▀ ");
	TimeLog("▄░▐░░░▄▄░█░▀▀ U HAVE BEEN SPOOKED BY THE ");
	TimeLog("▀█▌░░░▄░▀█▀░▀ ");
	TimeLog("░░░░░░░▄▄▐▌▄▄ ");
	TimeLog("░░░░░░░▀███▀█░▄ ");
	TimeLog("░░░░░░▐▌▀▄▀▄▀▐▄ SPOOKY SKILENTON ");
	TimeLog("░░░░░░▐▀░░░░░░▐▌ ");
	TimeLog("░░░░░░█░░░░░░░░█ ");
	TimeLog("░░░░░▐▌░░░░░░░░░█ ");
	TimeLog("░░░░░█░░░░░░░░░░▐▌");
	TimeLog('\x1b[0m')
}