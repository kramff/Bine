// bine_main.js
// main code - loads and runs other scripts
// and runs main game loop


// Load additional files
// Path changes if using local or web version
var isoSources = ["Testo", "bine_session"];
var isoScripts = [];
// var isoStates = [];
var numLoadedScripts = 0;
function LoadIsoScripts () {
	for (var i = 0; i < isoSources.length; i++) {
		var source = isoSources[i];
		var script = document.createElement("script");
		isoScripts.push(script)
		script.setAttribute("src", "./Isomorphic/" + source + ".js");
		document.getElementsByTagName('body')[0].appendChild(script);
		var loadFunc = (function (stateNum) {
			return function () {
				// isoStates[stateNum] = true;
				numLoadedScripts ++;
				if (numLoadedScripts >= isoSources.length) {
					console.log("all iso scripts loaded");
					GameInit();
				}
			}
		})(i);
		script.onreadystatechange = loadFunc;
		script.onload = loadFunc;
	}
}

// Based on https://stackoverflow.com/a/11381730/4876751
function DetectMobile () { 
	if (navigator.userAgent.match(/Android/i)
		|| navigator.userAgent.match(/webOS/i)
		|| navigator.userAgent.match(/iPhone/i)
		|| navigator.userAgent.match(/iPad/i)
		|| navigator.userAgent.match(/iPod/i)
		|| navigator.userAgent.match(/BlackBerry/i)
		|| navigator.userAgent.match(/Windows Phone/i)) {
		return true;
	}
	else {
		return false;
	}
}

var isMobile = false;

var mainCanvas = undefined;
var gameReady = false;

// How many frames have passed without connecting
var noConnectionTime = 0;

// In a session? Keep reference
var inSession = false;
var curSession = undefined;

// In a level? Keep reference
var inLevel = false;
var curLevel = undefined;

// Keep backup of level while testing, then restore when done testing
var curLevelBackup = undefined

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

// In a rule nest? (Editing a nested rule) Keep reference
var inNestingPoint = false;
var curNestingPoint = undefined;

// In a variable slot? (Selecting a variable to put into a variable slot) Keep reference
var inVariableSlot = false;
var curVariableSlot = undefined;

// In a variable? (an entity's global variable editing) Keep reference
var inVariable = false;
var curVariable = undefined;

// In a block? (Editing a rule block) Keep reference
var inBlock = false;
var curBlock = undefined;

var editorActive = true;

var cameraControlsEnabled = false;
var tileEditingEnabled = false;

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

// If using a direct link, fill these variables
var waitingToDirectConnect = false;
var sessionDirectLinkID = undefined;
var levelDirectLinkID = undefined;

// If not connected to ws server, load local worlds
var startedLoadLocal = false;
var loadedLocalWorlds = [];

var controlStyles = {
	"Standard": {
		input: "Mouse + Keyboard",
		description: "WASD to move, aim with mouse, left/right click to shoot/collect.",
		movement: "WASD",
		direction: "Mouse",
		ability1: "LeftClick",
		ability2: "RightClick",
	},
	"QuickLook": {
		input: "Keyboard",
		description: "Arrow keys to move. Quick presses change direction without moving. ZX to shoot/collect.",
		movement: "ArrowKeys",
		direction: "LastMove",
		ability1: "ZKey",
		ability2: "XKey",
	},
	"DualKeyboard": {
		input: "Keyboard",
		description: "WASD to move, arrow keys to shoot/collect. Shift button to toggle.",
		movement: "WASD",
		direction: "ArrowKeys",
		abilityBoth: "ArrowKeys",
		abilityToggle: "ShiftKey",
	},
	"Mouse3": {
		input: "Mouse",
		description: "Middle Click to move, aim with mouse, left/right click to shoot/collect.",
		movement: "MiddleClick",
		direction: "Mouse",
		ability1: "LeftClick",
		ability2: "RightClick",
	},
	"DualStick": {
		input: "Gamepad",
		description: "Left stick to move, aim with right stick, left/right trigger to shoot/collect.",
		movement: "LeftStick",
		direction: "RightStick",
		ability1: "LeftTrigger",
		ability2: "RightTrigger",
	},
	"Toggler": {
		input: "Gamepad",
		description: "Left/right stick to move, face buttons to shoot/collect in 4 directions. Hold any trigger/bumper to toggle between shoot and collect.",
		movement: "AnyStick",
		direction: "FaceButtons",
		abilityBoth: "FaceButtons",
		abilityToggle: "AnyTriggerBumper",
	},
	"SwipeShooot": {
		input: "Touchscreen",
		description: "Tap to move, swipe away to shoot, swipe toward to collect.",
		movement: "Tap",
		direction: "Swipe",
		ability1: "SwipeAway",
		ability2: "SwipeToward",
	},
	"TapShoot": {
		input: "Touchscreen",
		description: "Swipe to move, tap in a direction to shoot/collect. Toggle between shoot and collect with on-screen button.",
		movement: "Swipe",
		direction: "Tap",
		abilityBoth: "Tap",
		abilityToggle: "OnScreenButton",
	},
	"CleverShoot": {
		input: "Touchscreen",
		description: "Swipe to move. Tap on a block to collect it, tap on an empty spot to shoot a block.",
		movement: "Swipe",
		direction: "Tap",
		abilityBoth: "Tap",
		abilityToggle: "ContextSensitive",
	},
};
var controlStyle = "";

