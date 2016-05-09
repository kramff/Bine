// bine_menu.js
// interface code - menus, dom manipulation

"use strict";

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
	var buttons = document.getElementsByClassName("button");
	for (var i = 0; i < buttons.length; i++) {
		var button = buttons[i];
		button.onclick = function () {
			HideAllMenus();
			ShowMenu(this.dataset.menu);
		}
	}
	var sessionBox = document.getElementsByClassName("session_box")[0];
	sessionBox.onclick = function () {
		var id = event.target.getAttribute("id");
		if (id !== null)
		{
			// Join session with this id
		}
	}
}

// sessionData: [{session}]
// session: id, name, mode, worldName, playerCount
function FillSessionBox (sessionData) {
	var sessionBox = document.getElementsByClassName("session_box")[0];
	for (var i = 0; i < sessionData.length; i++) {
		var session = sessionData[i];
		var sessionDiv = document.createElement("div");
		sessionDiv.className = "session";
		var nameDiv = document.createElement("div");
		nameDiv.appendChild(document.createTextNode(session.name));
		var modeDiv = document.createElement("div");
		modeDiv.appendChild(document.createTextNode(session.mode));
		var worldNameDiv = document.createElement("div");
		worldNameDiv.appendChild(document.createTextNode(session.worldName));
		var playerCountDiv = document.createElement("div");
		playerCountDiv.appendChild(document.createTextNode(session.playerCount));
		sessionDiv.appendChild(nameDiv);
		sessionDiv.appendChild(modeDiv);
		sessionDiv.appendChild(worldNameDiv);
		sessionDiv.appendChild(playerCountDiv);
		sessionDiv.setAttribute("id", session.id);
		// Append to session box
		sessionBox.appendChild(sessionDiv);
	}
}


function FillWorldBox (worldData) {
	var worldBox = document.getElementsByClassName("world_box")[0];
	for (var i = 0; i < worldData.length; i++) {
		var world = worldData[i];
		var worldDiv = document.createElement("div").className = "world";
		var nameDiv = document.createElement("div").appendChild(document.createText(world.name));
		worldDiv.appendChild(nameDiv);
	}
}