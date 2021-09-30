// bine_menu.js
// interface code - menus, dom manipulation

"use strict";

var buttonTypes = [
	"button",
	"add_sub_rule",
	"rule_remove",
	"required_variable",
	"selected_variable",
	"rule_delete",
	"variable_delete",
	"construction_component",
	"construction_cancel",
	"level",
	"session",
	"world",
	"selectable_variable",
	"variable_edit",
	"entity_template",
	"level_button",
];

var variableTypes = [
	"string",
	"number",
	"boolean",
	"entity",
	"area",
	"level",
	"tile",
	"coordinates",
];

var buttonTypesSelector = "." + buttonTypes.join(", .");

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
	document.getElementsByClassName("background_layer").item(0).style["background-color"] = newColor;
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

// Extra stuff to do for any button activation
function ButtonMisc () {

	// Get rid of all keyboard shortcut indicators
	RemoveIndicators();
}

function SetupButtons () {
	document.body.onselectstart = function () {
		return false;
	}
	// Buttons for going to menus and doing actions
	document.body.onclick = function () {
		if (event.target.classList.contains("button")) {
			ButtonClick(event.target);
			ButtonMisc();
		}
	}
	// var buttons = document.getElementsByClassName("button");
	// for (var i = 0; i < buttons.length; i++) {
	// 	var button = buttons[i];
	// 	button.onclick = ButtonClick;
	// }

	// Enter a session by clicking on it
	var sessionBox = document.getElementsByClassName("session_box").item(0);
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
			ButtonMisc();
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
					var selectedWorldData = loadedLocalWorlds[worldID];
					CreateSessionLoadedWorld(selectedWorldData);
					HideAllMenus();
					ShowMenu("edit_world");
				}
				else {
					// Load world from server with new session

				}
				ButtonMisc();
			}
		}
	}

	// Enter a level by clicking on it
	var levelBox = document.getElementsByClassName("level_box").item(0);
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
		ButtonMisc();
	}
	// Add a sub-rule (Effect or Condition) by clicking on the buttons placed in each rule block.
	var rules_box = document.getElementsByClassName("rules_box").item(0);
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

			inNestingPoint = true;
			curNestingPoint = nesting;

			inVariableSlot = true;
			curVariableSlot = varSlot;
			FillVariableSelection();
			ShowDarkCover();
			ShowMenu("select_variable");
		}
		else if (event.target.classList.contains("construction_component")) {
			// Open menu to pick variable to use for this construction component
			// TODO: Figure out what the variable ID is supposed to be
			// (Probably some nesting stuff)
			var constructionVariableID = 123456;
			OpenEditVariableMenu(constructionVariableID);
		}
		else if (event.target.classList.contains("construction_cancel")) {
			// Stop using the construction (it will turn back into a required_variable)
		}
		ButtonMisc();
	}
	// Edit or delete a global variable
	var variableBox = document.getElementsByClassName("variable_box").item(0);
	variableBox.onclick = function () {
		if (event.target.classList.contains("variable_edit")) {
			// Edit a variable
			var variableParent = event.target.parentElement;
			var variableID = variableParent.getAttribute("data-variable-id");
			OpenEditVariableMenu(variableID);
		}
		else if (event.target.classList.contains("variable_delete")) {
			// Remove the associated variable
			var variableParent = event.target.parentElement;
			var variableID = variableParent.getAttribute("data-variable-id");
			
			if (variableID !== null) {
				// Remove the variable with that id
				DeleteVariableByID(curEntity.variables, variableID, curEntity.rules);
				SetupEntityVariables();
				// If a rule used the variable, indicate that with empty variable slots.
				// (Same as if there never was a variable selected for that slot)
				SetupEntityRules();
			}
		}
		ButtonMisc();
	}
	// Pick a variable to use in a rule
	var variableChoiceBoxes = document.getElementsByClassName("choice_box");
	for (var i = 0; i < variableChoiceBoxes.length; i++) {
		var variableChoiceBox = variableChoiceBoxes[i];
		variableChoiceBox.onclick = function () {
			var variableElement;
			if (event.target.classList.contains("selectable_variable")) {
				// Clicked on element directly
				variableElement = event.target;
			}
			else if (event.target.parentElement.classList.contains("selectable_variable")) {
				// Clicked on child element, use parent
				variableElement = event.target.parentElement;
			}
			if (variableElement !== undefined) {
				var variableID = variableElement.getAttribute("data-variable-id");
				if (variableID === "literal_variable") {
					// Go to a menu to write in a variable literal
					var newVariable = undefined;
					var ruleBlock = GetRuleAtNestLocation(curEntity.rules, curNestingPoint);
					var variableType = GetVariableType(ruleBlock, curVariableSlot);
					ShowVariableInputMenu(variableType, true);
				}
				// else if (variableConstructors.indexOf(variableID) !== -1) {
				else {
					// Get the block to edit
					var ruleBlock = GetRuleAtNestLocation(curEntity.rules, curNestingPoint);

					// Check if a construction was selected
					if (variableID.indexOf("construction_") !== -1) {
						// Make a new variable of type "construction"
						// with a type (which construction)
						// and an array of variables it's looking at (empty at first)
						var constructionType = variableID.replace("construction_", "");
						var newConstruction = {
							type: constructionType,
							conVars: [],
						};
						var variableObj = {
							name: "C",
							value: newConstruction,
							type: "construction",
						}
						curEntity.variableCounter ++;
						variableObj.id = curEntity.variableCounter;
						variableObj.construction = true;
						curEntity.variables.push(variableObj);

						// Use the new construction as the variable for this rule
						ruleBlock.variables[curVariableSlot] = variableObj.id;
					}
					else {
						// Otherwise, we have selected an existing variable to use
						// Set the variable slot to the id of the selected variable
						ruleBlock.variables[curVariableSlot] = variableID;
					}
					// Then, leave this menu, done selecting variable.
					DoButtonAction ("close_over_menu_for_variable_selecting");
					SetupEntityRules();
				}
				ButtonMisc();
			}
		}
	}
	// Pick an existing entity template to edit
	var entityTemplateBox = document.getElementsByClassName("entity_template_box").item(0);
	entityTemplateBox.onclick = function () {
		if (event.target.classList.contains("entity_template")) {
			// Move to entity template editing screen and load the associated entity template
		}
	}
	// For a level variable, pick a level to use
	var levelVariableButtonBox = document.getElementById("input_box_level");
	levelVariableButtonBox.onclick = function () {
		if (event.target.classList.contains("level_button")) {
			// var levelID = event.target.getAttribute("level_id");
			var alreadySelected = document.getElementsByClassName("level_selected");
			if (alreadySelected.length > 0)
			{
				alreadySelected.item(0).classList.remove("level_selected");
			}
			event.target.classList.add("level_selected");
		}
	}
	// Change appearance and basic attributes of an entity
	var settingInputFunc = function (e) {
		// console.log(e);
		var settingType = e.target.id;
		var setTo;
		if (e.target.type === "checkbox") {
			setTo = e.target.checked;
		}
		else {
			setTo = e.target.value;
		}
		var entityAttribute = entityAttributeDictionary[settingType];
		if (entityAttribute !== undefined) {
			curEntity[entityAttribute] = setTo;
		}
		else if (entitySetting !== undefined) {
			var entitySetting = entitySettingDictionary[settingType];
			if (entityAttribute !== undefined) {
				curEntity[entityAttribute] = setTo;
			}
			else {
				console.log("problem trying to edit an entity");
			}
		}
	}
	var entitySettings = document.querySelectorAll(".menu_container[id='edit_entity'] .setting_box");
	for (var i = 0; i < entitySettings.length; i++) {
		var entitySetting = entitySettings[i];
		entitySetting.oninput = settingInputFunc;
	}
}
var entityAttributeDictionary = {
	entity_color_input: "style",
	x_entity_position: "x",
	y_entity_position: "y",
	z_entity_position: "z",
	x_entity_size: "xSize",
	y_entity_size: "ySize",
	z_entity_size: "zSize",
	entity_move_speed: "x",
	entity_fall_speed: "x",
};
var entitySettingDictionary = {
	entity_visible: "visible",
	entity_solid: "solid",
	entity_standable: "standable",
	entity_pushable: "pushable",
	entity_gravity: "gravity",
};

