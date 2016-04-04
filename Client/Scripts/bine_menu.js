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

function ShowMenu (menuId) {
	var menu = document.getElementById(menuId);
	if (menu !== undefined)
	{
		// menu.style["display"] = "";
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
}