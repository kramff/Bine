// bine_menu.js
// interface code - menus, dom manipulation

"use strict";

function CreateNewDiv (parent, setClass, text, id) {
	var newDiv = document.createElement("div");
	if (setClass !== undefined) {
		newDiv.className = setClass;
	}
	if (text !== undefined) {
		newDiv.appendChild(document.createTextNode(text));
	}
	if (id !== undefined) {
		newDiv.setAttribute("id", id);
	}
	if (parent !== undefined) {
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
var currentMenuElement = document.getElementById("main_menu");
var currentClickableArea = undefined;

function ShowMenu (menuId) {
	var menuElement = document.getElementById(menuId);
	if (menuElement !== undefined) {

		currentMenu = menuId;
		currentMenuElement = menuElement;
		currentMenuElement.classList.add("active_menu");
		currentClickableArea = document.querySelector("#" + currentMenu + " .clickable_area") || undefined;

		if (currentMenuElement.classList.contains("allow_camera_controls")) {
			cameraControlsEnabled = true;
		}
		else {
			cameraControlsEnabled = false;
		}
		if (currentMenuElement.classList.contains("allow_edit_tiles")) {
			tileEditingEnabled = true;
		}
		else {
			tileEditingEnabled = false;
		}
	}
	else {
		console.error("Could not get menu with id " + menuId);
	}
}

function CheckIfInClickableArea (x, y) {
	if (currentClickableArea === undefined) {
		return false;
	}
	var boundingRect = currentClickableArea.getBoundingClientRect();
	if (
		x > boundingRect.x &&
		x < boundingRect.x + boundingRect.width &&
		y > boundingRect.y &&
		y < boundingRect.y + boundingRect.height) {
		return true;
	}
	return false;
}

function ButtonClick (button) {
	if (button.getAttribute("data-menu") !== null) {
		HideAllMenus();
		ShowMenu(button.getAttribute("data-menu"));
	}
	else if (button.getAttribute("data-action") !== null) {
		if (button.getAttribute("data-extra") !== null) {
			DoButtonAction(button.getAttribute("data-action"), button.getAttribute("data-extra"));
		}
		else {
			DoButtonAction(button.getAttribute("data-action"));
		}
	}
}

function SetupButtons () {
	document.body.onselectstart = function () {
		return false;
	}
	// Buttons for going to menus and doing actions
	document.body.onclick = function () {
		if (event.target.classList.contains("button")) {
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
		IN_MULTI_SESSION = true;
		if (event.target.classList.contains("session")) {
			var sessionID = event.target.getAttribute("session_id");
			if (sessionID !== null) {
				// Join session with this id
				JoinSession(sessionID);
				HideAllMenus();
				ShowMenu("edit_world");
			}
		}
	}
	// Enter a world by clicking on it
	var worldBoxes = document.getElementsByClassName("world_box");
	// Multiple world boxes:
	// Loading from local or from server
	for (var i = 0; i < worldBoxes.length; i++) {
		var worldBox = worldBoxes[i];
		worldBox.onclick = function () {
			if (event.target.classList.contains("world")) {
				var worldID = event.target.getAttribute("world_id");
				if (worldBox.classList.contains("local_worlds")) {
					// Load local world with new session
					IN_MULTI_SESSION = false;
					// TODO: Should actually look at the levels and pick the one with the right ID
					var selectedWorldData = loadedLocalWorlds[0];
					CreateSessionLoadedWorld(selectedWorldData);
					HideAllMenus();
					ShowMenu("edit_world");
				}
				else {
					// Load world from server with new session

				}
			}
		}
	}

	// Enter a level by clicking on it
	var levelBox = document.getElementsByClassName("level_box")[0];
	levelBox.onclick = function () {
		if (event.target.classList.contains("level")) {
			var levelID = event.target.getAttribute("level_id");
			if (levelID !== null) {
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
		if (event.target.classList.contains("add_sub_rule")) {
			var nesting = event.target.getAttribute("data-nesting");
			if (nesting !== null) {
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
		else if (event.target.classList.contains("rule_delete")) {
			// Remove the selected rule
			var ruleParent = event.target.parentElement;
			var nesting = ruleParent.getAttribute("data-nesting");
			if (nesting !== null) {
				// Remove the rule at that nesting point
				// var rule = GetRuleAtNestLocation(curEntity.rules, nesting);
				RemoveRuleFromNestLocation(curEntity.rules, nesting);
				SetupEntityRules();
			}
		}
		else if (event.target.classList.contains("required_variable")) {
			// TODO: Set this up
			// TODO: Pass in the selected variable slot and associated rule
			var ruleParent = event.target.parentElement;
			var nesting = ruleParent.getAttribute("data-nesting");
			var varSlot = event.target.getAttribute("data-variable-slot");

			curNestingPoint = nesting;
			inNestingPoint = true;

			inVariableSlot = true;
			curVariableSlot = varSlot;
			FillVariableSelection();
			ShowDarkCover();
			ShowMenu("select_variable");
		}
	}
	// Edit or delete a global variable
	var variableBox = document.getElementsByClassName("variable_box")[0];
	variableBox.onclick = function () {
		if (event.target.classList.contains("variable_edit")) {
			// Edit variable
		}
		else if (event.target.classList.contains("variable_delete")) {
			// Remove the associated variable
			var variableParent = event.target.parentElement;
			var variableID = variableParent.getAttribute("data-variable-id")
			
			if (variableID !== null) {
				// Remove the variable with that id
				DeleteVariableByID(curEntity.variables, variableID);
				SetupEntityVariables();
			}
		}
	}
	// Select a variable (Global or Local) to use in a rule's variable slot
	var selectGlobalVariablesBox = document.getElementById("select_variable_global_variables_box");
	var selectLocalVariablesBox = document.getElementById("select_variable_local_variables_box");
	selectGlobalVariablesBox.onClick = function () {
		if (event.target.classList.contains("selectable_variable")) {
			// TODO: Set this and the below function up
			// Picked a variable to use in the earlier selected variable slot
		}
	}
	selectLocalVariablesBox.onClick = function () {
		if (event.target.classList.contains("selectable_variable")) {
			// Picked a variable to use in the earlier selected variable slot
		}
	}
}

function DoButtonAction (action, extra) {
	switch (action) {
		default:
			console.log("No action set up for " + action);
		break;

		// Settings menu
		case "mute_sound":
			manualMuted = !manualMuted;
			document.querySelector("[data-action='mute_sound']").textContent = "Mute Sound (currently " + (!manualMuted ? "not " : "") + "muted)";
		break;

		case "create_session_new_world":
			IN_MULTI_SESSION = true;
			CreateSessionNewWorld();
			HideAllMenus();
			ShowMenu("edit_world");
		break;

		// Create a local-only session
		case "create_local_session_new_world":
			IN_MULTI_SESSION = false;
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
			CreateArea(editCamX, editCamY, editCamZ);
		break;
		case "edit_area":
			var areaSelected = curLevel.GetAreaAtLocation(editCamX, editCamY, editCamZ);
			if (areaSelected !== undefined) {
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
			if (entitySelected !== undefined) {
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
			curEntity.AddTrigger(extra);
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
			if (extra === "string") {
				document.getElementById("input_string_name").value = "";
				document.getElementById("input_string").value = "";
				ShowMenu("input_variable_string");
			}
			if (extra === "number") {
				document.getElementById("input_number_name").value = "";
				document.getElementById("input_number").value = "";
				ShowMenu("input_variable_number");
			}
			if (extra === "entity") {
				document.getElementById("input_entity_name").value = "";
				document.getElementById("input_entity").value = "";
				ShowMenu("input_variable_entity");
			}
			if (extra === "area") {
				document.getElementById("input_area_name").value = "";
				document.getElementById("input_area").value = "";
				ShowMenu("input_variable_area");
			}
			if (extra === "level") {
				document.getElementById("input_level_name").value = "";
				document.getElementById("input_level").value = "";
				ShowMenu("input_variable_level");
			}
			if (extra === "tile") {
				document.getElementById("input_tile_name").value = "";
				document.getElementById("input_tile").value = "";
				ShowMenu("input_variable_tile");
			}
			if (extra === "coordinates") {
				document.getElementById("input_coordinates_name").value = "";
				document.getElementById("input_coordinates").value = "";
				ShowMenu("input_variable_coordinates");
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
			var varName;
			var varValue;
			var variableObj;
			if (extra === "string") {
				varName = document.getElementById("input_string_name").value;
				varValue = document.getElementById("input_string").value;
				variableObj = {
					name: varName,
					value: varValue,
					type: "string",
				}
			}
			else if (extra === "number") {
				varName = document.getElementById("input_number_name").value;
				varValue = document.getElementById("input_number").value;
				variableObj = {
					name: varName,
					value: varValue,
					type: "number",
				}
			}
			else if (extra === "entity") {

			}
			else if (extra === "area") {

			}
			else if (extra === "level") {

			}
			else if (extra === "tile") {

			}
			else if (extra === "coordinates") {

			}
			// Check if variable created correctly
			if (variableObj !== undefined) {
				curEntity.variableCounter ++;
				variableObj.id = curEntity.variableCounter;
				curEntity.variables.push(variableObj);
			}
			HideAllOverMenu2s();
			HideDarkCover2();
			HideAllOverMenus();
			HideDarkCover();
			// *** Update entity variable html display
			SetupEntityVariables();
		break;
		case "inventory":
			HideAllMenus();
			ShowMenu("inventory");
			inInventory = true;
		break;
		case "leave_note":
			HideAllMenus();
			ShowMenu("leaving_note");
			leavingNote = true;
		break;
		case "close_inventory":
			HideAllMenus();
			ShowMenu("test_level");
			inInventory = false;
		break;
	}
}

// Enable or disable the multiplayer buttons
function SetMultiplayerButtonEnabled (enabledState) {
	var joinSessionButton = document.getElementById("button_join_session");
	var createSessionButton = document.getElementById("button_create_session");
	if (enabledState) {
		joinSessionButton.className = "button";
		createSessionButton.className = "button";
	}
	else {
		joinSessionButton.className = "button disabled";
		createSessionButton.className = "button disabled";
	}
}

// sessionData: [{session}, ...]
// session: id, name, mode, worldName, playerCount
function FillSessionBox (sessionData) {
	var sessionBox = document.getElementsByClassName("session_box")[0];

	// Clear out old elements
	while (sessionBox.firstChild) {
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
function FillWorldBox (worldData, boxType) {
	var worldBoxClass = "world_box";
	if (boxType !== undefined) {
		worldBoxClass += " " + boxType;
	}
	var worldBoxes = document.getElementsByClassName(worldBoxClass);

	for (var i = 0; i < worldBoxes.length; i++) {
		var worldBox = worldBoxes[i];
		// Clear out old elements
		while (worldBox.firstChild) {
			worldBox.removeChild(worldBox.firstChild);
		}

		// Create an element for each world
		for (var i = 0; i < worldData.length; i++) {
			var world = worldData[i];
			// Main new div
			var worldDiv = CreateNewDiv(worldBox, "world", undefined, undefined);
			worldDiv.setAttribute("world_id", world.id);
			// Name
			CreateNewDiv(worldDiv, "world_name", world.name, undefined);
			// Level Count
			CreateNewDiv(worldDiv, "world_level_count", world.levelCount, undefined);
		}
	}
}

function FillLevelBox (levelArray) {
	var levelBox = document.getElementsByClassName("level_box")[0];

	// Clear out old elements
	while (levelBox.firstChild) {
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
	for (var triggerAbbrv in triggerData) {
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
	if (curEntity.style.color !== undefined) {
		colorInput.value = curEntity.style.color;
	}
	SetupEntityVariables();
	SetupEntityRules();
}

function SetupEntityRules () {
	// Get rules box
	var rulesBox = document.getElementById("entity_rules_box");
	// Clear rules box
	while (rulesBox.firstChild) {
		rulesBox.removeChild(rulesBox.firstChild);
	}
	// Recurse through rules and make divs based on the structure
	CreateEntityRuleElementsRecurse(rulesBox, curEntity.rules, "");
}

function CreateEntityRuleElementsRecurse (container, rules, nesting) {
	// Loop through rules array
	// Create div for each and possibly recurse through sub-blocks
	for (var i = 0; i < rules.length; i++) {
		var rule = rules[i];
		var ruleDiv = CreateNewDiv(container, "rule", undefined, undefined);
		ruleDiv.setAttribute("data-nesting", nesting + i);
		// Trigger: "T: ", Condition: "?: ", Effect: 
		var ruleType = (rule.trigger !== undefined ? "rule_trigger" : (rule.condition !== undefined ? "rule_condition" : "rule_effect"))
		// Create elements
		var ruleSymbol = CreateNewDiv(ruleDiv, "rule_symbol " + ruleType, undefined, undefined);
		var ruleTitle = CreateNewDiv(ruleDiv, "rule_title", GetRuleText(rule, ruleType), undefined);
		var ruleClose = CreateNewDiv(ruleDiv, "rule_delete", "X", undefined);
		// Create additional options (variables, etc)
		AddRuleOptions(ruleDiv, rule, ruleType);
		// If the rule has a sub-block, recursively create those
		if (rule.block !== undefined) {
			var nestingString = nesting + i + "_block_";
			var divClass = "rule_block";
			CreateRuleBlock(ruleDiv, rule, nestingString, divClass, "block");
		}
		if (rule.trueBlock !== undefined) {
			var nestingString = nesting + i + "_trueBlock_";
			var divClass = "rule_block trueBlock";
			CreateRuleBlock(ruleDiv, rule, nestingString, divClass, "trueBlock");
		}
		if (rule.falseBlock !== undefined) {
			var nestingString = nesting + i + "_falseBlock_";
			var divClass = "rule_block falseBlock";
			CreateRuleBlock(ruleDiv, rule, nestingString, divClass, "falseBlock");
		}
	}
}

function CreateRuleBlock (ruleDiv, rule, nestingString, divClass, blockMode) {
	var ruleBlock = CreateNewDiv(ruleDiv, divClass, undefined, undefined);
	var ruleBlock;
	CreateEntityRuleElementsRecurse(ruleBlock, rule[blockMode], nestingString);
	var addSubRuleButton = CreateNewDiv(ruleBlock, "add_sub_rule", "Add Effect or Condition", undefined);
	addSubRuleButton.setAttribute("data-nesting", nestingString);
}

function GetRuleText (rule, ruleType) {
	if (ruleType === "rule_trigger") {
		return triggerData[rule.trigger].text;
	}
	else if (ruleType === "rule_condition") {
		return conditionData[rule.condition].text;
	}
	else if (ruleType === "rule_effect") {
		return effectData[rule.effect].text;
	}
	return "missing rule text for " + rule;
}

// Make the options needed to describe the rule. (Variables)
function AddRuleOptions (ruleDiv, rule, ruleType) {
	var ruleData;
	if (ruleType === "rule_trigger") {
		ruleData = triggerData[rule.trigger];
	}
	else if (ruleType === "rule_condition") {
		ruleData = conditionData[rule.condition];
	}
	else if (ruleType === "rule_effect") {
		ruleData = effectData[rule.effect];
	}
	else {
		console.log("missing rule options for " + rule);
		return;
	}
	// For each created variable, make a element that lets the user name the new variable
	if (ruleData.createdVariables !== undefined) {
		for (var i = 0; i < ruleData.createdVariables.length; i++) {
			var createdVariable = ruleData.createdVariables[i];
			// createdVariable.name (default name)
			// createdVariable.type
			var createdVarDiv = CreateNewDiv(ruleDiv, "created_variable", "Make var: " + createdVariable.name + "(" + createdVariable.type + ")", undefined);
			createdVarDiv.setAttribute("data-created-variable", i);
		}
	}
	// For each required variable, make an element that lets the user pick a variable to use
	if (ruleData.requiredVariables !== undefined) {
		for (var i = 0; i < ruleData.requiredVariables.length; i++) {
			var requiredVariable = ruleData.requiredVariables[i];
			// requiredVariable is just a type string ("number", "string", "entity", etc)
			var reqVarDiv = CreateNewDiv(ruleDiv, "required_variable", "Need var: " + "(" + requiredVariable + ")", undefined);
			reqVarDiv.setAttribute("data-variable-slot", i);
		}
	}
}

function GetRuleRequiredVariables (ruleType, rule) {

}

function GetRuleAtNestLocation (rules, nesting) {
	var nestingSplit = nesting.split("_");
	var curRuleData = rules;
	for (var i = 0; i < nestingSplit.length; i++) {
		var curNestPoint = nestingSplit[i];
		if (curNestPoint !== "") {
			curRuleData = curRuleData[curNestPoint];
		}
		else {
			return curRuleData;
		}
	}
	return curRuleData;
}

function RemoveRuleFromNestLocation (rules, nesting) {
	var nestingSplit = nesting.split("_");
	var curRuleData = rules;
	var prevRuleData = rules;
	// Use same formula but keep track of previous rule data as well
	for (var i = 0; i < nestingSplit.length; i++) {
		prevRuleData = curRuleData;
		var curNestPoint = nestingSplit[i];
		if (curNestPoint !== "") {
			curRuleData = curRuleData[curNestPoint];
		}
		else {
			break;
		}
	}
	// Remove curRuleData (rule entry) from prevRuleData (should be list)
	prevRuleData.splice(prevRuleData.indexOf(curRuleData), 1);
}

function SetupEntityVariables () {
	// Get variables box
	var variablesBox = document.getElementById("entity_variables_box");
	// Clear variables box
	while (variablesBox.firstChild) {
		variablesBox.removeChild(variablesBox.firstChild);
	}
	// Loop through variables and make divs based on the structure
	CreateEntityVariableElementsForMainList(variablesBox, curEntity.variables, "");
}

// Make variable elements for listing on main entity menu
function CreateEntityVariableElementsForMainList (container, variables) {
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];
		// Skip Non-Global variables
		if (!variable.local) {
			var variableDiv = CreateNewDiv(container, "variable", undefined, undefined);
			variableDiv.setAttribute("data-variable-id", variable.id);
			var varType = CreateNewDiv(variableDiv, "variable_type variable_" + variable.type, undefined, undefined);
			var varName = CreateNewDiv(variableDiv, "variable_name", variable.name, undefined);
			var varValue = CreateNewDiv(variableDiv, "variable_value", variable.value, undefined);
			var varEdit = CreateNewDiv(variableDiv, "variable_edit", "Edit", undefined);
			var varRemove = CreateNewDiv(variableDiv, "variable_delete", "X", undefined);
		}
	}
}

// Make variable elements for selecting a variable to put into a rule's variable slot
function CreateEntityVariableElementsForSelection (container, variables) {
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];
		var variableDiv = CreateNewDiv(container, "selectable_variable", undefined, undefined);
		variableDiv.setAttribute("data-variable-id", variable.id);
		var varName = CreateNewDiv(variableDiv, "variable_name", variable.name, undefined);
		// Only show name, value is dynamic
	}
}

// Fill in the options for selecting a variable to put into a slot
function FillVariableSelection () {
	// Global variables
	var globalsBox = document.getElementById("select_variable_global_variables_box");
	while (globalsBox.firstChild) {
		globalsBox.removeChild(globalsBox.firstChild);
	}
	var globalVars = GetEntityGlobalVariablesOfType(curEntity, "string");
	CreateEntityVariableElementsForSelection(globalsBox, globalVars);
	// Local variables
	var localsBox = document.getElementById("select_variable_local_variables_box");
	while (localsBox.firstChild) {
		localsBox.removeChild(localsBox.firstChild);
	}
	var localVars = GetEntityLocalVariablesOfType(curEntity, "string");
	CreateEntityVariableElementsForSelection(localsBox, localVars);
}

function GetEntityGlobalVariablesOfType (entity, type) {
	var varList = [];
	for (var i = 0; i < entity.variables.length; i++) {
		var variable = entity.variables[i];
		if (!variable.local) {
			if (variable.type === type) {
				varList.push(variable);
			}
		}
	}
	return varList;
}

function GetEntityLocalVariablesOfType (entity, type) {
	// TODO: Need to check if local variable is actually local to the rule in question
	// May need to come at this from the other angle
	// follow rule tree upwards from target rule and keep track of variables along the way
	var varList = [];
	for (var i = 0; i < entity.variables.length; i++) {
		var variable = entity.variables[i];
		if (variable.local) {
			if (variable.type === type) {
				varList.push(variable);
			}
		}
	}
	return varList;
}

function GetVariableByID (variables, variableID) {
	variableID = Number(variableID);
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];
		if (variable.id === variableID) {
			return variable;
		}
	}
}

function DeleteVariableByID (variables, variableID) {
	variableID = Number(variableID);
	for (var i = variables.length - 1; i >= 0; i--) {
		var variable = variables[i];
		if (variable.id === variableID) {
			variables.splice(i, 1);
			return;
		}
	}
}
