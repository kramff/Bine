// bine_main.js
// main code - loads and runs other scripts


// Load additional files
// Path changes if using local or web version
var isoSources = ["Testo", "bine_session"];
var isoScripts = [];
// var isoStates = [];
var numLoadedScripts = 0;
function LoadIsoScripts () {
	for (var i = 0; i < isoSources.length; i++)
	{
		var source = isoSources[i];
		var script = document.createElement("script");
		isoScripts.push(script)
		// isoStates.push(false);
		if (location.href === "http://kramff.github.io/")
		{
			script.setAttribute("src", "./Isomorphic/" + source + ".js");
		}
		else
		{
			script.setAttribute("src", "../Isomorphic/" + source + ".js");
		}
		document.getElementsByTagName('body')[0].appendChild(script);
		var loadFunc = (function (stateNum) {
			return function () {
				// isoStates[stateNum] = true;
				numLoadedScripts ++;
				if (numLoadedScripts >= isoSources.length)
				{
					console.log("all iso scripts loaded");
					// console.log(new Testo().foo(20) + ": should be 23");
					GameInit();
				}
			}
		})(i);
		script.onreadystatechange = loadFunc;
		script.onload = loadFunc;
	}
}

var mainCanvas = undefined;
var gameReady = false;

var inSession = false;
var curSession = undefined;

var inLevel = false;
var curLevel = undefined;

var inPlayer = true;
var curPlayerID = undefined;

var inArea = false;
var curArea = undefined;

var editorActive = true;

// Keyboards
var wKey = false;
var aKey = false;
var sKey = false;
var dKey = false;
var qKey = false;
var eKey = false;

var inputChanged = false;

// Mouse
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;
var mouseButton = 0;

// Gameplay camera position
var xCam = 0;
var yCam = 0;
var zCam = 0;

// Editor camera position
var editCamX = 0;
var editCamY = 0;
var editCamZ = 0;
var editMovX = 0;
var editMovY = 0;
var editMovZ = 0;
var editMovTime = 0;

// Editor last tile changed position
var lastEditX = undefined;
var lastEditY = undefined;
var lastEditZ = undefined;

function Init () {
	LoadIsoScripts();
	SocketInit();
	ShowMenu("main_menu");
	SetupButtons();
	gameReady = true;
	mainCanvas = document.getElementById("canvas");

	SetupSound();

	// Resizing the window, and do initial resizing
	window.addEventListener("resize", ResizeFunction);
	ResizeFunction();

	// Keyboard input
	window.addEventListener("keydown", DoKeyDown);
	window.addEventListener("keyup", DoKeyUp);

	// Mouse input
	window.addEventListener("mousedown", DoMouseDown);
	window.addEventListener("mousemove", DoMouseMove);
	window.addEventListener("mouseup", DoMouseUp);
	window.addEventListener("contextmenu", DoContextMenu);

	// Old Shit
	//window.requestAnimationFrame(Update);
	
	// PrepareFirstTranspTileArray();
	// areaColors = GenerateColorPalette(100);


	// ResizeCanvas();
	// StartMapEditor();

	// player = CreateEntity(16, 5, -4);
	// InitGame();
	
	// ImportLevel('{"areas":[{"x":0,"y":0,"z":0,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]]],"rules":0}],"entities":[],"player":{"x":2,"y":2,"z":1}}');
	// ShowMenu("main_menu");
	// SetupButtons();
	// gameReady = true;


	// FillSessionBox([{id: "123", name: "Test Session", mode: "play", worldName: "test world", playerCount: 10}])
}

function ResizeFunction () {
	mainCanvas.width = window.innerWidth;
	mainCanvas.height = window.innerHeight;
}

// This is run once all iso scripts are loaded
function GameInit () {


	// New Shit

	// var tempSession = new Session("my session", {levelDatas: [], tileData: [], worldRules: []});

	// var playerEntity = tempSession.CreatePlayerEntity();

	// console.log(playerEntity);

	window.requestAnimationFrame(MainUpdate);
}

