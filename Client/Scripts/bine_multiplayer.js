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


var MULTI_ON = false;

function initSocket () {
	InitSocketConnection();
}


// TODO: Remove this
// function oldSocketInit () {

// 	// Skipping this step
// 	// InitSocketConnection();
// 	// return;
	
// 	var socketScript = document.createElement("script");
// 	if (location.href === "http://kramff.github.io/")
// 	{
// 		// Web for github.io
// 		socketScript.setAttribute("src", "https://bine-online.herokuapp.com/socket.io/socket.io.js");
// 	}
// 	else if (location.href.indexOf("http://www.kramff.com/Bine/") !== -1)
// 	{
// 		// Web for kramff.com
// 		socketScript.setAttribute("src", "https://bine.nfshost.com/socket.io/socket.io.js");
// 	}
// 	else if (location.href.indexOf("file:/") !== -1)
// 	{
// 		// Local file
// 		socketScript.setAttribute("src", "http://localhost:5000/socket.io/socket.io.js");
// 	}
// 	else
// 	{
// 		// Hosting off some dumb custom server
// 		// socketScript.setAttribute("src", location.href.replace(/\d+\/$/, "5000/socket.io/socket.io.js"));
// 		socketScript.setAttribute("src", (location.protocol + "//" + location.host + "/").replace(/\d+\/$/, "5000/socket.io/socket.io.js").replace("http://", httpProtocol));
// 	}
// 	document.getElementsByTagName('body')[0].appendChild(socketScript);
// 	socketScript.onreadystatechange = LoadSScript;
// 	socketScript.onload = LoadSScript;
// }

// var ssLoaded = false;
// function LoadSScript () {
// 	if (!ssLoaded)
// 	{
// 		ssLoaded = true;
// 		InitSocketConnection();
// 	}
// }

// Currently: using http and not websockets
var wsOption = {transports: ["websocket"]};
var noOption = {};
var wsProtocol = "ws://";
var httpProtocol = "http://";


