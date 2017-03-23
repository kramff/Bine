// bine_menu.js
// interface code - menus, dom manipulation

"use strict";

function CreateNewDiv (parent, setClass, text, id) {
	var newDiv = document.createElement("div");
	if (setClass !== undefined)
	{
		newDiv.className = setClass;
	}
	if (text !== undefined)
	{
		newDiv.appendChild(document.createTextNode(text));
	}
	if (id !== undefined)
	{
		newDiv.setAttribute("id", id);
	}
	if (parent !== undefined)
	{
		parent.appendChild(newDiv)
	}
	return newDiv;
}

// html dom manipulation stuff
function SetBGColor (newColor) {
	document.getElementsByClassName("background_layer")[0].style["background-color"] = newColor;
}

function HideAllMenus () {
	var menus = document.getElementsByClassName("menu_container");
	for (var i = 0; i < menus.length; i++) {
		// menus[i].style["display"] = "none";
		var menu = menus[i];
		menu.classList.remove("active_menu");
	}
}

// Call this function when connected to server
function EnableMultiplayerFeatures () {

}

var currentMenu = "main_menu";

function ShowMenu (menuId) {
	var menu = document.getElementById(menuId);
	if (menu !== undefined)
	{
		currentMenu = menuId;
		menu.classList.add("active_menu");
	}
	else
	{
		console.error("Could not get menu with id " + menuId);
	}
}

function SetupButtons () {
	document.body.onselectstart = function () {
		return false;
	}
	// Buttons for going to menus and doing actions
	var buttons = document.getElementsByClassName("button");
	for (var i = 0; i < buttons.length; i++) {
		var button = buttons[i];
		button.onclick = function () {
			if (this.dataset.menu !== undefined)
			{
				HideAllMenus();
				ShowMenu(this.dataset.menu);
			}
			else if (this.dataset.action !== undefined)
			{
				DoButtonAction(this.dataset.action);
			}
		}
	}
	// Enter a session by clicking on it
	var sessionBox = document.getElementsByClassName("session_box")[0];
	sessionBox.onclick = function () {
		if (event.target.classList.contains("session"))
		{
			var sessionID = event.target.getAttribute("session_id");
			if (sessionID !== null)
			{
				// Join session with this id
				JoinSession(sessionID);
				HideAllMenus();
				ShowMenu("edit_world");
			}
		}
	}
	// Enter a level by clicking on it
	var levelBox = document.getElementsByClassName("level_box")[0];
	levelBox.onclick = function () {
		if (event.target.classList.contains("level"))
		{
			var levelID = event.target.getAttribute("level_id");
			if (levelID !== null)
			{
				// Enter level with this id
				JoinLevel(levelID);
				HideAllMenus();
				ShowMenu("edit_level");
			}
		}
	}
}

function DoButtonAction (action) {
	switch (action) {
		default:
			console.log("No action set up for " + action);
		break;
		case "create_session_new_world":
			CreateSessionNewWorld();
			HideAllMenus();
			ShowMenu("edit_world");
		break;
		case "create_new_level":
			CreateNewLevel();
			HideAllMenus();
			ShowMenu("edit_level");
		break;

		case "create_area":
			CreateNewArea();
		break;
		case "test_as_player":
			TestAsPlayer();
		break;
		case "exit_level":
			ExitLevel();
			HideAllMenus();
			ShowMenu("edit_world")
			inLevel = false;
			curLevel = undefined;
		break;
		case "exit_session":
			ExitSession();
			HideAllMenus();
			ShowMenu("main_menu");
			inSession = false;
			curSession = undefined;
		break;
		case "stop_testing":
			inPlayer = false;
			curPlayerID = undefined;
			editorActive = true;
			HideAllMenus();
			ShowMenu("edit_level");
		break;
	}
}

// sessionData: [{session}, ...]
// session: id, name, mode, worldName, playerCount
function FillSessionBox (sessionData) {
	var sessionBox = document.getElementsByClassName("session_box")[0];

	// Clear out old elements
	while (sessionBox.firstChild)
	{
		sessionBox.removeChild(sessionBox.firstChild);
	}

	// Create an element for each session
	for (var i = 0; i < sessionData.length; i++) {
		var session = sessionData[i];
		// Main div
		var sessionDiv = CreateNewDiv(sessionBox, "session", undefined, undefined);
		sessionDiv.setAttribute("session_id", session.id);
		// Name
		CreateNewDiv(sessionDiv, "session_name", session.name, undefined);
		// Mode
		CreateNewDiv(sessionDiv, "session_mode", session.mode, undefined);
		// World name
		CreateNewDiv(sessionDiv, "session_world_name", session.worldName, undefined);
		// Player count
		CreateNewDiv(sessionDiv, "session_player_count", session.playerCount, undefined);
	}
}

function AddSingleSessionToBox (session) {
	var sessionBox = document.getElementsByClassName("session_box")[0];
	var sessionDiv = CreateNewDiv(sessionBox, "session", undefined, undefined);
	sessionDiv.setAttribute("session_id", session.id);
	// Name
	CreateNewDiv(sessionDiv, "session_name", session.name, undefined);
	// Mode
	CreateNewDiv(sessionDiv, "session_mode", session.mode, undefined);
	// World name
	CreateNewDiv(sessionDiv, "session_world_name", session.worldName, undefined);
	// Player count
	CreateNewDiv(sessionDiv, "session_player_count", session.playerCount, undefined);
}

// 
function FillWorldBox (worldData) {
	var worldBox = document.getElementsByClassName("world_box")[0];

	// Clear out old elements
	while (worldBox.firstChild)
	{
		worldBox.removeChild(worldBox.firstChild);
	}

	// Create an element for each world
	for (var i = 0; i < worldData.length; i++) {
		var world = worldData[i]; 
		// Main new div
		var worldDiv = CreateNewDiv(worldBox, "world", undefined, world.id);
		// Name
		CreateNewDiv(worldDiv, "world_name", world.name, undefined);
		// Level Count
		CreateNewDiv(worldDiv, "world_level_count", world.levelCount, undefined);
	}
}

function FillLevelBox (levelArray) {
	var levelBox = document.getElementsByClassName("level_box")[0];

	// Clear out old elements
	while (levelBox.firstChild)
	{
		levelBox.removeChild(levelBox.firstChild);
	}

	// Create an element for each level
	for (var i = 0; i < levelArray.length; i++) {
		var level = levelArray[i];
		// Main new div
		var levelDiv = CreateNewDiv(levelBox, "level", level.name, level.id);
		levelDiv.setAttribute("level_id", level.id);
	}
}

function AddSingleLevelToBox (level) {
	var levelBox = document.getElementsByClassName("level_box")[0];
	var levelDiv = CreateNewDiv(levelBox, "level", level.name, level.id);
	levelDiv.setAttribute("level_id", level.id);
}