var frameCounter = 0;
function MainUpdate () {
	window.requestAnimationFrame(MainUpdate);

	frameCounter ++;

	if (inSession & curSession !== undefined && inLevel && curLevel !== undefined)
	{
		// Editor mode
		if (editorActive)
		{
			// Move camera around
			if (editMovX === 0 && editMovY === 0 && editMovZ === 0 && (aKey || dKey || wKey || sKey || eKey || qKey))
			{
				// Set camera movement
				editMovX = (aKey ? -1 : 0) + (dKey ? 1 : 0);
				editMovY = (wKey ? -1 : 0) + (sKey ? 1 : 0);
				editMovZ = (eKey ? -1 : 0) + (qKey ? 1 : 0);
				editMovTime = 10;
			}
			// If mouse is held down, check for doing mouse-move tile editing
			if (mousePressed)
			{
				if (editMovX !== 0 || editMovY !== 0 || editMovZ !== 0)
				{
					EditTileIfNewCoord();
				}
			}
			editMovTime -= 1;
			if (editMovTime <= 0)
			{
				editCamX = editCamX + editMovX;
				editCamY = editCamY + editMovY;
				editCamZ = editCamZ + editMovZ;
				editMovTime = 0;
				editMovX = 0;
				editMovY = 0;
				editMovZ = 0;

				// Also check for mouse-move tile editing here, because of Z movement not getting checked earlierif (mousePressed)
				if (mousePressed)
				{
					EditTileIfNewCoord();
				}
			}
			// Render frame
			RenderLevel(mainCanvas, curSession, curLevel, editCamX + editMovX * (1 - 0.1 * editMovTime) + 0.5, editCamY + editMovY * (1 - 0.1 * editMovTime) + 0.5, editCamZ + editMovZ * (1 - 0.1 * editMovTime) + 0.5, true);
		}
		else if (inPlayer)
		{
			// Player mode
			// var player = curLevel.GetEntityByID(curPlayerID);
			if (inputChanged)
			{
				inputChanged = false;
				curPlayer.SetMoveDirections(wKey, sKey, aKey, dKey);
				// Todo: Send to server's session as well
				SendInputUpdate(curPlayer.moveDirections);
			}
			// Update the level
			curLevel.Update();
			// Todo: determine how to sync with server's session

			// Camera movement
			xCam = (xCam * 4 + curPlayer.GetX() + 0.5) * 0.2;
			yCam = (yCam * 4 + curPlayer.GetY() + 0.5) * 0.2;
			zCam = (zCam * 4 + curPlayer.GetZ() + 0.5) * 0.2;
			RenderLevel(mainCanvas, curSession, curLevel, xCam, yCam, zCam);

			// Every few seconds, send a location correction
			if (frameCounter % 300 === 0)
			{
				SendLocationCorrection({x: curPlayer.x, y: curPlayer.y, z: curPlayer.z, xMov: curPlayer.xMov, yMov: curPlayer.yMov, zMov: curPlayer.zMov, moveTime: curPlayer.moveTime, moveDuration: curPlayer.moveDuration});
			}
		}
	}
	else
	{
		// Animation for when not in a game
		ClearCanvas(mainCanvas);
	}
}

function DoKeyDown (event) {
	if (event.keyCode === 87)
	{
		wKey = true;
	}
	else if (event.keyCode === 65)
	{
		aKey = true;
	}
	else if (event.keyCode === 83)
	{
		sKey = true;
	}
	else if (event.keyCode === 68)
	{
		dKey = true;
	}
	else if (event.keyCode === 81)
	{
		qKey = true;
	}
	else if (event.keyCode === 69)
	{
		eKey = true;
	}
	else
	{
		// Input not used
		return;
	}
	inputChanged = true;
}

