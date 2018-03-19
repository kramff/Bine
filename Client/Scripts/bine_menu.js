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
		var menu = menus[i];
		menu.classList.remove("active_menu");
	}
}

function HideAllOverMenu2s () {
	var menu2s = document.getElementsByClassName("over_menu_2");
	for (var i = 0; i < menu2s.length; i++) {
		var menu2 = menu2s[i];
		menu2.classList.remove("active_menu");
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

function ShowDarkCover2 () {
	var darkCover2 = document.getElementById("dark_cover_2");
	darkCover2.classList.add("active_cover");
}

function HideDarkCover2 () {
	var darkCover2 = document.getElementById("dark_cover_2");
	darkCover2.classList.remove("active_cover");
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

		if (menu.classList.contains("allow_camera_controls"))
		{
			cameraControlsEnabled = true;
		}
		else
		{
			cameraControlsEnabled = false;
		}
		if (menu.classList.contains("allow_edit_tiles"))
		{
			tileEditingEnabled = true;
		}
		else
		{
			tileEditingEnabled = false;
		}
	}
	else
	{
		console.error("Could not get menu with id " + menuId);
	}
}

function ButtonClick (button) {
	if (button.dataset.menu !== undefined)
	{
		HideAllMenus();
		ShowMenu(button.dataset.menu);
	}
	else if (button.dataset.action !== undefined)
	{
		if (button.dataset.extra !== undefined)
		{
			DoButtonAction(button.dataset.action, button.dataset.extra);
		}
		else
		{
			DoButtonAction(button.dataset.action);
		}
	}
}

function SetupButtons () {
	document.body.onselectstart = function () {
		return false;
	}
	// Buttons for going to menus and doing actions
	document.body.onclick = function () {
		if (event.target.classList.contains("button"))
		{
			ButtonClick(event.target)
		}
	}
	// var buttons = document.getElementsByClassName("button");
	// for (var i = 0; i < buttons.length; i++) {
	// 	var button = buttons[i];
	// 	button.onclick = ButtonClick;
	// }

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
				// var rule = GetRuleAtNestLocation(curEntity.rules, nesting);
				RemoveRuleFromNestLocation(curEntity.rules, nesting);
				SetupEntityRules();
			}
		}
	}
	var variableBox = document.getElementByClassName("variable_box");
	variableBox.onClick = function () {
		if (event.target.classList.contains("variable_edit"))
		{
			// Edit variable
		}
		else if (event.target.classList.contains("variable_remove"))
		{
			// Remove variable
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
			SendEntityChange();
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
		case "close_over_menu_2":
			HideAllOverMenu2s();
			HideDarkCover2();
		break;
		case "add_entity_variable":
			ShowDarkCover();
			ShowMenu("add_entity_variable");
		break;
		case "add_entity_trigger":
			ShowDarkCover();
			ShowMenu("add_entity_trigger");
		break;
		case "select_trigger":
			// Select new trigger based on data-extra
			curEntity.rules.push({trigger: extra, block: []});
			SetupEntityRules();
			HideAllOverMenus();
			HideDarkCover();
		break;
		case "select_effect":
			curBlock.push({effect: extra, variables: []});
			curNestingPoint = undefined;
			inNestingPoint = false;
			curBlock = undefined;
			inBlock = undefined;
			SetupEntityRules();
			HideAllOverMenus();
			HideDarkCover();
			
		break;
		case "select_condition":
			curBlock.push({condition: extra, variables: [], trueBlock: [], falseBlock: []});
			curNestingPoint = undefined;
			inNestingPoint = false;
			curBlock = undefined;
			inBlock = undefined;
			SetupEntityRules();
			HideAllOverMenus();
			HideDarkCover();
		break;
		case "select_entity_variable":
			ShowDarkCover2();
			if (extra === "string")
			{
				ShowMenu("input_variable_string");
			}
			if (extra === "number")
			{
				ShowMenu("input_variable_number");
			}
			if (extra === "entity")
			{

			}
			if (extra === "area")
			{

			}
			if (extra === "level")
			{

			}
			if (extra === "tile")
			{

			}
			if (extra === "coordinates")
			{

			}
		break;
		case "change_variable":
			// Get variable from variable edit window
			// Determine rule to edit from nesting point / curRule or something
			// Set the variable
			// Close the window
			// Clean up
		break;
		case "make_new_variable":
			if (extra === "string")
			{
				var varName = document.getElementById("input_string_name").value;
				var varValue = document.getElementById("input_string").value;
				var variableObj = {
					name: varName,
					value: varValue,
					type: "string",
				}
				curEntity.variables.push(variableObj);
			}
			if (extra === "number")
			{
				var varName = document.getElementById("input_number_name").value;
				var varValue = document.getElementById("input_number").value;
				var variableObj = {
					name: varName,
					value: varValue,
					type: "number",
				}
				curEntity.variables.push(variableObj);
			}
			if (extra === "entity")
			{

			}
			if (extra === "area")
			{

			}
			if (extra === "level")
			{

			}
			if (extra === "tile")
			{

			}
			if (extra === "coordinates")
			{

			}
			HideAllOverMenu2s();
			HideDarkCover2();
			HideAllOverMenus();
			HideDarkCover();
			// *** Update entity variable html display
			SetupEntityVariables();
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

var triggerData;
var conditionData;
var effectData;
function FillRuleOptions (sessionRef) {
	triggerData = sessionRef.ExportTriggerData();
	conditionData = sessionRef.ExportConditionData();
	effectData = sessionRef.ExportEffectData();

	var triggerChoiceBox = document.getElementById("triggers_choice_box");
	var effectChoiceBox = document.getElementById("effects_choice_box");
	var conditionChoiceBox = document.getElementById("conditions_choice_box");

	// Clear the menus (Is this necessary?)

	// Loop through the exported rule data and create rule buttons for each
	for (var triggerAbbrv in triggerData)
	{
		var triggerRule = triggerData[triggerAbbrv];
		CreateRuleOption(triggerChoiceBox, "trigger", triggerRule, triggerAbbrv);
	}

	for (var effectAbbrv in effectData) {
		var effectRule = effectData[effectAbbrv];
		CreateRuleOption(effectChoiceBox, "effect", effectRule, effectAbbrv);
	}

	for (var conditionAbbrv in conditionData) {
		var conditionRule = conditionData[conditionAbbrv];
		CreateRuleOption(conditionChoiceBox, "condition", conditionRule, conditionAbbrv);
	}
}

function CreateRuleOption (parent, type, ruleData, ruleAbbrv) {
	var ruleElement = CreateNewDiv(parent, "button", ruleData.text, undefined);
	ruleElement.setAttribute("data-action", "select_" + type);
	ruleElement.setAttribute("data-extra", ruleAbbrv);
}

function SetupEntityEditingMenu () {
	var colorInput = document.getElementById("entity_color_input");
	if (curEntity.style.color !== undefined)
	{
		colorInput.value = curEntity.style.color;
	}
	SetupEntityVariables();
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
		var ruleDiv = CreateNewDiv(container, "rule", undefined, undefined);
		ruleDiv.setAttribute("data-nesting", nesting + i);
		// Trigger: "T: ", Condition: "?: ", Effect: 
		var symbol = (rule.trigger !== undefined ? "rule_trigger" : (rule.condition !== undefined ? "rule_condition" : "rule_effect"))
		var ruleSymbol = CreateNewDiv(ruleDiv, "rule_symbol " + symbol, undefined, undefined);
		var ruleTitle = CreateNewDiv(ruleDiv, "rule_title", GetRuleText(rule, symbol), undefined);
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
			var ruleBlock = CreateNewDiv(ruleDiv, "rule_block trueBlock", undefined, undefined);
			CreateEntityRuleElementsRecurse(ruleBlock, rule.trueBlock, nesting + i + "_trueBlock_");
			var addSubRuleButton = CreateNewDiv(ruleBlock, "add_sub_rule", "Add Effect or Condition", undefined);
			addSubRuleButton.setAttribute("data-nesting", nesting + i + "_trueBlock_");
		}
		if (rule.falseBlock !== undefined)
		{
			var ruleBlock = CreateNewDiv(ruleDiv, "rule_block falseBlock", undefined, undefined);
			CreateEntityRuleElementsRecurse(ruleBlock, rule.falseBlock, nesting + i + "_falseBlock_");
			var addSubRuleButton = CreateNewDiv(ruleBlock, "add_sub_rule", "Add Effect or Condition", undefined);
			addSubRuleButton.setAttribute("data-nesting", nesting + i + "_falseBlock_");
		}
	}
}

