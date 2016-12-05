// bine_multiplayer.js
// stuff for interacting with server

// Server stuff

// motd: message of the day (string)
var motd = "";

// serverLevels: list of levels available from server.
// [{name, curPlayers}, ...]
var serverLevels = [];

// downloadedLevel: most recently downloaded level (in json string data form (?))
var downloadedLevel = "";

var usingServerLevel = false;

// playerArray: other players in the same server level
// [{id, name, color, x, y, z}, ...]
var playerArray = [];

// receivedMessages: recently received messages
// [{id, text, timestamp, misc}, ...]
// misc: {utterance, ...other effects go here}
var receivedMessages = [];



// socket.io connection
var MULTI_ON = false;

function SocketInit (argument) {
	
	var socketScript = document.createElement("script");
	if (location.href === "http://kramff.github.io/")
	{
		// Web
		socketScript.setAttribute("src", "https://bine-online.herokuapp.com/socket.io/socket.io.js");
	}
	else
	{
		// Local
		socketScript.setAttribute("src", "http://localhost:5000/socket.io/socket.io.js");
	}
	document.getElementsByTagName('body')[0].appendChild(socketScript);
	socketScript.onreadystatechange = LoadSScript;
	socketScript.onload = LoadSScript;
}

var ssLoaded = false;
function LoadSScript () {
	if (!ssLoaded)
	{
		ssLoaded = true;
		InitSocketConnection();
	}
}

var socket = undefined;
function InitSocketConnection (argument) {
	try
	{
		if (location.href === "http://kramff.github.io/")
		{
			socket = io("bine-online.herokuapp.com")
		}
		else
		{
			socket = io("http://localhost:5000");
		}
		socket.on("connect", function (data) {
			console.log("Connected to server with id: " + socket.id);
		});
		socket.on("motd", function (data) {
			motd = data;
			console.log("Message of the day: " + motd);
			// Show MOTD
		});
		// socket.on("serverLevels", function (data) {
		// 	serverLevels = data;
		// 	console.log("Server levels: " + serverLevels);
		// });
		socket.on("worldList", function (data) {
			FillWorldBox(data);
		});
		socket.on("sessionList", function (data) {
			FillSessionBox(data);
		});
		socket.on("playerMove", function (data) {
			UpdatePlayer(data);
		});
		socket.on("disconnection", function (data) {
			RemovePlayer(data);
		});
		socket.on("message", function (data) {
			ReceiveChatMessage(data);
		});

		// Level editor
		socket.on("tileChange", function (data) {
			ReceiveTileChange(data);
		});
		socket.on("createArea", function (data) {
			ReceiveCreateArea(data);
		});
		socket.on("removeArea", function (data) {
			ReceiveRemoveArea(data);
		});

		//Temporary level direct download
		// socket.on("chosenLevel", function (data) {
		// 	console.log("got chosen level from server");
		// 	ImportLevel(data.data);
		// });

		// Receive world data from server
		socket.on("worldData", function (data) {
			console.log("Got world data from server!");
			ReceiveWorldData(data);
		});




		socket.on("newLevel", function (data) {
			// Create new level
			ReceiveCreateLevel(data);
		});
		socket.on("enterLevel", function (data) {
			// Enter a level
			ReceiveEnterLevel(data);
		});

		socket.on("newArea", function (data) {
			// Create a new area
			ReceiveCreateArea(data.levelID, data.areaData);
		});

		socket.on("newEntity", function (data) {
			// Create a new entity
			ReceiveCreateEntity(data.levelID, data.entityData);
		});
		socket.on("assignPlayerEntity", function (data) {
			// Set the curPlayer to the given entity
		});

		

		MULTI_ON = true;

	}
	catch (err)
	{
		console.error("server not up");
		console.error(err);
		MULTI_ON = false;
	}
}

