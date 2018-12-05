// Server for Bine
// Multiplayer level editor project
// Copyright Mark Foster 2015-2018

timeLog("starting server \\(^.^)/");

// Path to isomorphic files
var pathString = "../Isomorphic/";

var Session = require(pathString + "bine_session.js");

const fs = require("fs");

const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5000 })

const crypto = require("crypto");

function timeLog (text) {
	console.log("[" + (new Date().toUTCString()) + "] " + text);
}

var motd = "Join or create a session!";

// Saved worlds
var worldList = [];
var worldNum = 1;

// Get saved worlds from filesystem
var fileWorlds = fs.readdirSync("Worlds");

for (var i = 0; i < fileWorlds.length; i++) {
	var fileWorldPath = fileWorlds[i];
	var fileWorldData = fs.readFileSync("Worlds/" + fileWorldPath, "utf8");
	var fileWorld = JSON.parse(fileWorldData);
	worldList.push(fileWorld);
	fileWorld.id = worldNum;
	worldNum += 1;
}

function getWorldByID (id) {
	id = Number(id);
	var result = worldList.filter(function (world) {
		return world.id === id;
	});
	if (result[0] !== undefined) {
		return result[0];
	}
}

// Active sessions
var sessionList = [];
var sessionNum = 0;
function getSessionByID (id) {
	id = Number(id);
	var result = sessionList.filter(function (session) {
		return session.id === id;
	});
	if (result[0] !== undefined) {
		return result[0];
	}
}

// Create a starting session for each saved world
for (var i = 0; i < worldList.length; i++) {
	var startingWorldData = worldList[i];
	var newSession = new Session("Session #" + sessionNum, startingWorldData);
	newSession.id = sessionNum;
	timeLog("created starting session! session name: " + newSession.name);
	sessionList.push(newSession);
	sessionNum += 1;
}


// Connected players
var playerList = [];
var playerNum = 0;


// ws stuff starts here

// Player - user that connects to server. Can join a room to access a session, and control an entity inside that session.
function Player (ws) {
	this.ws = ws;
	this.ID = playerNum;
	playerNum += 1;

	this.room = undefined;
	// this.session = undefined;
	// this.sessionID = undefined;
	this.session = undefined;
	this.level = undefined;
	this.playerEntity = undefined;
	playerList.push(this);
}
Player.prototype.disconnect = function () {
	playerList.splice(playerList.indexOf(this), 1);
}
Player.prototype.sendData = function (type, data) {
	var stringData = JSON.stringify({type: type, data: data});
	this.ws.send(stringData);
}
Player.prototype.joinRoom = function(room) {
	if (room !== undefined) {
		room.addPlayer(this);
		this.room = room;
	}
};

// Send data to all connected players
function sendDataAll (type, data) {
	playerList.forEach(function (player) {
		player.sendData(type, data);
	});
}

// List of rooms
var roomList = [];
var roomNum = 0;

function getRoomByID (roomID) {
	return roomList.find(function (room) {
		return (room.ID === roomID);
	});
}

function getRoomBySession (session) {
	return roomList.find(function (room) {
		return (room.session === session);
	});
}

// Room - group of players in a session. Could potentially switch session and keep the same players
// Takes an initial session
function Room (session) {
	this.players = [];
	this.session = session;
	this.ID = roomNum;
	roomNum += 1;
}

// Add a player to the players list. (Called by Player.joinRoom() )
Room.prototype.addPlayer = function (player) {
	this.players.push(player);
};

// Send data to all the players in this room
Room.prototype.sendDataRoom = function(type, data) {
	this.players.forEach(function (player) {
		player.sendData(type, data);
	});
};

wss.on("connection", function connection (ws) {

	var player = new Player(ws);

	timeLog("Player connected! ID: " + player.ID);

	ws.on("message", function incoming (message) {
		var mData = JSON.parse(message);
		handleMessageData(player, mData.type, mData.data);
	});

	ws.on("close", function close () {
		timeLog("Player disconnected! ID: " + player.ID);
		player.disconnect();
	});

	player.sendData("motd", motd);
	player.emit("worldList", worldList.map(function (world) {return world.id;}));
	socket.emit("sessionList", sessionList.map(function (session) {return {id: session.id, name: session.name, mode: session.mode, worldName: session.worldName, playerCount: session.playerCount};}));
});