var socket = undefined;
function InitSocketConnection () {
	try
	{
		var socketURL;
		if (location.href === "http://kramff.github.io/")
		{
			// socket = io(httpProtocol + "bine-online.herokuapp.com", noOption);
			socketURL = wsProtocol + "bine-online.herokuapp.com";
		}
		else if (location.href.indexOf("http://www.kramff.com/Bine/") !== -1)
		{
			// socket = io(httpProtocol + "bine.nfshost.com", noOption);
			socketURL = wsProtocol + "bine.nfshost.com";
		}
		else if (location.href.indexOf("file:/") !== -1)
		{
			// socket = io(httpProtocol + "localhost:5000", noOption);
			socketURL = wsProtocol + "localhost:5000";
		}
		else
		{
			// socket = io(location.href.replace(/\d+\/$/, "5000").replace("http://", httpProtocol), noOption);
			// socket = io((location.protocol + "//" + location.host + "/").replace(/\d+\/$/, "5000").replace("http://", httpProtocol), noOption);
			socketURL = (location.protocol + "//" + location.host + "/").replace(/\d+\/$/, "5000").replace("http://", wsProtocol);
		}
		socket = new WebSocket(socketURL);
		socket.onopen = function (data) {
			// console.log("Connected to server with id: " + socket.id);
			console.log("Connected to server!");

			// Waiting until connected to server
			// before directly joining session
			if (waitingToDirectConnect)
			{
				JoinSession(sessionDirectLinkID);
			}
		}
		socket.onmessage = function (event) {
			event.data;
			handleMessageData(event.data.type, event.data.data);
		}
		// socket.on("motd", function (data) {
		// 	motd = data;
		// 	console.log("Message of the day: " + motd);
		// 	// Show MOTD
		// });
		// // socket.on("serverLevels", function (data) {
		// // 	serverLevels = data;
		// // 	console.log("Server levels: " + serverLevels);
		// // });
		// socket.on("worldList", function (data) {
		// 	FillWorldBox(data);
		// });
		// socket.on("sessionList", function (data) {
		// 	FillSessionBox(data);
		// });
		// // socket.on("playerMove", function (data) {
		// // 	UpdatePlayer(data);
		// // });
		// // socket.on("disconnection", function (data) {
		// // 	RemovePlayer(data);
		// // });
		// socket.on("message", function (data) {
		// 	ReceiveChatMessage(data);
		// });

		// // Level editor
		// socket.on("tileChange", function (data) {
		// 	ReceiveTileChange(data);
		// });
		// socket.on("createArea", function (data) {
		// 	ReceiveCreateArea(data);
		// });
		// socket.on("deleteArea", function (data) {
		// 	ReceiveDeleteArea(data.levelID, data.areaID);
		// });

		// //Temporary level direct download
		// // socket.on("chosenLevel", function (data) {
		// // 	console.log("got chosen level from server");
		// // 	ImportLevel(data.data);
		// // });

		// // Receive world data from server
		// socket.on("worldData", function (data) {
		// 	console.log("Got world data from server!");
		// 	ReceiveWorldData(data);

		// 	// Waiting until connected to server, then session
		// 	// before directly joining level
		// 	if (waitingToDirectConnect)
		// 	{
		// 		JoinLevel(levelDirectLinkID);
		// 	}
		// });



		// socket.on("newSession", function (data) {
		// 	// Create new session (Add it to the list of sessions to join)
		// 	AddSingleSessionToBox(data);
		// });

		// socket.on("newLevel", function (data) {
		// 	// Create new level
		// 	ReceiveCreateLevel(data);
		// });
		// socket.on("enterLevel", function (data) {
		// 	// Enter a level
		// 	ReceiveEnterLevel(data);

		// 	// After directly connecting to the server, then session, then level
		// 	// Create a player entity
		// 	if (waitingToDirectConnect)
		// 	{
		// 		TestAsPlayer();
		// 	}

		// });

		// socket.on("newArea", function (data) {
		// 	// Create a new area
		// 	ReceiveCreateArea(data.levelID, data.areaData);
		// });

		// socket.on("newEntity", function (data) {
		// 	// Create a new entity
		// 	ReceiveCreateEntity(data.levelID, data.entityData);
		// });
		// socket.on("assignPlayerEntity", function (data) {
		// 	// Set the curPlayerID and curPlayer to the given entity
		// 	ReceiveAssignPlayer(data);
		// });
		// socket.on("removeEntity", function (data) {
		// 	// Remove the entity from the session
		// 	ReceiveRemoveEntity(data.levelID, data.entityID);
		// });

		// socket.on("inputUpdate", function (data) {
		// 	var level = curSession.GetLevelByID(data.levelID);
		// 	var entity = level.GetEntityByID(data.entityID);
		// 	entity.SetMoveDirections(data.up, data.down, data.left, data.right);
		// });

		// socket.on("locationCorrection", function (data) {
		// 	var level = curSession.GetLevelByID(data.levelID);
		// 	var entity = level.GetEntityByID(data.entityID);
		// 	entity.SetLocationCorrection(data.x, data.y, data.z, data.xMov, data.yMov, data.zMov, data.moveTime, data.moveDuration);
		// });

		// socket.on("entityChange", function (data) {
		// 	RecieveEntityChange(data.levelID, data.entityID, data.entityData);
		// });

		// socket.on("throwBall", function (data) {
		// 	RecieveThrowBall(data.levelID, data.entityID, data.ballData);
		// });

		

		MULTI_ON = true;

	}
	catch (err)
	{
		console.error("server not up");
		console.error(err);
		MULTI_ON = false;
	}
}