var lastData = undefined;
//Functions to apply incoming data to game state
function ReceiveWorldData (worldData) {
	lastData = worldData;
	// Import the world etc...
	inSession = true;
	// curSession = new Session("The Session", JSON.parse(worldData));
	curSession = new Session("The Session", worldData);

	// Update the levelbox to list out the available levels
	FillLevelBox(curSession.levels);
}
function UpdatePlayer (playerData) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id === playerData.id)
		{
			// playerArray[i] = playerData;
			playerArray[i].x = playerData.x;
			playerArray[i].y = playerData.y;
			playerArray[i].z = playerData.z;
			return;
		}
	}
	//New player
	playerArray.push(playerData);
	//Add to draw objects

	drawObjects.push(playerData);
	console.log("New player");
}
function RemovePlayer (playerData) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id === playerData.id)
		{
			drawObjects.splice(drawObjects.indexOf(playerArray[i]), 1)
			playerArray.splice(i, 1);
			return;
		}
	}
}
function ReceiveChatMessage (message) {
	console.log(message.text)
	TextToSpeech(message.text);
	AddMessage(message);
}
function ReceiveTileChange (tileChange) {
	// var area = GetAreaByName(tileChange.name);
	// ActualEditTile(tileChange.editX, tileChange.editY, tileChange.editZ, tileChange.tile)
	var levelID = tileChange.levelID;
	var areaID = tileChange.areaID;
	var tileData = tileChange.tileData;
	curSession.EditTile(levelID, areaID, tileData);
}
function ReceiveCreateArea (levelID, areaData) {
	// var areaData = createAreaInLevel.areaData
	// var levelID = createAreaInLevel.levelID;
	// ActualCreateArea(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize);
	var level = curSession.GetLevelByID(levelID);
	level.AddArea(areaData);
}
function ReceiveRemoveArea (removeArea) {
	// ActualRemoveAreaAt(removeArea.x, removeArea.y, removeArea.z);
}
function ReceiveCreateLevel (levelData) {
	// var levelID = newLevelData.id;
	// curSession.AddLevelWithID(levelID);
	curSession.AddLevel(levelData);
}
function ReceiveEnterLevel (levelID) {
	inLevel = true;
	curLevel = curSession.GetLevelByID(levelID);
}

function ReceiveCreateEntity (levelID, entityData) {
	var level = curSession.GetLevelByID(levelID);
	level.AddEntity(entityData);
}

// Functions to send data to server
function SendPositionUpdate (position) {
	if (MULTI_ON)
	{
		socket.emit("playerMove", position);
	}
}
function SendChatMessage (message) {
	if (MULTI_ON)
	{
		socket.emit("message", message);
		// message.id = socket.id;	
	}
}
function SendTileChange (tileChange) {
	if (MULTI_ON)
	{
		socket.emit("tileChange", tileChange);
	}
}
function SendCreateArea (createArea) {
	if (MULTI_ON)
	{
		socket.emit("createArea", createArea);
	}
}
function SendRemoveArea (removeArea) {
	if (MULTI_ON)
	{
		socket.emit("removeArea", removeArea);
	}
}

function CreateSessionNewWorld () {
	if (MULTI_ON)
	{
		socket.emit("createSessionNewWorld");
	}
}
function JoinSession (id) {
	if (MULTI_ON)
	{
		socket.emit("joinSession", id);
	}
}

function CreateNewLevel () {
	if (MULTI_ON)
	{
		socket.emit("createNewLevel");
	}
	else
	{
		// create a level locally
	}
}

function JoinLevel (levelID) {
	if (MULTI_ON)
	{
		socket.emit("joinLevel", levelID);
	}
	else
	{
		//
	}
}

function CreateNewArea () {
	if (MULTI_ON)
	{
		socket.emit("createNewArea");
	}
}

function TestAsPlayer () {
	if (MULTI_ON)
	{
		socket.emit("testAsPlayer");
	}
}

function ExitLevel () {
	if (MULTI_ON)
	{
		socket.emit("exitLevel");
	}
}

function ExitSession () {
	if (MULTI_ON)
	{
		socket.emit("exitSession");
	}
}