function handleMessageData (player, type, data) {
	if (type === "createSessionNewWorld") {
		// data - {name: "(name here)"}
		var emptyWorldData = {levelDatas: [], tileData: [], worldRules: [], entityTemplates: [], areaTemplates: [], itemData: [], particleData: []};

		// Should use data.name
		var newSession = new Session("Session #" + sessionNum, emptyWorldData);
		newSession.id = sessionNum;
		timeLog("created session! session name: " + newSession.name);
		sessionList.push(newSession);
		sessionNum += 1;

		// Send player the world data for the created session
		player.sendData("worldData", newSession.ExportWorld());

		// Make the room for this session and join it
		var newRoom = new Room(newSession);
		player.joinRoom(newRoom);

		// Notify all connected users of new session
		sendDataAll("newSession", {id: newSession.id, name: newSession.name, mode: newSession.mode, worldName: newSession.worldName, playerCount: newSession.playerCount});
	}
	else if (type === "getSessionPlayers") {
		var session = getSessionByID(data);
		player.sendData("sessionPlayers", {"id": session.id, "players": session.currentPlayers});
	}
	else if (type === "getWorldData") {
		var world = getWorldByID(data);
		player.sendData("worldData", world);
	}
	else if (type === "getLevelPreview") {
		// unimplemented
	}
	else if (type === "joinSession") {
		// data - id of session to join
		var session = getSessionByID(data);
		// Send world data
		player.sendData("worldData", session.ExportWorld());
		// Add player to session
		// session.CreatePlayerEntity();

		// Join the socket.io room for this session
		var room = getRoomBySession(session);
		
		player.joinRoom(room);
	}
	else if (type === "createNewLevel") {
		if (player.session !== undefined)
		{
			player.session.levelCounter += 1;
			var blankLevelData = {
				name: "level name",
				id: player.session.levelCounter,
				entityDatas: [],
				areaDatas: [],
			}
			var newLevel = player.session.AddLevel(blankLevelData);
			player.level = newLevel;
			
			// Send info to other players in this room
			var levelData = newLevel.Export();
			player.room.sendDataRoom("enterLevel", levelData);

			// Put the player into this room
			player.sendData("enterLevel", newLevel.id);
		}
	}
	else if (type === "joinLevel") {
		var joinedLevel = player.session.GetLevelByID(data);
		player.sendData("enterLevel", joinedLevel.id);
		player.level = joinedLevel;
	}
	else if (type === "createNewArea") {
		player.level.areaCounter += 1;
		var blankAreaData = {
			id: player.level.areaCounter,
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
		var area = player.level.AddArea(blankAreaData);

		var areaData = area.Export();
		player.room.sendDataRoom("newArea", {levelID: player.level.id, areaData: areaData});
	}
	else if (type === "createNewEntity") {
		player.level.entityCounter += 1;
		var blankEntityData = {
			id: player.level.entityCounter,
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
		var entity = player.level.AddEntity(blankEntityData);

		var entityData = entity.Export();
		player.room.sendDataRoom("newEntity", {levelID: player.level.id, entityData: entityData});
	}
	else if (type === "testAsPlayer") {
		player.level.entityCounter += 1;
		var newPlayerData = {
			id: player.level.entityCounter,
			x: data.x,
			y: data.y,
			z: data.z,
			style: [],
			settings: [],
			variables: [],
			rules: [],
			templates: [],
		}
		var newPlayer = player.level.AddEntity(newPlayerData);
		player.room.sendDataRoom("newEntity", {levelID: player.level.id, entityData: newPlayerData});
		player.sendData("assignPlayerEntity", newPlayer.id);
		player.playerEntity = newPlayer;
	}
	else if (type === "stopTestingPlayer") {
		player.room.sendDataRoom("removeEntity", {levelID: player.level.id, entityID: player.playerEntity.id});
		player.session.RemoveEntity(player.level.id, player.playerEntity.id)
		player.playerEntity = undefined
	}
	else if (type === "exitLevel") {
		player.level = undefined;
	}
	else if (type === "exitSession") {
		player.session = undefined;
	}
	else if (type === "tileChange") {
		var levelID = data.levelID;
		var areaID = data.areaID;
		var tileData = data.tileData;
		player.session.EditTile(levelID, areaID, tileData);
		player.room.sendDataRoom("tileChange", data);
	}
	else if (type === "inputUpdate") {
		player.playerEntity.SetMoveDirections(data.up, data.down, data.left, data.right);
		data.entityID = player.playerEntity.id;
		data.levelID = player.level.id;
		// May need to exclude player from recieving this message?
		player.room.sendDataRoom("inputUpdate", data);
	}
	else if (type === "locationCorrection") {
		// 
		player.playerEntity.SetLocationCorrection(data.x, data.y, data.z, data.xMov, data.yMov, data.zMov, data.moveTime, data.moveDuration);
		data.entityID = this.curPlayer.id;
		data.levelID = this.curLevel.id;
		player.room.sendDataRoom("locationCorrection", data);
	}
	else if (type === "deleteArea") {
		var level = player.session.GetLevelByID(data.levelID);
		level.RemoveArea(data.areaID);
		player.room.sendDataRoom("deleteArea", data);
	}
	else if (type === "entityChange") {
		player.room.sendDataRoom("entityChange", data);
		player.session.ChangeEntity(data.levelID, data.entityID, data.entityData);
	}
	else if (type === "message") {
		timeLog("Player: " + player.ID + " sent a message: " + data);
		messageObj = {text: data, entityID: player.playerEntity.id, levelID: player.level.id};
		player.room.sendDataRoom("message", messageObj);
	}
	else if (type === "throwBall") {
		ballThrowObj = {ballData: data, entityID: player.playerEntity.id, levelID: player.level.id};
		player.room.sendDataRoom("throwBall", ballThrowObj);
	}
}

// TODO: Swap out socket.io for ws

// io.on("connection", function(socket) {
// 	timeLog("User connected with id: " + socket.id);

// 	this.playerID = undefined;
// 	this.roomName = undefined;

// 	this.inSession = false;
// 	this.curSession = undefined;

// 	this.inLevel = false;
// 	this.curLevel = undefined;

// 	this.inPlayer = false;
// 	this.curPlayer = undefined;

// 	socket.on("disconnect", function (reason) {
// 		timeLog("User disconnected with id: " + socket.id + ", and reason: " + reason);
// 		exitPlayer(this);
// 		// socket.broadcast.emit("disconnection", {"id": socket.id});
// 		// RemovePlayer({"id": socket.id});
// 		this.playerID = undefined;
// 	});

// 	// For each connection:
// 	// - Send the message of the day
// 	// - Send the list of worlds available
// 	// - Send the list of sessions available
// 	// - (disabled for now) Send an initial upate for each current player
// 	socket.emit("motd", motd);
// 	// socket.emit("worldList", worldList.map(function (level) {return level.name;}));
// 	socket.emit("worldList", worldList.map(function (world) {return world.id;}));
// 	// session data: id, name, mode, worldName, playerCount
// 	socket.emit("sessionList", sessionList.map(function (session) {return {id: session.id, name: session.name, mode: session.mode, worldName: session.worldName, playerCount: session.playerCount};}));
// 	/*for (var i = 0; i < playerList.length; i++)
// 	{
// 		socket.emit("playerMove", playerList[i]);
// 	}*/

// 	socket.on("createSessionNewWorld", function (data) {
// 		// data is {name}
// 		var emptyWorldData = {levelDatas: [], tileData: [], worldRules: [], entityTemplates: [], areaTemplates: [], itemData: [], particleData: []};

// 		// Should use data.name
// 		var newSession = new Session("Session #" + sessionNum, emptyWorldData);
// 		newSession.id = sessionNum;
// 		timeLog("created session! session name: " + newSession.name);
// 		sessionList.push(newSession);
// 		sessionNum += 1;

// 		// Send player the world data for the created session
// 		socket.emit("worldData", newSession.ExportWorld());
// 		// Add player to session
// 		// newSession.CreatePlayerEntity();

// 		// Join the socket.io room for this session
// 		this.roomName = "session_room " + newSession.id;
// 		socket.join(this.roomName);
// 		this.inSession = true;
// 		this.curSession = newSession;

// 		// Notify all connected users of new session
// 		io.emit("newSession", {id: newSession.id, name: newSession.name, mode: newSession.mode, worldName: newSession.worldName, playerCount: newSession.playerCount});
// 	});

// 	// Functions to give requested information to clients
// 	// - Send list of players active in a session
// 	// - Send requested level data
// 	// - Send a preview of a level (?)
// 	socket.on("getSessionPlayers", function (data) {
// 		// data - id of session to get current players of
// 		var session = getSessionByID(data);
// 		socket.emit("sessionPlayers", {"id": session.id, "players": session.currentPlayers});
// 	});
// 	socket.on("getWorldData", function (data) {
// 		// data - id of world to send
// 		var world = getWorldByID(data);
// 		socket.emit("worldData", world);
// 	});
// 	socket.on("getLevelPreview", function (data) {
// 		// data - name of level to send preivew
// 	});
// 	socket.on("joinSession", function (data) {
// 		// data - id of session to join
// 		var session = getSessionByID(data);
// 		// Send world data
// 		socket.emit("worldData", session.ExportWorld());
// 		// Add player to session
// 		// session.CreatePlayerEntity();

// 		// Join the socket.io room for this session
// 		this.roomName = "session_room " + session.id;
// 		socket.join(this.roomName);
// 		this.inSession = true;
// 		this.curSession = session;
// 	});
// 	socket.on("createNewLevel", function (data) {
// 		if (this.inSession)
// 		{
// 			this.curSession.levelCounter += 1;
// 			var blankLevelData = {
// 				name: "level name",
// 				id: this.curSession.levelCounter,
// 				entityDatas: [],
// 				areaDatas: [],
// 			}
// 			var newLevel = this.curSession.AddLevel(blankLevelData);
// 			this.inLevel = true;
// 			this.curLevel = newLevel;
// 			// io.to(this.roomName).emit("newLevel", levelID);
// 			var levelData = newLevel.Export();
// 			io.to(this.roomName).emit("newLevel", levelData)
// 			socket.emit("enterLevel", newLevel.id);
// 		}
// 	});
// 	socket.on("joinLevel", function (data) {
// 		if (this.inSession)
// 		{
// 			var joinedLevel = this.curSession.GetLevelByID(data);
// 			socket.emit("enterLevel", joinedLevel.id);
// 			this.inLevel = true;
// 			this.curLevel = joinedLevel;
// 		}
// 	});
// 	socket.on("createNewArea", function (data) {
// 		if (this.inSession && this.inLevel)
// 		{
// 			this.curLevel.areaCounter += 1;
// 			var blankAreaData = {
// 				id: this.curLevel.areaCounter,
// 				x: data.x,
// 				y: data.y,
// 				z: data.z,
// 				xSize: 5,
// 				ySize: 5,
// 				zSize: 5,
// 				settings: [],
// 				map: [],
// 				extra: [],
// 				style: [],
// 				rules: [],
// 				templates: [],
// 			};
// 			var area = this.curLevel.AddArea(blankAreaData);

// 			var areaData = area.Export();
// 			io.to(this.roomName).emit("newArea", {levelID: this.curLevel.id, areaData: areaData});
// 		}
// 	});
// 	socket.on("createNewEntity", function (data) {
// 		if (this.inSession && this.inLevel)
// 		{
// 			this.curLevel.entityCounter += 1;
// 			var blankEntityData = {
// 				id: this.curLevel.entityCounter,
// 				x: data.x,
// 				y: data.y,
// 				z: data.z,
// 				settings: [],
// 				style: [],
// 				variables: [],
// 				rules: [],
// 				templates: [],
// 				variableCounter: 0,
// 			};
// 			var entity = this.curLevel.AddEntity(blankEntityData);

// 			var entityData = entity.Export();
// 			io.to(this.roomName).emit("newEntity", {levelID: this.curLevel.id, entityData: entityData});
// 		}
// 	});
// 	socket.on("testAsPlayer", function (data) {
// 		if (this.inSession && this.inLevel)
// 		{
// 			this.curLevel.entityCounter += 1;
// 			var newPlayerData = {
// 				id: this.curLevel.entityCounter,
// 				x: data.x,
// 				y: data.y,
// 				z: data.z,
// 				style: [],
// 				settings: [],
// 				variables: [],
// 				rules: [],
// 				templates: [],
// 			}
// 			var newPlayer = this.curLevel.AddEntity(newPlayerData);
// 			io.to(this.roomName).emit("newEntity", {levelID: this.curLevel.id, entityData: newPlayerData});
// 			socket.emit("assignPlayerEntity", newPlayer.id);
// 			this.inPlayer = true;
// 			this.curPlayer = newPlayer;
// 		}
// 	});
// 	socket.on("stopTestingPlayer", function () {
// 		exitPlayer(this);
// 	});
// 	socket.on("exitLevel", function () {
// 		this.inLevel = false;
// 		this.curLevel = undefined;
// 	});
// 	socket.on("exitSession", function () {
// 		this.inSession = false;
// 		this.curSession = undefined;
// 	});

// 	socket.on("tileChange", function (data) {
// 		if (this.inSession && this.inLevel)
// 		{
// 			var levelID = data.levelID;
// 			var areaID = data.areaID;
// 			var tileData = data.tileData;
// 			this.curSession.EditTile(levelID, areaID, tileData);
// 			io.to(this.roomName).emit("tileChange", data);
// 		}
// 	});

// 	socket.on("inputUpdate", function (data) {
// 		// Player has changed their input keys
// 		if (this.inSession && this.inLevel && this.inPlayer)
// 		{
// 			this.curPlayer.SetMoveDirections(data.up, data.down, data.left, data.right);
// 			data.entityID = this.curPlayer.id;
// 			data.levelID = this.curLevel.id;
// 			socket.broadcast.to(this.roomName).emit("inputUpdate", data);
// 		}
// 	});

// 	socket.on("locationCorrection", function (data) {
// 		// Player sends a location correction periodically (every few seconds)
// 		// Smoothly adjust player's location to the correction location
// 		if (this.inSession && this.inLevel && this.inPlayer)
// 		{
// 			this.curPlayer.SetLocationCorrection(data.x, data.y, data.z, data.xMov, data.yMov, data.zMov, data.moveTime, data.moveDuration);
// 			data.entityID = this.curPlayer.id;
// 			data.levelID = this.curLevel.id;
// 			socket.broadcast.to(this.roomName).emit("locationCorrection", data);
// 		}
// 	});

// 	socket.on("deleteArea", function (data) {
// 		if (this.inSession && this.inLevel)
// 		{
// 			var level = this.curSession.GetLevelByID(data.levelID);
// 			level.RemoveArea(data.areaID);
// 			io.to(this.roomName).emit("deleteArea", data);
// 		}
// 	});

// 	socket.on("entityChange", function (data) {
// 		if (this.inSession && this.inLevel)
// 		{
// 			io.to(this.roomName).emit("entityChange", data);
// 			this.curSession.ChangeEntity(data.levelID, data.entityID, data.entityData);
// 		}
// 	});

// 	socket.on("message", function (data) {
// 		// Player has sent a message
// 		// data - text of message sent by player
// 		timeLog("Player: " + this.curPlayer.id + " sent a message: " + data);
// 		if (this.inSession && this.inLevel && this.inPlayer)
// 		{
// 			// this.curPlayer.SetMoveDirections(data.up, data.down, data.left, data.right);
// 			messageObj = {text: data, entityID: this.curPlayer.id, levelID: this.curLevel.id};
// 			socket.broadcast.to(this.roomName).emit("message", messageObj);
// 		}
// 		// // data - chat message sent by player
// 		// // Set the id and send it out to all other players
// 		// data.id_player = socket.id;
// 		// socket.broadcast.emit("message", data);
// 	});

// 	socket.on("throwBall", function (data) {
// 		if (this.inSession && this.inLevel && this.inPlayer)
// 		{
// 			ballThrowObj = {ballData: data, entityID: this.curPlayer.id, levelID: this.curLevel.id};
// 			socket.broadcast.to(this.roomName).emit("throwBall", ballThrowObj);
// 		}
// 	});

// });

// Functions for client to call
// function exitPlayer (client) {
// 	if (client.inSession && client.inLevel && client.inPlayer)
// 	{
// 		io.to(client.roomName).emit("removeEntity", {levelID: client.curLevel.id, entityID: client.curPlayer.id});
// 		client.curSession.RemoveEntity(client.curLevel.id, client.curPlayer.id)
// 		client.inPlayer = false;
// 		client.curPlayer = undefined;
// 	}
// }


// Gameplay loop
function mainUpdate () {
	setTimeout(MainUpdate, 16);

	for (var i = 0; i < sessionList.length; i++) {
		var session = sessionList[i];
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
	timeLog("\x1b[36m");
	timeLog("░░░░░░░░░░░░▄▐ ");
	timeLog("░░░░░░▄▄▄░░▄██▄ ");
	timeLog("░░░░░▐▀█▀▌░░░░▀█▄ ");
	timeLog("░░░░░▐█▄█▌░░░░░░▀█▄ ");
	timeLog("░░░░░░▀▄▀░░░▄▄▄▄▄▀▀ ");
	timeLog("░░░░▄▄▄██▀▀▀▀ ");
	timeLog("░░░█▀▄▄▄█░▀▀ ");
	timeLog("░░░▌░▄▄▄▐▌▀▀▀ ");
	timeLog("▄░▐░░░▄▄░█░▀▀ U HAVE BEEN SPOOKED BY THE ");
	timeLog("▀█▌░░░▄░▀█▀░▀ ");
	timeLog("░░░░░░░▄▄▐▌▄▄ ");
	timeLog("░░░░░░░▀███▀█░▄ ");
	timeLog("░░░░░░▐▌▀▄▀▄▀▐▄ SPOOKY SKILENTON ");
	timeLog("░░░░░░▐▀░░░░░░▐▌ ");
	timeLog("░░░░░░█░░░░░░░░█ ");
	timeLog("░░░░░▐▌░░░░░░░░░█ ");
	timeLog("░░░░░█░░░░░░░░░░▐▌");
	timeLog('\x1b[0m')
}