function handleMessageData (type, data) {
	if (type === "motd") {
		motd = data;
		console.log("Message of the day: " + data);
	}
	if (type === "worldList") {
		FillWorldBox(data);
	}
	if (type === "sessionList") {
		FillSessionBox(data);
	}
	if (type === "message") {
		ReceiveChatMessage(data);
	}
	// Level editor
	if (type === "tileChange") {
		ReceiveTileChange(data);
	}
	if (type === "createArea") {
		ReceiveCreateArea(data);
	}
	if (type === "deleteArea") {
		ReceiveDeleteArea(data.levelID, data.areaID);
	}
	// Receive world data from server
	if (type === "worldData") {
		console.log("Got world data from server!");
		ReceiveWorldData(data);

		// Waiting until connected to server, then session
		// before directly joining level
		if (waitingToDirectConnect)
		{
			JoinLevel(levelDirectLinkID);
		}
	};

	if (type === "newSession") {
		// Create new session (Add it to the list of sessions to join)
		AddSingleSessionToBox(data);
	};

	if (type === "newLevel") {
		// Create new level
		ReceiveCreateLevel(data);
	}
	if (type === "enterLevel") {
		// Enter a level
		ReceiveEnterLevel(data);

		// After directly connecting to the server, then session, then level
		// Create a player entity
		if (waitingToDirectConnect)
		{
			TestAsPlayer();
		}

	}

	if (type === "newArea") {
		// Create a new area
		ReceiveCreateArea(data.levelID, data.areaData);
	}

	if (type === "newEntity") {
		// Create a new entity
		ReceiveCreateEntity(data.levelID, data.entityData);
	}
	if (type === "assignPlayerEntity") {
		// Set the curPlayerID and curPlayer to the given entity
		ReceiveAssignPlayer(data);
	}
	if (type === "removeEntity") {
		// Remove the entity from the session
		ReceiveRemoveEntity(data.levelID, data.entityID);
	}

	if (type === "inputUpdate") {
		var level = curSession.GetLevelByID(data.levelID);
		var entity = level.GetEntityByID(data.entityID);
		entity.SetMoveDirections(data.up, data.down, data.left, data.right);
	}

	if (type === "locationCorrection") {
		var level = curSession.GetLevelByID(data.levelID);
		var entity = level.GetEntityByID(data.entityID);
		entity.SetLocationCorrection(data.x, data.y, data.z, data.xMov, data.yMov, data.zMov, data.moveTime, data.moveDuration);
	}

	if (type === "entityChange") {
		RecieveEntityChange(data.levelID, data.entityID, data.entityData);
	}

	if (type === "throwBall") {
		RecieveThrowBall(data.levelID, data.entityID, data.ballData);
	}
}

