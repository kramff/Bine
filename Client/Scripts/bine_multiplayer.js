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

// IN_MULTI_SESSION: true when in a session connected to the server
// If true, use sendData() to send events to the server's session
// If false, all events go directly to the local session
var IN_MULTI_SESSION = false;

// SERVER_CONNECTED: set to true when the websocket is connected to the server
// If false, disable connecting to server sessions
var SERVER_CONNECTED = false;

function initSocket () {
	InitSocketConnection();
}

var wsOption = {transports: ["websocket"]};
var noOption = {};
var wsProtocol = "ws://";
var httpProtocol = "http://";


var socket = undefined;
function InitSocketConnection () {
	SERVER_CONNECTED = false;
	SetMultiplayerButtonEnabled(SERVER_CONNECTED);
	try {
		var socketURL;
		if (location.href === "kramff.github.io/") {
			socketURL = wsProtocol + "bine-online.herokuapp.com";
		}
		else if (location.href.indexOf("kramff.com/Bine/") !== -1) {
			wsProtocol = "wss://";
			socketURL = wsProtocol + "bine.nfshost.com";
		}
		else if (location.href.indexOf("file:/") !== -1) {
			socketURL = wsProtocol + "localhost:5000";
		}
		else {
			socketURL = (location.protocol + "//" + location.host + "/").replace(/\d+\/$/, "5000").replace("http://", wsProtocol);
		}
		socket = new WebSocket(socketURL);
		socket.onopen = function (data) {

			console.log("Connected to server!");
			SERVER_CONNECTED = true;
			SetMultiplayerButtonEnabled(SERVER_CONNECTED);

			// Waiting until connected to server
			// before directly joining session
			if (waitingToDirectConnect) {
				JoinSession(sessionDirectLinkID);
			}
		}
		socket.onmessage = function (event) {
			var message = JSON.parse(event.data);
			handleMessageData(message.type, message.data);
		}


	}
	catch (err) {
		console.error("server not up");
		console.error(err);
		SERVER_CONNECTED = false;
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
		if (waitingToDirectConnect) {
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
		if (waitingToDirectConnect) {
			TestAsPlayer();
		}

	}

	// if (type === "newArea") {
	// 	// Create a new area
	// 	ReceiveCreateArea(data.levelID, data.areaData);
	// }

	if (type === "newEntity") {
		// Create a new entity
		ReceiveCreateEntity(data.levelID, data.entityData);
	}
	if (type === "assignPlayerEntity") {
		// Set the curPlayerID and curPlayer to the given entity
		ReceiveAssignPlayer(data);
	}
	if (type === "deleteEntity") {
		// Delete the entity from the session
		ReceiveDeleteEntity(data.levelID, data.entityID);
	}

	if (type === "inputUpdate") {
		var level = curSession.GetLevelByID(data.levelID);
		var entity = level.GetEntityByID(data.entityID);
		if (entity !== curPlayer) {
			entity.SetMoveDirections(data.up, data.down, data.left, data.right);
		}
	}

	if (type === "locationCorrection") {
		var level = curSession.GetLevelByID(data.levelID);
		var entity = level.GetEntityByID(data.entityID);
		entity.SetLocationCorrection(data.x, data.y, data.z, data.xMov, data.yMov, data.zMov, data.moveTime, data.moveDuration);
	}

	if (type === "entityChange") {
		RecieveEntityChange(data.levelID, data.entityID, data.entityData);
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
	for (var i = 0; i < playerArray.length; i++) {
		if (playerArray[i].id === playerData.id) {
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
function DeletePlayer (playerData) {
	for (var i = 0; i < playerArray.length; i++) {
		if (playerArray[i].id === playerData.id) {
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
function ReceiveCreateArea (createArea) {
	// var areaData = createAreaInLevel.areaData
	// var levelID = createAreaInLevel.levelID;
	// ActualCreateArea(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize);
	var level = curSession.GetLevelByID(createArea.levelID);
	level.AddArea(createArea.areaData);
}
function ReceiveDeleteArea (levelID, areaID) {
	var level = curSession.GetLevelByID(levelID);
	curLevel.DeleteArea(areaID);
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

function ReceiveDeleteEntity (levelID, entityID) {
	curSession.DeleteEntity(levelID, entityID);
}

function RecieveEntityChange (levelID, entityID, entityData) {
	curSession.ChangeEntity(levelID, entityID, entityData);
}


// ~~~~~~~~~~~
// Functions to send data to server

function sendData(type, data) {
	// console.log("~~~ Sent Data:");
	// console.log("type: " + type);
	// console.log("data: " + data);
	socket.send(JSON.stringify({type: type, data: data}));
}

function SendTileChange (tileChange) {
	if (IN_MULTI_SESSION) {
		sendData("tileChange", tileChange);
	}
	else {
		handleMessageData("tileChange", tileChange);
	}
}
// function SendCreateArea (createArea) {
// 	if (IN_MULTI_SESSION) {
// 		sendData("createArea", createArea);
// 	}
// 	else {
// 		handleMessageData("createArea", createArea);
// 	}
// }
function SendDeleteArea (deleteArea) {
	if (IN_MULTI_SESSION) {
		sendData("deleteArea", deleteArea);
	}
	else {
		handleMessageData("deleteArea", deleteArea);
	}
}
function SendInputUpdate (inputData) {
	if (IN_MULTI_SESSION) {
		sendData("inputUpdate", inputData);
	}
	else {
		// handleMessageData("inputUpdate", inputData);
	}
}
function SendLocationCorrection (correctionData) {
	if (IN_MULTI_SESSION) {
		sendData("locationCorrection", correctionData);
	}
	else {
		// handleMessageData("locationCorrection", correctionData);
	}
}

function CreateSessionNewWorld () {
	if (IN_MULTI_SESSION) {
		sendData("createSessionNewWorld");
	}
	else {
		var emptyWorldData = {levelDatas: [], tileData: [], worldRules: [], entityTemplates: [], areaTemplates: [], itemData: []};
		// var newSession = new Session("Local Session", emptyWorldData);
		// newSession.id = 0;
		// inSession = true;
		// curSession = newSession;
		ReceiveWorldData(emptyWorldData);
	}
}
function JoinSession (id) {
	if (IN_MULTI_SESSION) {
		sendData("joinSession", id);
	}
	else {
		// handleMessageData("joinSession", id);
	}
}

function CreateNewLevel () {
	if (IN_MULTI_SESSION) {
		sendData("createNewLevel");
	}
	else {
		// create a level locally
		curSession.levelCounter += 1;
		var blankLevelData = {
			name: "level name",
			id: curSession.levelCounter,
			entityDatas: [],
			areaDatas: [],
		}
		handleMessageData("newLevel", blankLevelData);
		handleMessageData("enterLevel", blankLevelData.id);
	}
}

function JoinLevel (levelID) {
	if (IN_MULTI_SESSION) {
		sendData("joinLevel", levelID);
	}
	else {
		// handleMessageData("joinLevel", levelID);
		handleMessageData("enterLevel", levelID);
	}
}

function CreateArea (createX, createY, createZ) {
	if (IN_MULTI_SESSION) {
		sendData("createArea", {x: createX, y: createY, z: createZ});
	}
	else {
		curLevel.areaCounter += 1;
		var blankAreaData = {
			id: curLevel.areaCounter,
			x: createX,
			y: createY,
			z: createZ,
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
		handleMessageData("createArea", {areaData: blankAreaData, levelID: curLevel.id});
	}
}

function CreateNewEntity (createX, createY, createZ) {
	if (IN_MULTI_SESSION) {
		sendData("createNewEntity", {x: createX, y: createY, z: createZ});
	}
	else {
		curLevel.entityCounter ++;
		var blankEntityData = {
			id: curLevel.entityCounter,
			x: createX,
			y: createY,
			z: createZ,
			settings: [],
			style: [],
			variables: [],
			rules: [],
			templates: [],
			variableCounter: 0,
		};
		var entity = curLevel.AddEntity(blankEntityData);
		// handleMessageData("createNewEntity", {x: createX, y: createY, z: createZ});
	}
}

function TestAsPlayer () {
	var zAdj = 0;
	if (curLevel.CheckLocationSolid(Math.round(editCamX), Math.round(editCamY), Math.round(editCamZ))) {
		zAdj = 1
	}
	if (IN_MULTI_SESSION) {
		sendData("testAsPlayer", {x: Math.round(editCamX), y: Math.round(editCamY), z: Math.round(editCamZ + zAdj)});
	}
	else {
		curLevel.entityCounter += 1;
		var newPlayerData = {
			id: curLevel.entityCounter,
			x: Math.round(editCamX),
			y: Math.round(editCamY),
			z: Math.round(editCamZ + zAdj),
			style: [],
			settings: [],
			variables: [],
			rules: [],
			templates: [],
		}
		handleMessageData("newEntity", {levelID: curLevel.id, entityData: newPlayerData});
		handleMessageData("assignPlayerEntity", newPlayerData.id);
	}
}

function ExitLevel () {
	if (IN_MULTI_SESSION) {
		sendData("exitLevel");
	}
	else {
		handleMessageData("exitLevel");
	}
}

function ExitSession () {
	if (IN_MULTI_SESSION) {
		sendData("exitSession");
	}
	else {
		handleMessageData("exitSession");
	}
}

function StopTestingPlayer () {
	if (IN_MULTI_SESSION) {
		sendData("stopTestingPlayer");
	}
	else {
		handleMessageData("deleteEntity", {levelID: curLevel.id, entityID: curPlayerID});
	}
}

function DeleteArea () {
	if (IN_MULTI_SESSION) {
		sendData("deleteArea", {levelID: curLevel.id, areaID: curArea.id});
	}
	else {
		handleMessageData("deleteArea", {levelID: curLevel.id, areaID: curArea.id});
	}
}

function SendEntityChange () {
	if (IN_MULTI_SESSION) {
		sendData("entityChange", {levelID: curLevel.id, entityID: curEntity.id, entityData: curEntity.Export()});
	}
	else {
		handleMessageData("entityChange", {levelID: curLevel.id, entityID: curEntity.id, entityData: curEntity.Export()});
	}
}

