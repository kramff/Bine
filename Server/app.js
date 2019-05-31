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


// Connected players
var playerList = [];
var playerNum = 0;


// ws stuff starts here

// Player - user that connects to server. Can join a room to access a session, and control an entity inside that session.
function Player (ws) {
	this.ws = ws;
	this.id = playerNum;
	playerNum += 1;

	this.room = undefined;
	this.session = undefined;
	this.level = undefined;
	this.playerEntity = undefined;
	playerList.push(this);
}

Player.prototype.disconnect = function () {
	if (this.session !== undefined && this.level !== undefined && this.playerEntity !== undefined) {
		this.session.DeleteEntity(this.level.id, this.playerEntity.id);
	}
	if (this.room !== undefined) {
		var roomToLeave = this.room;
		this.exitRoom();
		if (this.level !== undefined && this.playerEntity !== undefined) {
			roomToLeave.sendDataRoom("deleteEntity", {levelID: this.level.id, entityID: this.playerEntity.id});
		}
	}
	this.session = undefined;
	this.level = undefined;
	this.playerEntity = undefined;
	playerList.splice(playerList.indexOf(this), 1);
}
Player.prototype.sendData = function (type, data) {
	var stringData = JSON.stringify({type: type, data: data});
	//console.log("Sending Data");
	//console.log(type);
	//console.log(data);
	try {
		this.ws.send(stringData);
	}
	catch (e) {
		console.log("Error in sending data");
	}
}
// Join a room
Player.prototype.joinRoom = function (room) {
	if (room !== undefined) {
		room.addPlayer(this);
		this.room = room;
	}
};
// Exit a room
Player.prototype.exitRoom = function () {
	if (this.room !== undefined) {
		this.room.deletePlayer(this);
		this.room = undefined;
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
		return (room.id === roomID);
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
	this.id = roomNum;
	roomNum += 1;
}

// Add a player to the players list. (Called by Player.joinRoom() )
Room.prototype.addPlayer = function (player) {
	this.players.push(player);
};

// Delete a player from the players list. (Called by Player.exitRoom() )
Room.prototype.deletePlayer = function (player) {
	this.players.splice(this.players.indexOf(player), 1);
};

// Send data to all the players in this room
Room.prototype.sendDataRoom = function(type, data) {
	this.players.forEach(function (player) {
		player.sendData(type, data);
	});
};


// Initial Setup:

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

// Create a starting session for each saved world
for (var i = 0; i < worldList.length; i++) {
	var startingWorldData = worldList[i];
	var newSession = new Session("Test Session #" + sessionNum, startingWorldData);
	newSession.id = sessionNum;
	timeLog("created starting session! session name: " + newSession.name);
	sessionList.push(newSession);
	var newRoom = new Room(newSession);
	roomList.push(newRoom);
	sessionNum += 1;
}


// Socket connection:

wss.on("connection", function connection (ws) {

	var player = new Player(ws);

	timeLog("Player connected! ID: " + player.id);

	ws.on("message", function incoming (message) {
		try {
			var mData = JSON.parse(message);
			handleMessageData(player, mData.type, mData.data);
		}
		catch (err) {
			console.error(err);
			console.log("Error from the following incoming message: ");
			console.log(message);
		}
	});

	ws.on("close", function close () {
		timeLog("Player disconnected! ID: " + player.id);
		player.disconnect();
	});

	player.sendData("motd", motd);
	player.sendData("worldList", worldList.map(function (world) {return world.id;}));
	player.sendData("sessionList", sessionList.map(function (session) {return {id: session.id, name: session.name, mode: session.mode, worldName: session.worldName, playerCount: session.playerCount};}));
});

function handleMessageData (player, type, data) {
	if (type === "createSessionNewWorld") {
		// data - {name: "(name here)"}
		var emptyWorldData = {levelDatas: [], tileData: [], worldRules: [], entityTemplates: [], areaTemplates: [], itemData: []};

		// Should use data.name
		var newSession = new Session("Session #" + sessionNum, emptyWorldData);
		newSession.id = sessionNum;
		timeLog("created session! session name: " + newSession.name);
		sessionList.push(newSession);
		sessionNum += 1;

		player.session = newSession;

		// Send player the world data for the created session
		player.sendData("worldData", newSession.ExportWorld());

		// Make the room for this session and join it
		var newRoom = new Room(newSession);
		roomList.push(newRoom);
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

		// Keep track of session for player
		player.session = session;

		// Join the socket.io room for this session
		var room = getRoomBySession(session);
		// console.log("getRoomBySession returns room: " + room);
		
		player.joinRoom(room);
	}
	else if (type === "createNewLevel") {
		if (player.session !== undefined) {
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
			player.room.sendDataRoom("newLevel", levelData);

			// Put the player into this room
			player.sendData("enterLevel", newLevel.id);
		}
	}
	else if (type === "joinLevel") {
		var joinedLevel = player.session.GetLevelByID(data);
		player.sendData("enterLevel", joinedLevel.id);
		player.level = joinedLevel;
	}
	else if (type === "createArea") {
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
		player.room.sendDataRoom("createArea", {levelID: player.level.id, areaData: areaData});
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
		player.room.sendDataRoom("deleteEntity", {levelID: player.level.id, entityID: player.playerEntity.id});
		player.session.DeleteEntity(player.level.id, player.playerEntity.id);
		player.playerEntity = undefined;
	}
	else if (type === "exitLevel") {
		player.level = undefined;
	}
	else if (type === "exitSession") {
		player.session = undefined;
		// Leave the room as well
		player.exitRoom();
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
		data.entityID = player.playerEntity.id;
		data.levelID = player.level.id;
		player.room.sendDataRoom("locationCorrection", data);
	}
	else if (type === "deleteArea") {
		var level = player.session.GetLevelByID(data.levelID);
		level.DeleteArea(data.areaID);
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
}

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
if (false) {
	MainUpdate();
}


if (Math.random() > 0.99) {
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