var lastData = undefined;
//Functions to apply incoming data to game state
function ReceiveWorldData (worldData) {
	lastData = worldData;
	// Import the world etc...
	inSession = true;
	curSession = new Session("The Session", worldData);

	// Update the levelbox to list out the available levels
	FillLevelBox(curSession.levels);

	// Use the session to fill in the rule option buttons
	FillRuleOptions(curSession);
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
function ReceiveDeleteArea (levelID, areaID) {
	var level = curSession.GetLevelByID(levelID);
	curLevel.RemoveArea(areaID);
}
function ReceiveCreateLevel (levelData) {
	// var levelID = newLevelData.id;
	// curSession.AddLevelWithID(levelID);
	var newLevel = curSession.AddLevel(levelData);
	AddSingleLevelToBox(newLevel);
}
function ReceiveEnterLevel (levelID) {
	inLevel = true;
	curLevel = curSession.GetLevelByID(levelID);
}

function ReceiveCreateEntity (levelID, entityData) {
	var level = curSession.GetLevelByID(levelID);
	level.AddEntity(entityData);
}

function ReceiveAssignPlayer (playerID) {
	inPlayer = true;
	curPlayerID = playerID;
	curPlayer = curLevel.GetEntityByID(curPlayerID);
	editorActive = false;
	HideAllMenus();
	ShowMenu("test_level");
	xCam = curPlayer.GetX() + 0.5;
	yCam = curPlayer.GetY() + 0.5;
	zCam = curPlayer.GetZ() + 0.5;

	// Cancel touchmove if there is one
	touchWalk = false;
}

function ReceiveRemoveEntity (levelID, entityID) {
	curSession.RemoveEntity(levelID, entityID);
}

function RecieveEntityChange (levelID, entityID, entityData) {
	curSession.ChangeEntity(levelID, entityID, entityData);
}

function RecieveThrowBall (levelID, entityID, ballData) {
	var level = curSession.GetLevelByID(levelID);
	level.AddProjectile(ballData);
}


// ~~~~~~~~~~~
// Functions to send data to server

function sendData(type, data) {
	socket.send({type: type, data: data});
}

function SendTileChange (tileChange) {
	if (MULTI_ON)
	{
		// socket.emit("tileChange", tileChange);
		sendData("tileChange", tileChange);
	}
}
function SendCreateArea (createArea) {
	if (MULTI_ON)
	{
		// socket.emit("createArea", createArea);
		sendData("createArea", createArea);
	}
}
function SendRemoveArea (removeArea) {
	if (MULTI_ON)
	{
		// socket.emit("removeArea", removeArea);
		sendData("removeArea", removeArea);
	}
}
function SendInputUpdate (inputData) {
	if (MULTI_ON)
	{
		// socket.emit("inputUpdate", inputData);
		sendData("inputUpdate", inputData);
	}
}
function SendLocationCorrection (correctionData) {
	if (MULTI_ON)
	{
		// socket.emit("locationCorrection", correctionData);
		sendData("locationCorrection", correctionData);
	}
}

function CreateSessionNewWorld () {
	if (MULTI_ON)
	{
		// socket.emit("createSessionNewWorld");
		sendData("createSessionNewWorld");
	}
}
function JoinSession (id) {
	if (MULTI_ON)
	{
		// socket.emit("joinSession", id);
		sendData("joinSession", id);
	}
}

function CreateNewLevel () {
	if (MULTI_ON)
	{
		// socket.emit("createNewLevel");
		sendData("createNewLevel");
	}
	else
	{
		// create a level locally
	}
}

function JoinLevel (levelID) {
	if (MULTI_ON)
	{
		// socket.emit("joinLevel", levelID);
		sendData("joinLevel", levelID);
	}
	else
	{
		//
	}
}

function CreateNewArea (createX, createY, createZ) {
	if (MULTI_ON)
	{
		// socket.emit("createNewArea", {x: createX, y: createY, z: createZ});
		sendData("createNewArea", {x: createX, y: createY, z: createZ});
	}
}

function CreateNewEntity (createX, createY, createZ) {
	if (MULTI_ON)
	{
		// socket.emit("createNewEntity", {x: createX, y: createY, z: createZ});
		sendData("createNewEntity", {x: createX, y: createY, z: createZ});
	}
}

function TestAsPlayer () {
	if (MULTI_ON)
	{
		var zAdj = 0;
		if (curLevel.CheckLocationSolid(Math.round(editCamX), Math.round(editCamY), Math.round(editCamZ)))
		{
			zAdj = 1
		}
		// socket.emit("testAsPlayer", {x: Math.round(editCamX), y: Math.round(editCamY), z: Math.round(editCamZ + zAdj)});
		sendData("testAsPlayer", {x: Math.round(editCamX), y: Math.round(editCamY), z: Math.round(editCamZ + zAdj)});
	}
}

function ExitLevel () {
	if (MULTI_ON)
	{
		// socket.emit("exitLevel");
		sendData("exitLevel");
	}
}

function ExitSession () {
	if (MULTI_ON)
	{
		// socket.emit("exitSession");
		sendData("exitSession");
	}
}

function StopTestingPlayer () {
	if (MULTI_ON)
	{
		// socket.emit("stopTestingPlayer");
		sendData("stopTestingPlayer");
	}
}

function DeleteArea () {
	if (MULTI_ON)
	{
		// socket.emit("deleteArea", {levelID: curLevel.id, areaID: curArea.id});
		sendData("deleteArea", {levelID: curLevel.id, areaID: curArea.id});
	}
}

function SendEntityChange () {
	if (MULTI_ON)
	{
		// socket.emit("entityChange", {levelID: curLevel.id, entityID: curEntity.id, entityData: curEntity.Export()});
		sendData("entityChange", {levelID: curLevel.id, entityID: curEntity.id, entityData: curEntity.Export()});
	}
}

function SendThrowBall (x, y, z, xSpd, ySpd, zSpd) {
	if (MULTI_ON)
	{
		// socket.emit("throwBall", {x: x, y: y, z: z, xSpd: xSpd, ySpd: ySpd, zSpd: zSpd});
		sendData("throwBall", {x: x, y: y, z: z, xSpd: xSpd, ySpd: ySpd, zSpd: zSpd});
	}
}
