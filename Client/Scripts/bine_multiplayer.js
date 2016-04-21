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
		socket.on("serverLevels", function (data) {
			serverLevels = data;
			console.log("Server levels: " + serverLevels);
		});
		socket.on("playerMove", function (data) {
			UpdatePlayer(data);
		});
		socket.on("disconnection", function (data) {
			console.log("player disconnected");
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
		socket.on("chosenLevel", function (data) {
			console.log("got chosen level from server");
			ImportLevel(data.data);
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


//Functions to apply incoming data to game state
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
	ActualEditTile(tileChange.editX, tileChange.editY, tileChange.editZ, tileChange.tile)
}
function ReceiveCreateArea (createArea) {
	ActualCreateArea(createArea.x, createArea.y, createArea.z, createArea.xSize, createArea.ySize, createArea.zSize);
}
function ReceiveRemoveArea (removeArea) {
	ActualRemoveAreaAt(removeArea.x, removeArea.y, removeArea.z);
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