function GetRuleText (rule, ruleType) {
	if (ruleType === "rule_trigger")
	{
		return triggerData[rule.trigger].text;
	}
	else if (ruleType === "rule_condition")
	{
		return conditionData[rule.condition].text;
	}
	else if (ruleType === "rule_effect")
	{
		return effectData[rule.effect].text;
	}
	return "missing rule text for " + rule;
}

function SetupEntityVariables () {
	// Get variables box
	var variablesBox = document.getElementById("entity_variables_box");
	// Clear variables box
	while (variablesBox.firstChild)
	{
		variablesBox.removeChild(variablesBox.firstChild);
	}
	// Loop through variables and make divs based on the structure
	CreateEntityVariableElements(variablesBox, curEntity.variables, "");
}

function CreateEntityVariableElements (container, variables) {
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];
		var variableDiv = CreateNewDiv(container, "variable", undefined, undefined);
		variableDiv.setAttribute("data-variable-id", variable.id);
		var varType = CreateNewDiv(variableDiv, "variable_type variable_" + variable.type, undefined, undefined);
		var varName = CreateNewDiv(variableDiv, "variable_name", variable.name, undefined);
		var varValue = CreateNewDiv(variableDiv, "variable_value", variable.value, undefined);
		var varEdit = CreateNewDiv(variableDiv, "variable_edit", "Edit", undefined);
		var varRemove = CreateNewDiv(variableDiv, "variable_remove", "Remove", undefined);
	}
}