function OpenEditVariableMenu (variableID) {

	if (variableID !== null) {
		// Edit the variable with that id
		inVariable = true;
		curVariable = GetVariableByID(curEntity.variables, variableID);
		ShowDarkCover2();

		// TODO: Setup other types of variables
		// if (extra === "string") {
		if (curVariable.type === "string") {
			document.getElementById("input_string_name").value = curVariable.name;
			document.getElementById("input_string").value = curVariable.value;
			ShowMenu("input_variable_string");
		}
		else if (curVariable.type === "number") {
			document.getElementById("input_number_name").value = curVariable.name;
			document.getElementById("input_number").value = curVariable.value;
			ShowMenu("input_variable_number");
		}
		else if (curVariable.type === "boolean") {
			document.getElementById("input_boolean_name").value = curVariable.name;
			document.getElementById("input_boolean").value = curVariable.value;
			ShowMenu("input_variable_boolean");
		}
		else if (curVariable.type === "entity") {
			// TODO: Fill in the rest of these variable types
		}
		else if (curVariable.type === "area") {

		}
		else if (curVariable.type === "level") {
			document.getElementById("input_level_name").value = curVariable.name;
			setupLevelVariableSelect();
			var levelID = curVariable.value;
			var levelButton = document.querySelector(".level_button[level_id='" + levelID + "']")
			levelButton.classList.add("level_selected");
			ShowMenu("input_variable_level");
		}
		else if (curVariable.type === "tile") {

		}
		else if (curVariable.type === "coordinates") {
			document.getElementById("input_number_name").value = curVariable.name;
			document.getElementById("input_coordinate_x").value = curVariable.value.x;
			document.getElementById("input_coordinate_y").value = curVariable.value.y;
			document.getElementById("input_coordinate_z").value = curVariable.value.z;
			ShowMenu("input_variable_coordinates");
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

		case "create_new_template":
			inEntity = true;
			inEntityTemplate = true;
			// Make a blank entity
			// TODO: Put the newly created entity into the list of templates
			curEntity = {};
			curEntityTemplate = 11234;
			HideAllMenus();
			ShowMenu("edit_entity");
			SetupEntityEditingMenu();

		break;
		case "edit_player_template":
			if (curSession.playerTemplate !== undefined) {
				inEntity = true;
				inPlayerTemplate = true;
				curEntity = curSession.playerTemplate 
				HideAllMenus();
				ShowMenu("edit_entity");
				SetupEntityEditingMenu();
			}
			else {
				alert("Player template missing!");
			}
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
			inPlayerTemplate = false;
			inEntityTemplate = false;
			curEntityTemplate = undefined;
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
		case "close_input_variable":
			HideAllOverMenu2s();
			HideDarkCover2();
			// May either be creating a new variable or editing an existing variable
			// In either case, end up with no current variable
			curVariable = undefined;
			inVariable = false;
		break;
		case "close_over_menu_for_variable_selecting":
			HideAllOverMenus();
			HideDarkCover();
			// Turn off these variables so app doesn't get into weird state
			inNestingPoint = false;
			curNestingPoint = undefined;
			inVariableSlot = false;
			curVariableSlot = undefined;
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
			ShowVariableInputMenu(extra, false);
		break;
		case "confirm_variable_input":
			// May either be editing an existing variable or creating a new variable
			if (inLiteralMode) {
				// Editing a literal variable here.
				// Does anything need to be different here, or is it only at the end?
			}
			var varName;
			var varValue;
			var variableObj;
			var variableOkay = true;
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
			else if (extra === "boolean") {
				varName = document.getElementById("input_boolean_name").value;
				var selectedOption = document.querySelector('input[name="boolean_input"]:checked');
				if (selectedOption === null) {
					// Nothing was selected
					return;
				}
				var optionValue = selectedOption.value;
				varValue = (optionValue === "boolean_true" ? true : false);
				variableObj = {
					name: varName,
					value: varValue,
					type: "boolean",
				}
			}
			else if (extra === "entity") {

			}
			else if (extra === "area") {

			}
			else if (extra === "level") {
				varName = document.getElementById("input_level_name").value;
				var levelSelectedButtonElements = document.getElementsByClassName("level_selected");
				if (levelSelectedButtonElements.length > 0) {
					var levelSelectedButton = levelSelectedButtonElements.item(0);
					var levelID = levelSelectedButton.getAttribute("level_id");
					if (levelID !== null) {
						variableObj = {
							name: varName,
							value: Number(levelID),
							type: "level",
						};
					}
					else {
						variableOkay = false;
					}
				}
				else
				{
					variableOkay = false;
				}
			}
			else if (extra === "tile") {

			}
			else if (extra === "coordinates") {
				varName = document.getElementById("input_coordinates_name").value;
				var varX = document.getElementById("input_coordinate_x").value;
				var varY = document.getElementById("input_coordinate_y").value;
				var varZ = document.getElementById("input_coordinate_z").value;
				variableObj = {
					name: varName,
					value: {x: varX, y: varY, z: varZ},
					type: "coordinates",
				}
			}
			if (variableOkay)
			{
				// Check if variableObj exists
				if (variableObj !== undefined) {
					if (inVariable) {
						// Editing an existing variable
						var variableID = curVariable.id;
						variableObj.id = variableID;
						ReplaceVariableByID(curEntity.variables, variableID, variableObj);
					}
					else
					{
						// Creating a new variable
						curEntity.variableCounter ++;
						variableObj.id = curEntity.variableCounter;
						curEntity.variables.push(variableObj);
						if (inLiteralMode) {
							// Creating a new Literal Variable
							// Set literal to true
							variableObj.literal = true;
							// Set name to be a stringify version of the value
							variableObj.name = JSON.stringify(variableObj.value) + "(literal)";

							// At this point, also use this newly created variable
							//  as the selected variable to use at the previously
							//  selected rule blocks
							var ruleBlock = GetRuleAtNestLocation(curEntity.rules, curNestingPoint);
							// Set the variable slot to the id of the new literal variable
							ruleBlock.variables[curVariableSlot] = variableObj.id;
							SetupEntityRules();
						} 
					}
					HideAllOverMenu2s();
					HideDarkCover2();
					HideAllOverMenus();
					HideDarkCover();
					// Update entity variable html display
					SetupEntityVariables();
				}
			}

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
		case "export_world_to_file":
			alert("clicked export button");
		break;
	}
}

var inLiteralMode = false;
function ShowVariableInputMenu (variableType, literalMode) {
	inLiteralMode = literalMode;
	ShowDarkCover2();
	var nameElement;
	if (variableType === "string") {
		nameElement = document.getElementById("input_string_name");
		nameElement.value = "";
		document.getElementById("input_string").value = "";
		ShowMenu("input_variable_string");
	}
	else if (variableType === "number") {
		nameElement = document.getElementById("input_number_name");
		nameElement.value = "";
		document.getElementById("input_number").value = "";
		ShowMenu("input_variable_number");
	}
	else if (variableType === "boolean") {
		nameElement = document.getElementById("input_boolean_name");
		nameElement.value = "";
		// document.getElementById("input_boolean").value = "";
		document.getElementById("boolean_option1").checked = false;
		document.getElementById("boolean_option2").checked = false;
		ShowMenu("input_variable_boolean");
	}
	else if (variableType === "entity") {
		nameElement = document.getElementById("input_entity_name");
		nameElement.value = "";
		// document.getElementById("input_entity").value = "";
		ShowMenu("input_variable_entity");
	}
	else if (variableType === "area") {
		nameElement = document.getElementById("input_area_name");
		nameElement.value = "";
		// document.getElementById("input_area").value = "";
		ShowMenu("input_variable_area");
	}
	else if (variableType === "level") {
		nameElement = document.getElementById("input_level_name");
		nameElement.value = "";
		// document.getElementById("input_level").value = "";
		setupLevelVariableSelect();
		ShowMenu("input_variable_level");
	}
	else if (variableType === "tile") {
		nameElement = document.getElementById("input_tile_name");
		nameElement.value = "";
		// document.getElementById("input_tile").value = "";
		ShowMenu("input_variable_tile");
	}
	else if (variableType === "coordinates") {
		nameElement = document.getElementById("input_coordinates_name");
		nameElement.value = "";
		document.getElementById("input_coordinate_x").value = "";
		document.getElementById("input_coordinate_y").value = "";
		document.getElementById("input_coordinate_z").value = "";
		ShowMenu("input_variable_coordinates");
	}

	// Stuff if this is actually a Literal Value not a Global Variable
	if (inLiteralMode) {
		nameElement.hidden = true;
		// nameElement.previousElementSibling.hidden = true;
	}
	else {
		nameElement.hidden = false;
		// nameElement.previousElementSibling.hidden = false;
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
	var sessionBox = document.getElementsByClassName("session_box").item(0);

	// Clear out old elements
	while (sessionBox.firstChild) {
		sessionBox.removeChild(sessionBox.lastChild);
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
	var sessionBox = document.getElementsByClassName("session_box").item(0);
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
			worldBox.removeChild(worldBox.lastChild);
		}

		// Create an element for each world
		for (var i = 0; i < worldData.length; i++) {
			var world = worldData[i];
			// Main new div
			var worldDiv = CreateNewDiv(worldBox, "world", undefined, undefined);
			worldDiv.setAttribute("world_id", world.id);
			// Name
			CreateNewDiv(worldDiv, "world_name", world.worldName, undefined);
			// Level Count
			CreateNewDiv(worldDiv, "world_level_count", world.levelCount, undefined);
		}
	}
}

function FillLevelBox (levelArray) {
	var levelBox = document.getElementsByClassName("level_box").item(0);

	// Clear out old elements
	while (levelBox.firstChild) {
		levelBox.removeChild(levelBox.lastChild);
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
	var levelBox = document.getElementsByClassName("level_box").item(0);
	var levelDiv = CreateNewDiv(levelBox, "level", level.name, level.id);
	levelDiv.setAttribute("level_id", level.id);
}

var triggerData;
var conditionData;
var effectData;
var constructionData;
function FillRuleOptions (sessionRef) {
	triggerData = sessionRef.ExportTriggerData();
	conditionData = sessionRef.ExportConditionData();
	effectData = sessionRef.ExportEffectData();
	constructionData = sessionRef.ExportConstructionData();

	var triggerChoiceBox = document.getElementById("triggers_choice_box");
	var effectChoiceBox = document.getElementById("effects_choice_box");
	var conditionChoiceBox = document.getElementById("conditions_choice_box");
	var constructionChoiceBoxes = document.getElementsByClassName("variable_construction_box");

	// Clear the menus (Is this necessary?)
	while (triggerChoiceBox.firstChild) {
		triggerChoiceBox.removeChild(triggerChoiceBox.lastChild);
	}
	while (effectChoiceBox.firstChild) {
		effectChoiceBox.removeChild(effectChoiceBox.lastChild);
	}
	while (conditionChoiceBox.firstChild) {
		conditionChoiceBox.removeChild(conditionChoiceBox.lastChild);
	}
	for (var i = 0; i < constructionChoiceBoxes.length; i++) {
		var constChoiceBox = constructionChoiceBoxes[i];
		while (constChoiceBox.firstChild) {
			constChoiceBox.removeChild(constChoiceBox.lastChild);
		}
	}

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
	for (var constructionTypeAbbrv in constructionData) {
		var constructionTypeObj = constructionData[constructionTypeAbbrv];
		var constructionChoiceBox = document.querySelector(".choice_box.variable_construction_box[data-id='variable_construction_" + constructionTypeAbbrv + "']")
		for (var constructionItemAbbrv in constructionTypeObj) {
			var constructionItem = constructionTypeObj[constructionItemAbbrv];
			CreateConstructionOption(constructionChoiceBox, constructionItem, constructionItemAbbrv);
		}
	}
}

function CreateRuleOption (parent, type, ruleData, ruleAbbrv) {
	var ruleElement = CreateNewDiv(parent, "button", ruleData.text, undefined);
	ruleElement.setAttribute("data-action", "select_" + type);
	ruleElement.setAttribute("data-extra", ruleAbbrv);
}

function CreateConstructionOption(parent, constructionData, constructionAbbr) {
	var constructionElement = CreateNewDiv(parent, "selectable_variable", constructionData.text, undefined);
	constructionElement.setAttribute("data-variable-id", "construction_" + constructionAbbr);
	constructionElement.textContent = constructionData.text;
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
		rulesBox.removeChild(rulesBox.lastChild);
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
	var addSubRuleButton = CreateNewDiv(ruleBlock, "add_sub_rule", "Add Effect or Conditional", undefined);
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
			// requiredVariableType is just a type string ("number", "string", "entity", etc)
			var requiredVariableType = ruleData.requiredVariableTypes[i];
			// selectedVariableID is the ID of the selected variable that will be used in this slot
			// If undefined, show that a variable is needed. Otherwise, show the selected variable
			var selectedVariableID = rule.variables[i];
			var reqVarDiv;
			if (selectedVariableID === undefined || selectedVariableID === -1)
			{
				reqVarDiv = CreateNewDiv(ruleDiv, "required_variable", "Need var of type: " + requiredVariableType + ", for purpose: " + requiredVariable , undefined);
			}
			else
			{
				var selectedVariable = GetVariableByID(curEntity.variables, selectedVariableID);
				if (selectedVariable.type === "construction") {
					// Construction variable here
					// Create buttons for adding variables used in construction
					// (Work in progress: just the standard button thingy)
					reqVarDiv = CreateNewDiv(ruleDiv, "construction_variable", "Have var of type: " + "(" + requiredVariable + " - construction). It is: " + selectedVariable.name, undefined);
					var constructionType = selectedVariable.value.type;
					var constructionVars = selectedVariable.value.conVars;
					var constructionInfo = constructionData[requiredVariableType][constructionType];
					var neededConVars = constructionInfo.requiredVariables.length;
					for (var i = 0; i < neededConVars; i++) {
						var conVarName = constructionInfo.requiredVariables[i]
						var conVarType = constructionInfo.requiredVariableTypes[i];
						var conVarPicked = selectedVariable.value.conVars[i];
						if (conVarPicked !== undefined) {
							// Already picked a variable to put here
							// var existingVarDiv = CreateNewDiv(reqVarDiv, "construction_component", "CC: " + conVarName + "(" + conVarType + ")", undefined);
							// existingVarDiv.setAttribute("data-construction-var-num", i);
							// existingVarDiv.setAttribute("data-construction-component-id", conVarPicked);
							// Create a required_variable or construction_variable
							reqVarDiv = CreateNewDiv(ruleDiv, "required_variable", "Have var of type: " + conVarType + ". It is: " + conVarPicked.name, undefined);
						}
						else {
							// Empty spot for a variable
							// var emptyVarDiv = CreateNewDiv(reqVarDiv, "construction_component", "CC: <empty> (" + conVarType + ")", undefined);
							// emptyVarDiv.setAttribute("data-construction-var-num", i);
							// Create a required_variable
							reqVarDiv = CreateNewDiv(ruleDiv, "required_variable", "Need var of type: " + conVarType + ", for purpose: " + "<requiredVariable??>" , undefined);
						}
					}
					// Button to stop using this construction and pick something else
					// either an existing variable, new variable, or new construction
					var cancelConstructionDiv = CreateNewDiv(reqVarDiv, "construction_cancel", "Cancel construction", undefined);
				}
				else {
					// Regular, non-construction variable here
					reqVarDiv = CreateNewDiv(ruleDiv, "required_variable", "Have var of type: " + "(" + requiredVariable + "). It is: " + selectedVariable.name, undefined);
				}
			}
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
		variablesBox.removeChild(variablesBox.lastChild);
	}
	// Loop through variables and make divs based on the structure
	CreateEntityVariableElementsForMainList(variablesBox, curEntity.variables, "");
}

// Make variable elements for listing on main entity menu
function CreateEntityVariableElementsForMainList (container, variables) {
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];
		// Only show global variables
		// Skip local variables - only accessible from their specific events
		// Skip literal variables - only available immediately when created
		if (!variable.local && !variable.literal && !variable.construction) {
			var variableDiv = CreateNewDiv(container, "variable", undefined, undefined);
			variableDiv.setAttribute("data-variable-id", variable.id);
			var varName = CreateNewDiv(variableDiv, "variable_name", "Name: " + variable.name, undefined);
			var varType = CreateNewDiv(variableDiv, "variable_type variable_" + variable.type, "Type: " + variable.type, undefined);
			var varValue = CreateNewDiv(variableDiv, "variable_value", "Value: " + GetReadableVariableString(variable.value, variable.type), undefined);
			var varEdit = CreateNewDiv(variableDiv, "variable_edit", "Edit", undefined);
			var varRemove = CreateNewDiv(variableDiv, "variable_delete", "X", undefined);
		}
	}
}