function DoKeyUp (event) {
	if (event.keyCode === 87)
	{
		wKey = false;
	}
	else if (event.keyCode === 65)
	{
		aKey = false;
	}
	else if (event.keyCode === 83)
	{
		sKey = false;
	}
	else if (event.keyCode === 68)
	{
		dKey = false;
	}
	else if (event.keyCode === 81)
	{
		qKey = false;
	}
	else if (event.keyCode === 69)
	{
		eKey = false;
	}
	else
	{
		// Input not used
		return;
	}
	inputChanged = true;
}

function DoMouseDown (event) {
	mouseX = event.clientX;
	mouseY = event.clientY;
	mousePressed = true;
	mouseButton = event.button;

	if (!inSession || !inLevel)
	{
		// Don't do anything if not in a session + level
		return;
	}
	if (editorActive)
	{
		EditorMouseDown();
	}
	else
	{
		GameplayMouseDown();
	}
}
function DoMouseMove (event) {
	mouseX = event.clientX;
	mouseY = event.clientY;

	if (!inSession || !inLevel)
	{
		// Don't do anything if not in a session + level
		return;
	}
	if (editorActive)
	{
		EditorMouseMove();
	}
	else
	{
		GameplayMouseMove();
	}
}

function DoMouseUp (event) {
	mouseX = event.clientX;
	mouseY = event.clientY;
	mousePressed = false;
	mouseButton = event.button;

	if (!inSession || !inLevel)
	{
		// Don't do anything if not in a session + level
		return;
	}
	if (editorActive)
	{
		EditorMouseUp();
	}
	else
	{
		GameplayMouseUp();
	}
}

function DoContextMenu (event) {
	event.preventDefault();
}

function EditorMouseDown () {
	EditTileIfNewCoord();
	
}

function EditorMouseMove() {
	if (mousePressed)
	{
		// Potentially edit a tile if hovering over a new coordinate
		EditTileIfNewCoord();
	}
}

function EditorMouseUp () {
	// Forget about last edited tile
	lastEditX = undefined;
	lastEditY = undefined;
	lastEditZ = undefined;
}

function GameplayMouseDown () {

}

function GameplayMouseMove () {

}

function GameplayMouseUp () {

}

function EditTileIfNewCoord () {
	var gameCoords = ScreenCoordToGameCoord(mouseX, mouseY, Math.round(editCamZ), editCamX + editMovX * (1 - 0.1 * editMovTime) + 0.5, editCamY + editMovY * (1 - 0.1 * editMovTime) + 0.5, editCamZ + editMovZ * (1 - 0.1 * editMovTime) + 0.5, R);

	if (gameCoords.x === lastEditX && gameCoords.y === lastEditY && gameCoords.z === lastEditZ)
	{
		// Skip because exact same coords as last edited location
		return;
	}
	// console.log(gameCoords);

	// Use coords as data object
	gameCoords.tile = 1;

	if (mouseButton === 2)
	{
		gameCoords.tile = 0;
	}

	if (curLevel.areas.length >= 1)
	{
		for (var i = 0; i < curLevel.areas.length; i++) {
			var curArea = curLevel.areas[i];
			var relativeX = gameCoords.x - curArea.x;
			var relativeY = gameCoords.y - curArea.y;
			var relativeZ = gameCoords.z - curArea.z;
			if (PositionInBounds(curArea, relativeX, relativeY, relativeZ))
			{
				// Keep track of last edited tile coordinates
				lastEditX = gameCoords.x;
				lastEditY = gameCoords.y;
				lastEditZ = gameCoords.z;

				// Prepare data (Use relative XYZ when sending message to server)
				gameCoords.x = relativeX;
				gameCoords.y = relativeY;
				gameCoords.z = relativeZ;
				// Need to determine which area was clicked on
				// curSession.EditTile(curLevel.id, 1, gameCoords)
				SendTileChange ({levelID: curLevel.id, areaID: curArea.id, tileData: gameCoords});
				break;
			}
		}
	}
}