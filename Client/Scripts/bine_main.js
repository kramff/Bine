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

// In a session? Keep reference
var inSession = false;
var curSession = undefined;

// In a level? Keep reference
var inLevel = false;
var curLevel = undefined;

// In a player? (Currently playing) Keep reference
var inPlayer = true;
var curPlayerID = undefined;
var curPlayer = undefined;

// In an area? (Editing an area) Keep reference
var inArea = false;
var curArea = undefined;

// In an entity? (Editing an entity) Keep reference
var inEntity = false;
var curEntity = undefined;

// In a block? (Editing a rule block) Keep reference
var inBlock = false;
var curBlock = undefined;

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

	// Touch input (for phones)
	window.addEventListener("touchstart", DoTouchStart);
	window.addEventListener("touchend", DoTouchEnd);
	window.addEventListener("touchmove", DoTouchMove);

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
			// Touch movement rules
			if (touchEventsActive)
			{
				if (editMovX !== 0 || editMovY !== 0 || editMovZ !== 0)
				{
					editMovTime += 1;
					if (editMovTime >= 10)
					{
						editMovTime = 0;
						editMovX = 0;
						editMovY = 0;
						editMovZ = 0;
					}
				}
			}
			// Normal movement rules
			else
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
			}

			// Render frame while moving with touches
			if (touchEventsActive && touchMode === TOUCH_MODE_DOUBLE)
			{
				// Only change touch offset xyz if both touches are still on
				if (firstTouch !== undefined && secondTouch !== undefined)
				{
					var curTouchCenterX = (firstTouch.clientX + secondTouch.clientX) / 2;
					var curTouchCenterY = (firstTouch.clientY + secondTouch.clientY) / 2;

					// Using estimated tile size of 60 - fix later to use actual tile size
					touchOffsetX = (touchCenterX - curTouchCenterX) / 60;
					touchOffsetY = (touchCenterY - curTouchCenterY) / 60;

					distX = (firstTouch.clientX - secondTouch.clientX);
					distY = (firstTouch.clientY - secondTouch.clientY);
					curTouchDistance = Math.sqrt(distX * distX + distY * distY);

					// Not sure what makes sense to use here, 60 or some other number
					touchOffsetZ = (touchDistance - curTouchDistance) / 30;
					if (Math.abs(touchOffsetZ) < 1) {
						touchOffsetZ = 0;
					}
					else if (touchOffsetZ > 0)
					{
						touchOffsetZ -= 1;
					}
					else if (touchOffsetZ < 0)
					{
						touchOffsetZ += 1;
					}
				}
				RenderLevel(mainCanvas, curSession, curLevel, editCamX + touchOffsetX + 0.5, editCamY + touchOffsetY + 0.5, editCamZ + touchOffsetZ + 0.5, true);
			}
			else
			{
				// Render frame normally
				RenderLevel(mainCanvas, curSession, curLevel, editCamX + editMovX * (1 - 0.1 * editMovTime) + 0.5, editCamY + editMovY * (1 - 0.1 * editMovTime) + 0.5, editCamZ + editMovZ * (1 - 0.1 * editMovTime) + 0.5, true);
			}
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
	if (touchEventsActive)
	{
		return;
	}
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
	if (touchEventsActive)
	{
		return;
	}
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
	if (touchEventsActive)
	{
		return;
	}
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

var TOUCH_MODE_NONE = 0;
var TOUCH_MODE_SINGLE = 1;
var TOUCH_MODE_DOUBLE = 2;

var TOUCH_DELAY_LIMIT = 300;
var touchMode = TOUCH_MODE_NONE
var firstTouch = undefined;
var firstTouchTime = undefined;
var secondTouch = undefined;
var touchCenterX = 0;
var touchCenterY = 0;
var touchDistance = 0;

var touchEventsActive = false;

// Values updated each frame while dragging / zooming
var touchOffsetX = 0;
var touchOffsetY = 0;
var touchOffsetZ = 0;
var distX = 0;
var distY = 0;
var curTouchDistance = 0;

function DoTouchStart (event) {
	touchEventsActive = true;

	var newTouch = event.changedTouches.item(0);
	if (touchMode === TOUCH_MODE_NONE)
	{
		firstTouch = newTouch;
		touchMode = TOUCH_MODE_SINGLE;
		firstTouchTime = Date.now();
	}
	else if (touchMode === TOUCH_MODE_SINGLE)
	{
		if (Date.now() - firstTouchTime < TOUCH_DELAY_LIMIT)
		{
			secondTouch = newTouch;
			touchMode = TOUCH_MODE_DOUBLE;
			touchCenterX = (firstTouch.clientX + secondTouch.clientX) / 2;
			touchCenterY = (firstTouch.clientY + secondTouch.clientY) / 2;
			var distX = (firstTouch.clientX - secondTouch.clientX);
			var distY = (firstTouch.clientY - secondTouch.clientY);
			touchDistance = Math.sqrt(distX * distX + distY * distY);
		}
		else
		{
			// Do nothing... too slow
		}
	}
	else if (touchMode === TOUCH_MODE_DOUBLE)
	{
		// Do nothing... too many touches
	}
}
function DoTouchEnd (event) {
	for (var i = 0; i < event.changedTouches.length; i++) {
		var curTouch = event.changedTouches[i];

		if (firstTouch !== undefined && curTouch.identifier === firstTouch.identifier)
		{
			firstTouch = undefined;
		}
		else if (secondTouch !== undefined && curTouch.identifier === secondTouch.identifier)
		{
			secondTouch = undefined;
		}
	}
	if (touchMode === TOUCH_MODE_NONE)
	{
		// Do nothing
	}
	else if (touchMode === TOUCH_MODE_SINGLE)
	{
		if (firstTouch === undefined)
		{
			touchMode = TOUCH_MODE_NONE;
		}
	}
	else if (touchMode === TOUCH_MODE_DOUBLE)
	{
		if (firstTouch === undefined && secondTouch === undefined)
		{
			touchMode = TOUCH_MODE_NONE;

			editCamX = editCamX + Math.round(touchOffsetX);
			editCamY = editCamY + Math.round(touchOffsetY);
			editCamZ = editCamZ + Math.round(touchOffsetZ);

			editMovX = (touchOffsetX - Math.round(touchOffsetX)) / 2;
			editMovY = (touchOffsetY - Math.round(touchOffsetY)) / 2;
			editMovZ = (touchOffsetZ - Math.round(touchOffsetZ)) / 2;
			editMovTime = -10;
		}
	}
}
function DoTouchMove (event) {
	for (var i = 0; i < event.changedTouches.length; i++) {
		var curTouch = event.changedTouches[i];

		if (firstTouch !== undefined && curTouch.identifier === firstTouch.identifier)
		{
			firstTouch = curTouch;
		}
		else if (secondTouch !== undefined && curTouch.identifier === secondTouch.identifier)
		{
			secondTouch = curTouch;
		}

	}
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