// Get a human readable string from a variable.
// The raw value if a basic type, or the name of an complex object
function GetReadableVariableString (varValue, type) {
	switch (type) {
		case "string":
		case "number":
		case "boolean":
			return varValue;
		break;
		// Entity, Level, Area: May want to lookup names instead of just ID's
		case "entity":
			return ("Entity #" + varValue);
		break;
		case "level":
			return ("Level #" + varValue);
		break;
		case "area":
			return ("Area #" + varValue);
		break;
		case "tile":
			return "Tile in Area #N at coordinates 3,4,5";
		break;
		case "coordinates":
			return "{x: " + varValue.x + ", y: " + varValue.y + ", z: " + varValue.z + "}"; 
		break;
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
	var ruleBlock = GetRuleAtNestLocation(curEntity.rules, curNestingPoint);
	var variableType = GetVariableType(ruleBlock, curVariableSlot);
	// Global variables
	var globalsBox = document.getElementById("select_variable_global_variables_box");
	while (globalsBox.firstChild) {
		globalsBox.removeChild(globalsBox.lastChild);
	}
	var globalVars = GetEntityGlobalVariablesOfType(curEntity, variableType);
	CreateEntityVariableElementsForSelection(globalsBox, globalVars);
	// Local variables
	var localsBox = document.getElementById("select_variable_local_variables_box");
	while (localsBox.firstChild) {
		localsBox.removeChild(localsBox.lastChild);
	}
	var localVars = GetEntityLocalVariablesOfType(curEntity, variableType);
	CreateEntityVariableElementsForSelection(localsBox, localVars);

	// Fill in text on page for information
	var typeText = document.getElementById("variable_type_text");
	typeText.textContent = variableType;

	// Hide the variable construction boxes for other types of variables
	for (var i = 0; i < variableTypes.length; i++) {
		var variableTypeEntry = variableTypes[i];
		var variableConstructionBox = document.querySelector("[data-id='variable_construction_" + variableTypeEntry + "']");
		if (variableType === variableTypeEntry) {
			// Show this box
			variableConstructionBox.classList.remove("hidden_choice_box");
		}
		else {
			// Hide this box
			variableConstructionBox.classList.add("hidden_choice_box");
		}
	}
}

function GetVariableType (ruleBlock, variableSlot) {
	var variableType;
	// Don't need this for triggers?
	// if (ruleBlock.trigger !== undefined)
	if (ruleBlock.condition !== undefined) {
		variableType = conditionData[ruleBlock.condition].requiredVariableTypes[variableSlot]
	}
	else if (ruleBlock.effect !== undefined) {
		variableType = effectData[ruleBlock.effect].requiredVariableTypes[variableSlot];
	}
	if (variableType !== undefined)
	{
		return variableType;
	}
	else
	{
		console.log("Missing variable type!");
		return "string";
	}
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

function ReplaceVariableByID (variables, variableID, replaceVariableObject) {
	variableID = Number(variableID);
	for (var i = 0; i < variables.length; i++) {
		var variable = variables[i];
		if (variable.id === variableID) {
			variables[i] = replaceVariableObject;
			return;
		}
	}
}

function DeleteVariableByID (variables, variableID, rules) {
	variableID = Number(variableID);

	// Look through the rules and take out any references to this variable
	DeleteVariableInRules(rules, variableID);

	// Loop through variables and remove the variable with this ID
	for (var i = variables.length - 1; i >= 0; i--) {
		var variable = variables[i];
		if (variable.id === variableID) {
			variables.splice(i, 1);
			return;
		}
	}
}

// Note: Replace references to this variable with -1 as a placeholder, not actually deleting
function DeleteVariableInRules (rules, variableID) {
	// Loop through rules
	for (var i = rules.length - 1; i >= 0; i--) {
		var rule = rules[i];
		if (rule.variables !== undefined)
		{
			// Loop through variables on this rule and delete matches
			for (var i = rule.variables.length - 1; i >= 0; i--) {
				var variable = rule.variables[i];
				if (Number(variable) === variableID)
				{
					// Replace variable ID with -1
					rule.variables[i] = -1;
				}
			}
		}
		// Recursion into the blocks inside this rule
		if (rule.block !== undefined)
		{
			DeleteVariableInRules(rule.block, variableID);
		}
		if (rule.trueBlock !== undefined)
		{
			DeleteVariableInRules(rule.trueBlock, variableID);
		}
		if (rule.falseBlock !== undefined)
		{
			DeleteVariableInRules(rule.falseBlock, variableID);
		}
	}
}

function setupLevelVariableSelect () {
	var levelInputBox = document.getElementById("input_box_level");
	// Clear out old elements
	while (levelInputBox.firstChild) {
		levelInputBox.removeChild(levelInputBox.lastChild);
	}
	for (var i = 0; i < curSession.levels.length; i++) {
		var levelToAdd = curSession.levels[i]
		var levelButton = CreateNewDiv(levelInputBox, "level_button", levelToAdd.name, undefined);
		levelButton.setAttribute("level_id", levelToAdd.id);
	}
}
