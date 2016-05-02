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
	res.end("This is the Bine server - use <a>kramff.github.io</a>");
}
var server = http.createServer(listener)
server.listen(process.env.PORT || 5000);

var io = socketio(server);

var motd = "Join or create a session!";


var levels = [];
var sessions = [];

function ImportLevel (levelData) {
	//import a levelData string into the current level
	var importedData = JSON.parse(levelData);
	if (importedData === null)
	{
		console.log("null levelData");
		return;
	}
	ClearLevel();

	for (var i = 0; i < importedData.areas.length; i++)
	{
		areaData = importedData.areas[i];
		var newArea = new Area(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize, true, areaData.map);
		areas.push(newArea);
		// drawObjects.push(newArea);
	}
	//player = new Entity(importedData.player.x, importedData.player.y, importedData.player.z);
	//entities.push(player);
}

function ExportLevel () {
	//export the current level to a levelData string
	var levelData = {areas:[], player:{x: 33, y: 16, z: -3}};
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		var dataObj = {
			x: area.x,
			y: area.y,
			z: area.z,
			xSize: area.xSize,
			ySize: area.ySize,
			zSize: area.zSize,
			map: area.map,
			rules: 0
		};
		levelData.areas.push(dataObj); 
	}
	return JSON.stringify(levelData);
}

function ReceiveTileChange (tileChange) {
	ActualEditTile(tileChange.editX, tileChange.editY, tileChange.editZ, tileChange.tile);
	mainLevelNeedsExport = true;
}
function ReceiveCreateArea (createArea) {
	ActualCreateArea(createArea.x, createArea.y, createArea.z, createArea.xSize, createArea.ySize, createArea.zSize);
	mainLevelNeedsExport = true;
}
function ReceiveRemoveArea (removeArea) {
	ActualRemoveAreaAt(removeArea.x, removeArea.y, removeArea.z);
	mainLevelNeedsExport = true;
}
function GetAreaByName (name) {
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (area.name === name)
		{
			return area;
		}
	}
	return undefined;
}
function SetTile (area, x, y, z, tile) {
	var prevTile = area.map[x][y][z];
	if (tile === prevTile)
	{
		// No change needed
		return false;
	}
	area.map[x][y][z] = tile;
	switch (tile)
	{
		default:
			area.extraData[x][y][z] = {};
		break
		case APPEAR_BLOCK:
			area.extraData[x][y][z] = {opacity: 0};
		break;
		case DISAPPEAR_BLOCK:
			area.extraData[x][y][z] = {opacity: 1};
		break;
		case PATTERN_BLOCK:
			area.extraData[x][y][z] = {pattern: 0};
		break;
		case PATTERN_EFFECT_BLOCK:
			area.extraData[x][y][z] = {opacity: 0};
		break;
		case PATTERN_HOLE_BLOCK:
			area.extraData[x][y][z] = {opacity: 1};
		break;
		case SIMULATION_BLOCK:
			area.extraData[x][y][z] = {prevSim: 0, newSim: 0};
			area.simulate = true;
		break;
		case FLUID_BLOCK:
			area.extraData[x][y][z] = {prevFill: 0.1, newFill: 0.1, prevflow: [0, 0, 0, 0, 0, 0], newFlow: [0, 0, 0, 0, 0, 0]};
			area.simulate = true;
		break;
	}
}
function ActualEditTile (editX, editY, editZ, tile) {
	var targetArea;
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (LocationInArea(area, editX, editY, editZ))
		{
			if (area === selectedArea)
			{
				//Selected area: affect
				SetTile(area, editX - area.x, editY - area.y, editZ - area.z, tile);
				return;
			}
			else if (targetArea === undefined)
			{
				targetArea = area;
			}
		}
	}
	if (targetArea !== undefined)
	{
		SetTile(targetArea, editX - targetArea.x, editY - targetArea.y, editZ - targetArea.z, tile);
	}
}
function ActualCreateArea (x, y, z, xSize, ySize, zSize) {
	var newArea = new Area(x, y, z, xSize, ySize, zSize);
	areas.push(newArea);
	console.log("Actual Create Done, newArea.name is " + newArea.name);
	return newArea;
}
function ActualRemoveAreaAt (x, y, z) {
 	for (var i = 0; i < areas.length; i++)
 	{
 		var area = areas[i];
 		if (LocationInArea(area, x, y, z))
 		{
 			console.log("Actual Remove Done, removed area.name is " + area.name);
 			areas.splice(areas.indexOf(area), 1);
 			return; //Only remove 1 area at a time
 		}
 	}
}
function LocationInArea (area, x, y, z) {
	if (area.x <= x && x < area.x + area.xSize)
	{
		if (area.y <= y && y < area.y + area.ySize)
		{
			if (area.z <= z && z < area.z + area.zSize)
			{
				return true;
			}
		}
	}
	return false;
}
function GetAreasAtPosition (x, y, z, getName) {
	var areasHere = [];
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (LocationInArea(area, x, y, z))
		{
			if (getName === true)
			{
				if (area === selectedArea)
				{
					areasHere.push("~" + area.name.toUpperCase() + "~");
				}
				else
				{
					areasHere.push(area.name);
				}
			}
			else
			{
				areasHere.push(area);
			}
		}
	}
	return areasHere;
}




ImportLevel(mainLevelData.data);



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

var sessions = [];

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
	for (var i = 0; i < playerArray.length; i++)
	{
		socket.emit("playerMove", playerArray[i]);
	}

	//Temporary main level
	// if (mainLevelNeedsExport)
	// {
		// mainLevelData = {name: "cool_level", data: ExportLevel()};
		// socket.emit("chosenLevel", mainLevelData);
		// mainLevelNeedsExport = false;
	// }
	// else
	// {
		// socket.emit("chosenLevel", mainLevelData);
	// }

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