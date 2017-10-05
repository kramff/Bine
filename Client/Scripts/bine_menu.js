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

function HideAllOverMenus () {
	var menus = document.getElementsByClassName("over_menu");
	for (var i = 0; i < menus.length; i++) {
		// menus[i].style["display"] = "none";
		var menu = menus[i];
		menu.classList.remove("active_menu");
	}
}

function ShowDarkCover () {
	var darkCover = document.getElementById("dark_cover");
	darkCover.classList.add("active_cover");
}

function HideDarkCover () {
	var darkCover = document.getElementById("dark_cover");
	darkCover.classList.remove("active_cover");
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

function ButtonClick () {
	if (this.dataset.menu !== undefined)
	{
		HideAllMenus();
		ShowMenu(this.dataset.menu);
	}
	else if (this.dataset.action !== undefined)
	{
		if (this.dataset.extra !== undefined)
		{
			DoButtonAction(this.dataset.action, this.dataset.extra);
		}
		else
		{
			DoButtonAction(this.dataset.action);
		}
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
		button.onclick = ButtonClick;
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
	// Add a sub-rule (Effect or Condition) by clicking on the buttons placed in each rule block.
	var rules_box = document.getElementsByClassName("rules_box")[0];
	rules_box.onclick = function () {
		if (event.target.classList.contains("add_sub_rule"))
		{
			var nesting = event.target.getAttribute("data-nesting");
			if (nesting !== null)
			{
				// Pull open the menu to pick a sub rule, and keep track of the nesting point
				ShowDarkCover();
				ShowMenu("add_entity_sub_rule");
				
				// var ruleParent = event.target.parentElement;
				// curNestingPoint = ruleParent.getAttribute("data-nesting");
				curNestingPoint = nesting;
				inNestingPoint = true;
				curBlock = GetRuleAtNestLocation(curEntity.rules, curNestingPoint);
				inBlock = true;
			}
		}
		else if (event.target.classList.contains("rule_remove"))
		{
			// Remove the selected rule
			var ruleParent = event.target.parentElement;
			var nesting = ruleParent.getAttribute("data-nesting");
			if (nesting !== null)
			{
				// Remove the rule at that nesting point;
				var rule = GetRuleAtNestLocation(curEntity.rules, nesting);
				RemoveRuleFromNestLocation(curEntity.rules, rule, nesting);
			}
		}
	}
}

function DoButtonAction (action, extra) {
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
			CreateNewArea(editCamX, editCamY, editCamZ);
		break;
		case "edit_area":
			var areaSelected = curLevel.GetAreaAtLocation(editCamX, editCamY, editCamZ);
			if (areaSelected !== undefined)
			{
				inArea = true;
				curArea = areaSelected;
				HideAllMenus();
				ShowMenu("edit_area");
			}
		break;

		case "create_entity":
			CreateNewEntity(editCamX, editCamY, editCamZ);
		break;
		case "edit_entity":
			var entitySelected = curLevel.GetEntityAtLocation(editCamX, editCamY, editCamZ);
			if (entitySelected !== undefined)
			{
				inEntity = true;
				curEntity = entitySelected;
				HideAllMenus();
				ShowMenu("edit_entity");
				SetupEntityEditingMenu();
			}
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
			StopTestingPlayer();
			inPlayer = false;
			curPlayerID = undefined;
			editorActive = true;
			HideAllMenus();
			ShowMenu("edit_level");
		break;

		// Entity menu
		case "stop_edit_entity":
			inEntity = false;
			curEntity = undefined;
			HideAllMenus();
			ShowMenu("edit_level");
		break;

		// Area menu
		case "stop_edit_area":
			inArea = false;
			curArea = undefined;
			HideAllMenus();
			ShowMenu("edit_level");
		break;
		case "resize_area":
		break;
		case "move_area":
		break;
		case "set_rules_area":
		break;
		case "delete_area":
			DeleteArea();
			inArea = false;
			curArea = undefined;
			HideAllMenus();
			ShowMenu("edit_level");
		break;
		case "close_over_menu":
			HideAllOverMenus();
			HideDarkCover();
		break;
		case "add_entity_variable":
			ShowDarkCover();
			ShowMenu("add_entity_variable")
		break;
		case "add_entity_trigger":
			ShowDarkCover();
			ShowMenu("add_entity_trigger")
		break;
		case "select_trigger":
			// Select new trigger based on data-extra
			curEntity.rules.push({trigger: extra, block: []});
			HideAllOverMenus();
			HideDarkCover();
			SetupEntityRules();
		break;
		case "select_effect":
			curBlock.push({effect: extra, variables: []});
		break;
		case "select_condition":
			curBlock.push({condition: extra, variables: [], trueBlock: [], falseBlock: []});
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

function SetupEntityEditingMenu () {
	var colorInput = document.getElementById("entity_color_input");
	if (curEntity.style.color !== undefined)
	{
		colorInput.value = curEntity.style.color;
	}
	SetupEntityRules();
}

function SetupEntityRules () {
	// Get rules box
	var rulesBox = document.getElementById("entity_rules_box");
	// Clear rules box
	while (rulesBox.firstChild)
	{
		rulesBox.removeChild(rulesBox.firstChild);
	}
	// Recurse through rules and make divs based on the structure
	CreateEntityRuleElementsRecurse(rulesBox, curEntity.rules, "");
}

function CreateEntityRuleElementsRecurse (container, rules, nesting) {
	// Loop through rules array
	// Create div for each and possibly recurse through sub-blocks
	for (var i = 0; i < rules.length; i++)
	{
		var rule = rules[i];
		var ruleDiv = CreateNewDiv(container, "rule", undefined, "rule_" + nesting + i);
		// Trigger: "T: ", Condition: "?: ", Effect: 
		var symbol = (rule.trigger !== undefined ? "T: " : (rule.condition !== undefined ? "?: " : "-"))
		var ruleSymbol = CreateNewDiv(ruleDiv, "rule_symbol", symbol, undefined);
		var ruleTitle = CreateNewDiv(ruleDiv, "rule_title", GetRuleText(rule), undefined);
		var ruleClose = CreateNewDiv(ruleDiv, "rule_remove", "X", undefined);
		if (rule.block !== undefined)
		{
			var ruleBlock = CreateNewDiv(ruleDiv, "rule_block", undefined, undefined);
			CreateEntityRuleElementsRecurse(ruleBlock, rule.block, nesting + i + "_block_");
			var addSubRuleButton = CreateNewDiv(ruleBlock, "add_sub_rule", "Add Effect or Condition", undefined);
			addSubRuleButton.setAttribute("data-nesting", nesting + i + "_block_");
		}
		if (rule.trueBlock !== undefined)
		{
			var ruleBlock = CreateNewDiv(ruleDiv, "rule_block", undefined, undefined);
			CreateEntityRuleElementsRecurse(ruleBlock, rule.block, nesting + i + "_trueblock_");
			var addSubRuleButton = CreateNewDiv(ruleBlock, "add_sub_rule", "Add Effect or Condition", undefined);
			addSubRuleButton.setAttribute("data-nesting", nesting + i + "_trueblock_");
		}
		if (rule.falseBlock !== undefined)
		{
			var ruleBlock = CreateNewDiv(ruleDiv, "rule_block", undefined, undefined);
			CreateEntityRuleElementsRecurse(ruleBlock, rule.block, nesting + i + "_falseblock_");
			var addSubRuleButton = CreateNewDiv(ruleBlock, "add_sub_rule", "Add Effect or Condition", undefined);
			addSubRuleButton.setAttribute("data-nesting", nesting + i + "_falseblock_");
		}
	}
}

var ruleData = {
	"entity_steps_adjacent": "Entity Steps Adjacent",
}

function GetRuleText (rule) {
	if (ruleData[rule] !== undefined)
	{
		return ruleData[rule];
	}
	return "Rule Text Here";
}