function Init () {
	LoadIsoScripts();
	LoadAllSound();
	initSocket();


	if (location.search !== "") {
		// Joining session by direct link'
		ShowMenu("join_by_link");

		// Hide "gameplay_hide" elements
		var gameplayHideElements = document.getElementsByClassName("gameplay_hide");
		for (var i = 0; i < gameplayHideElements.length; i++) {
			gameplayHideElements[i].hidden = true;
		}

		// Use search params
		var searchParams = new URLSearchParams(document.location.search);
		var searchSessionID = searchParams.get("session");
		var searchLevelID = searchParams.get("level");
		waitingToDirectConnect = true;
		sessionDirectLinkID = searchSessionID;
		levelDirectLinkID = searchLevelID;
	}
	else {
		// Regular main menu
		ShowMenu("main_menu");
	}


	isMobile = DetectMobile();
	// Hide "mobile_only" elements
	// (Show these if touch events happen)
	if (!isMobile) {
		var mobileHideElements = document.getElementsByClassName("mobile_only");
		for (var i = 0; i < mobileHideElements.length; i++) {
			mobileHideElements[i].hidden = true;
		}
	}


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

	if (!SERVER_CONNECTED) {
		noConnectionTime ++;
	}

	if (!startedLoadLocal) {
		loadingLocalWorlds = true;
		// Load sample worlds for testing, if no connection is made
		startedLoadLocal = true;
		fetch("Worlds/entity_test.bineworld")
		.then(function (response) {
			return response.json();
		}).then(function (responseJson) {
			// Temporary id of 0 for the only loaded world
			responseJson.id = 0;
			loadedLocalWorlds.push(responseJson);
			FillWorldBox(loadedLocalWorlds, "local_worlds");
		});
	}

	if (inSession & curSession !== undefined && inLevel && curLevel !== undefined) {
		// Editor mode
		if (editorActive) {
			// Touch movement rules
			if (touchEventsActive) {
				if (editMovX !== 0 || editMovY !== 0 || editMovZ !== 0) {
					editMovTime += 1;
					if (editMovTime >= 10) {
						editMovTime = 0;
						editMovX = 0;
						editMovY = 0;
						editMovZ = 0;
					}
				}
			}
			// Normal movement rules
			else {
				// Move camera around
				if (editMovX === 0 && editMovY === 0 && editMovZ === 0 && (aKey || dKey || wKey || sKey || eKey || qKey) && cameraControlsEnabled) {
					// Set camera movement
					editMovX = (aKey ? -1 : 0) + (dKey ? 1 : 0);
					editMovY = (wKey ? -1 : 0) + (sKey ? 1 : 0);
					editMovZ = (eKey ? -1 : 0) + (qKey ? 1 : 0);
					editMovTime = 10;
				}
				// If mouse is held down, check for doing mouse-move tile editing
				if (mousePressed) {
					if (editMovX !== 0 || editMovY !== 0 || editMovZ !== 0) {
						EditTileIfNewCoord(mouseX, mouseY);
					}
				}
				editMovTime -= 1;
				if (editMovTime <= 0) {
					editCamX = editCamX + editMovX;
					editCamY = editCamY + editMovY;
					editCamZ = editCamZ + editMovZ;
					editMovTime = 0;
					editMovX = 0;
					editMovY = 0;
					editMovZ = 0;

					// Also check for mouse-move tile editing here, because of Z movement not getting checked earlierif (mousePressed)
					if (mousePressed) {
						EditTileIfNewCoord(mouseX, mouseY);
					}
				}
			}

			// Render frame while moving with touches
			if (touchEventsActive && touchMode === TOUCH_MODE_DOUBLE) {
				// Only change touch offset xyz if both touches are still on
				if (firstTouch !== undefined && secondTouch !== undefined) {
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
					else if (touchOffsetZ > 0) {
						touchOffsetZ -= 1;
					}
					else if (touchOffsetZ < 0) {
						touchOffsetZ += 1;
					}
				}
				RenderLevel(mainCanvas, curSession, curLevel, editCamX + touchOffsetX + 0.5, editCamY + touchOffsetY + 0.5, editCamZ + touchOffsetZ + 0.5, true);
			}
			else {
				// Render frame normally
				RenderLevel(mainCanvas, curSession, curLevel, editCamX + editMovX * (1 - 0.1 * editMovTime) + 0.5, editCamY + editMovY * (1 - 0.1 * editMovTime) + 0.5, editCamZ + editMovZ * (1 - 0.1 * editMovTime) + 0.5, true);
			}
		}
		else if (inPlayer) {
			// Player mode
			// var player = curLevel.GetEntityByID(curPlayerID);
			if (touchEventsActive) {
				if (touchWalk) {
					touchChanged = false;
					var coords = ScreenCoordToGameCoord(touchScreenX, touchScreenY, Math.round(zCam), xCam, yCam, zCam, R);
					touchGoalX = coords.x;
					touchGoalY = coords.y;
				}
				var prevWKey = wKey;
				var prevAKey = aKey;
				var prevSKey = sKey;
				var prevDKey = dKey;
				// X axis
				if (touchGoalX > curPlayer.x) {
					dKey = true;
					aKey = false;
				}
				else if (touchGoalX < curPlayer.x) {
					dKey = false;
					aKey = true;
				}
				else {
					dKey = false;
					aKey = false;
				}
				// Y axis
				if (touchGoalY > curPlayer.y) {
					sKey = true;
					wKey = false;
				}
				else if (touchGoalY < curPlayer.y) {
					sKey = false;
					wKey = true;
				}
				else {
					sKey = false;
					wKey = false;
				}
				// Determine if input has changed
				if (prevWKey !== wKey || prevAKey !== aKey || prevSKey !== sKey || prevDKey !== dKey) {
					inputChanged = true;
				}
			}
			if (inputChanged) {
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
			if (frameCounter % 300 === 0) {
				SendLocationCorrection({x: curPlayer.x, y: curPlayer.y, z: curPlayer.z, xMov: curPlayer.xMov, yMov: curPlayer.yMov, zMov: curPlayer.zMov, moveTime: curPlayer.moveTime, moveDuration: curPlayer.moveDuration});
			}
		}
	}
	else {
		// Animation for when not in a game
		ClearCanvas(mainCanvas);
	}
}

// Determine game coordinates from screen coordinates
function ScreenCoordToGameCoord (screenX, screenY, inputZ, cameraX, cameraY, cameraZ, renderSettings) {
	var scale = -(renderSettings.TILE_SIZE / (renderSettings.Z_MULTIPLIER * (inputZ - cameraZ) - renderSettings.EYE_DISTANCE)) * renderSettings.SCALE_MULTIPLIER;
	var gameX = Math.floor((screenX - renderSettings.CANVAS_HALF_WIDTH) / scale + cameraX);
	var gameY = Math.floor((screenY - renderSettings.CANVAS_HALF_HEIGHT) / scale + cameraY);
	var gameZ = inputZ;
	return {x: gameX, y: gameY, z: gameZ};
}

function DoKeyDown (event) {
	// WASD QE keys for movement
	if (event.keyCode === 87) {
		wKey = true;
	}
	else if (event.keyCode === 65) {
		aKey = true;
	}
	else if (event.keyCode === 83) {
		sKey = true;
	}
	else if (event.keyCode === 68) {
		dKey = true;
	}
	else if (event.keyCode === 81) {
		qKey = true;
	}
	else if (event.keyCode === 69) {
		eKey = true;
	}
	// Enter key for chat
	else if (event.keyCode === 13) {
		// Enter pressed - start  typing or send chat message
		DoEnterKey(event);
		return;
	}
	// Backquote and number keys for quick menu nav
	else if (event.keyCode === 192) {
		// Backquote / tilde: Reveal what number buttons to click for each button on screen
		DisplayIndicators();
	}
	else if (event.keyCode === 49) {
		// 1 pressed: activate 0th button on screen
		ActivateNthButton(0);
	}
	else if (event.keyCode === 50) {
		// 2 pressed: activate 1th button on screen
		ActivateNthButton(1);
	}
	else if (event.keyCode === 51) {
		// 3 pressed: activate 2th button on screen
		ActivateNthButton(2);
	}
	else if (event.keyCode === 52) {
		// 4 pressed: activate 3th button on screen
		ActivateNthButton(3);
	}
	else if (event.keyCode === 53) {
		// 5 pressed: activate 4th button on screen
		ActivateNthButton(4);
	}
	else if (event.keyCode === 54) {
		// 6 pressed: activate 5th button on screen
		ActivateNthButton(5);
	}
	else if (event.keyCode === 55) {
		// 7 pressed: activate 6th button on screen
		ActivateNthButton(6);
	}
	else if (event.keyCode === 56) {
		// 8 pressed: activate 7th button on screen
		ActivateNthButton(7);
	}
	else if (event.keyCode === 57) {
		// 9 pressed: activate 8th button on screen
		ActivateNthButton(8);
	}
	else if (event.keyCode === 48) {
		// 0 pressed: activate 9th button on screen
		ActivateNthButton(9);
	}
	else {
		// Input not used
		return;
	}
	inputChanged = true;
}

function DoKeyUp (event) {
	if (event.keyCode === 87) {
		wKey = false;
	}
	else if (event.keyCode === 65) {
		aKey = false;
	}
	else if (event.keyCode === 83) {
		sKey = false;
	}
	else if (event.keyCode === 68) {
		dKey = false;
	}
	else if (event.keyCode === 81) {
		qKey = false;
	}
	else if (event.keyCode === 69) {
		eKey = false;
	}
	else {
		// Input not used
		return;
	}
	inputChanged = true;
}

function DoEnterKey (event) {

	if (inPlayer) {
		GameplayEnterKey(event);
	}
	
}

function GameplayEnterKey (event) {
	// Focus chat input text box or send a chat message
	var chatInput = document.getElementById("chat_input");
	if (chatInput === document.activeElement) {
		// Already focused, so send a message
		if (chatInput.value === "") {
			return;
		}
		SendChatMessage(chatInput.value);
		chatInput.value = "";
	}
	else {
		// Focus the element
		chatInput.focus();
	}
}

function DoMouseDown (event) {
	if (autoMuted) {
		tryResumeAudio();
	}
	if (touchEventsActive) {
		return;
	}
	mouseX = event.clientX;
	mouseY = event.clientY;
	mousePressed = true;
	mouseButton = event.button;

	if (!inSession || !inLevel) {
		// Don't do anything if not in a session + level
		return;
	}
	if (editorActive) {
		EditorMouseDown(event);
	}
	else {
		GameplayMouseDown(event);
	}
}
function DoMouseMove (event) {
	if (touchEventsActive) {
		return;
	}
	mouseX = event.clientX;
	mouseY = event.clientY;

	if (!inSession || !inLevel) {
		// Don't do anything if not in a session + level
		return;
	}
	if (editorActive) {
		EditorMouseMove();
	}
	else {
		GameplayMouseMove();
	}
}

function DoMouseUp (event) {
	if (touchEventsActive) {
		return;
	}
	mouseX = event.clientX;
	mouseY = event.clientY;
	mousePressed = false;
	mouseButton = event.button;

	if (!inSession || !inLevel) {
		// Don't do anything if not in a session + level
		return;
	}
	if (editorActive) {
		EditorMouseUp();
	}
	else {
		GameplayMouseUp();
	}
}

function DoContextMenu (event) {
	event.preventDefault();
}

var TOUCH_MODE_NONE = 0;
var TOUCH_MODE_SINGLE = 1;
var TOUCH_MODE_DOUBLE = 2;

var touchDrawing = false;

var TOUCH_DELAY_LIMIT = 300;
var touchMode = TOUCH_MODE_NONE
var firstTouch = undefined;
var firstTouchTime = undefined;
var firstTouchX = 0;
var firstTouchY = 0;
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
	if (autoMuted) {
		tryResumeAudio();
	}
	if (!editorActive) {
		GameplayTouchStart(event);
		return;
	}
	if (!cameraControlsEnabled) {
		return;
	}
	touchEventsActive = true;

	var newTouch = event.changedTouches.item(0);
	if (touchMode === TOUCH_MODE_NONE) {
		firstTouch = newTouch;
		touchMode = TOUCH_MODE_SINGLE;
		firstTouchTime = Date.now();
		firstTouchX = firstTouch.clientX;
		firstTouchY = firstTouch.clientY;
	}
	else if (touchMode === TOUCH_MODE_SINGLE && !touchDrawing) {
		if (Date.now() - firstTouchTime < TOUCH_DELAY_LIMIT) {
			secondTouch = newTouch;
			touchMode = TOUCH_MODE_DOUBLE;
			touchCenterX = (firstTouch.clientX + secondTouch.clientX) / 2;
			touchCenterY = (firstTouch.clientY + secondTouch.clientY) / 2;
			var distX = (firstTouch.clientX - secondTouch.clientX);
			var distY = (firstTouch.clientY - secondTouch.clientY);
			touchDistance = Math.sqrt(distX * distX + distY * distY);
		}
		else {
			// Do nothing... too slow
		}
	}
	else if (touchMode === TOUCH_MODE_DOUBLE) {
		// Do nothing... too many touches
	}
}
function DoTouchEnd (event) {
	if (!editorActive) {
		GameplayTouchEnd(event);
		return;
	}
	if (!cameraControlsEnabled) {
		return;
	}
	for (var i = 0; i < event.changedTouches.length; i++) {
		var curTouch = event.changedTouches.item(i);

		if (firstTouch !== undefined && curTouch.identifier === firstTouch.identifier) {
			firstTouch = undefined;
		}
		else if (secondTouch !== undefined && curTouch.identifier === secondTouch.identifier) {
			secondTouch = undefined;
		}
	}
	if (touchMode === TOUCH_MODE_NONE) {
		// Do nothing
	}
	else if (touchMode === TOUCH_MODE_SINGLE) {
		if (firstTouch === undefined) {
			EditTileIfNewCoord(firstTouchX, firstTouchY);
			touchMode = TOUCH_MODE_NONE;
			touchDrawing = false;
		}
	}
	else if (touchMode === TOUCH_MODE_DOUBLE) {
		if (firstTouch === undefined && secondTouch === undefined) {
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
	if (!editorActive) {
		GameplayTouchMove(event);
		return;
	}
	if (!cameraControlsEnabled) {
		return;
	}
	for (var i = 0; i < event.changedTouches.length; i++) {
		var curTouch = event.changedTouches.item(i);

		if (firstTouch !== undefined && curTouch.identifier === firstTouch.identifier) {
			firstTouch = curTouch;
		}
		else if (secondTouch !== undefined && curTouch.identifier === secondTouch.identifier) {
			secondTouch = curTouch;
		}
	}
	if (touchMode === TOUCH_MODE_SINGLE) {
		// Already drawing, so edit tile
		if (touchDrawing) {
			// Change tile
			EditTileIfNewCoord(firstTouch.clientX, firstTouch.clientY);
		}
		// Consider editing tile if moved far enough. Also edit starting tile if that's the case
		else {
			// Check distance (Either X or Y greater than 1 tile's distance moved)
			// TODO: use actual tile size instead of 60
			if (Math.abs(firstTouchX - firstTouch.clientX) > 60 || Math.abs(firstTouchY - firstTouch.clientY) > 60) {
				touchDrawing = true;
				// Change tile
				EditTileIfNewCoord(firstTouch.clientX, firstTouch.clientY);
				// Change starting tile
				EditTileIfNewCoord(firstTouchX, firstTouchY);
			}
		}
	}
}


var touchWalk = false;
var touchScreenX = 0;
var touchScreenY = 0;
var touchChanged = false;
var touchGoalX = 0;
var touchGoalY = 0;

var debug_string = "";

function GameplayTouchStart (event) {
	var newTouch = event.changedTouches.item(0);
	var touchX = newTouch.clientX;
	var touchY = newTouch.clientY;

	// Test to see if this is within the clickable area
	if (!CheckIfInClickableArea(touchX, touchY)) {
		return;
	}

	debug_string += "f";
	Debug(debug_string)
	if (debug_string.length > 30) {debug_string = ""}

	// Move to location
	touchScreenX = newTouch.clientX;
	touchScreenY = newTouch.clientY;
	touchWalk = true;
	touchChanged = true;
}

function GameplayTouchEnd (event) {
	touchWalk = false;
}

function GameplayTouchMove (event) {
	var newTouch = event.changedTouches.item(0);
	touchScreenX = newTouch.clientX;
	touchScreenY = newTouch.clientY;
	touchChanged = true;
}

function EditorMouseDown (event) {

	// Test to see if this is within the clickable area
	if (!CheckIfInClickableArea(mouseX, mouseY)) {
		return;
	}

	EditTileIfNewCoord(mouseX, mouseY);
	
}

function EditorMouseMove() {
	if (mousePressed) {
		// Potentially edit a tile if hovering over a new coordinate
		EditTileIfNewCoord(mouseX, mouseY);
	}
}

function EditorMouseUp () {
	// Forget about last edited tile
	lastEditX = undefined;
	lastEditY = undefined;
	lastEditZ = undefined;
}

function GameplayMouseDown (event) {
	
}

function GameplayMouseMove () {

}

function GameplayMouseUp () {

}

function EditTileIfNewCoord (x, y) {
	if (!tileEditingEnabled) {
		return;
	}

	// Test to see if this is within the clickable area
	if (!CheckIfInClickableArea(x, y)) {
		return;
	}

	var gameCoords = ScreenCoordToGameCoord(x, y, Math.round(editCamZ), editCamX + editMovX * (1 - 0.1 * editMovTime) + 0.5, editCamY + editMovY * (1 - 0.1 * editMovTime) + 0.5, editCamZ + editMovZ * (1 - 0.1 * editMovTime) + 0.5, R);

	if (gameCoords.x === lastEditX && gameCoords.y === lastEditY && gameCoords.z === lastEditZ) {
		// Skip because exact same coords as last edited location
		return;
	}
	// console.log(gameCoords);

	// Use coords as data object
	gameCoords.tile = 1;

	if (mouseButton === 2) {
		gameCoords.tile = 0;
	}

	if (curLevel.areas.length >= 1) {
		for (var i = 0; i < curLevel.areas.length; i++) {
			var curArea = curLevel.areas[i];
			var relativeX = gameCoords.x - curArea.x;
			var relativeY = gameCoords.y - curArea.y;
			var relativeZ = gameCoords.z - curArea.z;
			if (PositionInBounds(curArea, relativeX, relativeY, relativeZ)) {
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

// Evaluate whether the given coordinate is inside the area
function PositionInBounds (area, i, j, k) {
	if (0 <= i && i < area.xSize) {
		if (0 <= j && j < area.ySize) {
			if (0 <= k && k < area.zSize) {
				return true;
			}
		}
	}
	return false;
}


function DownloadCurrentWorld () {
	var worldData = curSession.ExportWorldNoPlayers();
	var worldString = JSON.stringify(worldData);

	// Download the string as a file
}

// Get indicator text from number
function GetIndicatorText (num) {
	if (num <= 8) {
		return (num + 1).toString();
	}
	else if (num === 9) {
		return "0";
	}
	else if (num === 10) {
		return "-";
	}
	else if (num === 11) {
		return "="
	}
	else {
		return false;
	}
}

// Show little numbers next to first 10 buttons on screen
// Unless they're already visible, then get rid of them
function DisplayIndicators () {
	var activeMenu = document.getElementsByClassName("menu_container active_menu").item(0);
	if (activeMenu !== null)
	{
		var activeButtons = activeMenu.getElementsByClassName("button");
		for (var i = 0; i < activeButtons.length; i++) {
			var activeButton = activeButtons[i];
			if (activeButton.getElementsByClassName("indicator").length === 0)
			{
				var indicator = document.createElement("div");
				indicator
				var indicatorText = GetIndicatorText(i);
				if (indicatorText) {
					CreateNewDiv(activeButton, "indicator", indicatorText, undefined);
				}
			}
		}
	}
}

function ActivateNthButton (buttonNum) {
	// Find nth button and click it
	var activeMenu = document.getElementsByClassName("menu_container active_menu").item(0);
	if (activeMenu !== null)
	{
		var activeButtons = activeMenu.getElementsByClassName("button");
		var selectedButton = activeButtons.item(buttonNum);
		if (selectedButton !== null)
		{
			if (!selectedButton.classList.contains("disabled"))
			{
				selectedButton.click();
			}
		}
	}
}
