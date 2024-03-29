// bine_session.js
// code for game session

// A session has a world, which contains a set of levels and some other data

var FALL_SPEED_START = 5;
var FALL_SPEED_MIN = 2;
var MOVE_CANCEL_TIME = 3;
var MOVE_SPEED = 10;

// var sessio = new Session("my session", {levelDatas: [], tileData: [], worldRules: []})

(function () {

var IS_SERVER = false;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	IS_SERVER = true;
}

// Turn on to debug events
var EVENT_DEBUGGING = false;

var Session = (function () {

	var sessionRef = this;

	// Events: triggers, conditions, effects, constructions
	var triggers = {

		// When a different entity steps adjacent to this one
		entity_steps_adjacent: {
			text: "Entity Steps Adjacent -> [Entity]",
			createdVariables: [
				{
					name: "adjacent_entity",
					type: "entity",
				},
			],
		},
		// When a different entity steps directly on top of this one
		entity_steps_here: {
			text: "Entity Steps Here -> [Entity]",
			createdVariables: [
				{
					name: "here_entity",
					type: "entity",
				},
			],
		},
		entity_created_adjacent: {
			text: "Entity created adjacent -> [Entity]",
			createdVariables: [
				{
					name: "adjacent_created_entity",
					type: "entity",
				},
			],
		},
		entity_created_here: {
			text: "Entity created here -> [Entity]",
			createdVariables: [
				{
					name: "here_created_entity",
					type: "entity",
				},
			],
		},
		entity_removed_adjacent: {
			text: "Entity removed adjacent -> [Entity]",
			createdVariables: [
				{
					name: "adjacent_removed_entity",
					type: "entity",
				},
			],
		},
		entity_removed_here: {
			text: "Entity removed here -> [Entity]",
			createdVariables: [
				{
					name: "here_removed_entity",
					type: "entity",
				},
			],
		},
		// When the player clicks in the play area
		player_click: {
			text: "Player clicks to do action. (Only for player entity) -> [String, String]",
			createdVariables: [
				{
					name: "mouse_button",
					type: "string",
				},
				{
					name: "mouse_direction",
					type: "string",
				},
			],
		},
		// Trigger for receiving a boolean signal
		receive_signal_boolean: {
			text: "Receive a true/false signal -> [Boolean]",
			createdVariables: [
				{
					name: "signal_value",
					type: "boolean",
				}
			],
		},
	};
	var conditions = {
		boolean_condition: {
			text: "Boolean Conditional (if/else)",
			requiredVariables: ["condition"],
			requiredVariableTypes: ["boolean"],
			// conditionFunction: function (variables, sessionRef, levelRef, entityRef, useVariables) {
			conditionFunction: function (variables, sessionRef, levelRef, entityRef, useVariables) {
				console.log("boolean_condition condition happened");
				return true;
			},
		},
	};
	var setVariableFunc = function (sessionRef, levelRef, entityRef, useVariables, variableIDs) {
		console.log("setVariableFunc (generic function) effect happened");
		// *** Set Variable Here
		// Set the value of variable 0 to the value from variable 1
		// get variable 1's value
		var valueToUse = useVariables[1];
		// get the variable 0 object
		var variableToSet = GetVariableByID(entityRef.variables, variableIDs[0]);
		// set the variable to the value
		variableToSet.value = valueToUse;
	}
	var effects = {
		say_message: {
			text: "Say Message",
			requiredVariables: ["text"],
			requiredVariableTypes: ["string"],
			effectFunction: function (sessionRef, levelRef, entityRef, useVariables) {
				console.log("say_message effect happened");
				var textVariable = useVariables[0]
				if (textVariable !== undefined)
				{
					entityRef.tempMessageTime = 300;
					entityRef.tempMessageString = textVariable;
				}
				else
				{
					entityRef.tempMessageTime = 300;
					entityRef.tempMessageString = "(missing text)";
				}
			},
		},
		warp_entity_to_level: {
			text: "Warp Entity to a Level",
			requiredVariables: ["entityToWarp", "levelToWarpTo", "coordinatesToWarpTo"],
			requiredVariableTypes: ["entity", "level", "coordinates"],
			// effectFunction: function (localVariables, sessionRef, levelRef, entityRef, useVariables) {
			effectFunction: function (sessionRef, levelRef, entityRef, useVariables) {
				console.log("warp_entity_to_level effect happened");
				var entityToWarp = useVariables[0];
				var levelToWarpTo = useVariables[1];
				var coordinatesToWarpTo = useVariables[2];
				// Check if the current level for the game is the level the entity is coming from
				if (!IS_SERVER)
				{
					if (curLevel === levelRef) {
						// Check if the entity to warp is the player
						if (entityToWarp === curPlayer) {
							curLevel = levelToWarpTo;
						}
					}
				}
				entityToWarp.x = Number(coordinatesToWarpTo.x);
				entityToWarp.y = Number(coordinatesToWarpTo.y);
				entityToWarp.z = Number(coordinatesToWarpTo.z);
				levelToWarpTo.AddExistingEntity(entityToWarp);
				levelRef.RemoveEntity(entityToWarp, sessionRef, levelRef);
				entityToWarp.toBeRemoved = false;
			},
		},
		create_entity: {
			text: "Create an entity",
			requiredVariables: ["template", "location"],
			requiredVariableTypes: ["string", "coordinates"],
			effectFunction: function (sessionRef, levelRef, entityRef, useVariables) {
				console.log("create_entity effect happened");
			},
		},
		destroy_entity: {
			text: "Destroy an entity",
			requiredVariables: ["entity_to_destroy"],
			requiredVariableTypes: ["entity"],
			effectFunction: function (sessionRef, levelRef, entityRef, useVariables) {
				console.log("destroy_entity effect happened");
			},
		},
		blockomancy_action: {
			text: "Block Gun: Shoot or collect a block",
			requiredVariables: ["mouse_button", "direction", "block_count"],
			requiredVariableTypes: ["string", "string", "number"],
			// variableSetter: true, because it changes the block count
			variableSetter: true,
			effectFunction: function (sessionRef, levelRef, entityRef, useVariables, variableIDs) {
				// console.log("blockomancy_action effect happened");
				// entityRef is curPlayer
				// useVariables: first two elements are each an array of 2 arrays,
				// each with the first element as mouse button
				//  (0 is left button, 2 is right button)
				// and second element as direction
				// Third element: Block count, need to reduce when shooting and increase when collecting

				// Figure out block count stuff
				var prevBlockCount = Number(useVariables[2]);
				var haveEnoughBlocksToShoot = prevBlockCount >= 1;
				var newBlockCount = prevBlockCount;
				// get the variable 2 object (block count)
				var blockCountVariableToSet = GetVariableByID(entityRef.variables, variableIDs[2]);

				var mouseButton = useVariables[0][0];
				var direction = useVariables[0][1];
				var dirX = (direction === "left" ? -1 : (direction === "right" ? 1 : 0));
				var dirY = (direction === "up" ? -1 : (direction === "down" ? 1 : 0));
				// Check that one of the direction vars isn't zero
				if (dirX === 0 && dirY === 0) {
					return;
				}
				var shootMode = false;
				var collectMode = false;
				if (mouseButton === 0) {
					// Shoot block
					// console.log("Shoot block to " + direction);
					shootMode = true;
				}
				else if (mouseButton === 2) {
					// Collect block
					// console.log("Collect block from " + direction);
					collectMode = true;
				}
				if (shootMode && !haveEnoughBlocksToShoot) {
					// Cannot shoot because not enough blocks
					document.querySelector(".variable_tracker").style.backgroundColor = "#992020"
					setTimeout(function() {
						document.querySelector(".variable_tracker").style.backgroundColor = ""
					}, 300);
					return;
				}
				// Arbitrary limit
				var limit = 30;
				// Starting point: entity's location
				var curX = entityRef.x;
				var curY = entityRef.y;
				var curZ = entityRef.z;
				// Make sure to at least pass first tile, for shoot mode
				var passedFirstTile = false;
				for (var i = 0; i < limit; i++) {
					curX += dirX;
					curY += dirY;
					if (shootMode) {
						if (levelRef.CheckLocationSolid(curX, curY, curZ)) {
							if (!passedFirstTile) {
								// Too close to player! Can't make block
								// console.log("Can't make block! Too close");
								return;
							}
							// Actually: okay to place block on existing entity
							// If there is a reason to bring this back,
							// it would need to actually loop through all entities at
							// this location, not just the first (using GetEntitiesAtLocation)
							// var existingEntity = levelRef.GetEntityAtLocation(curX - dirX, curY - dirY, curZ);
							// if (existingEntity !== undefined) {
							// 	// There's already an entity here
							// 	// console.log("Space occupied! Can't make block");
							// 	return;
							// }
							// console.log("Make a block entity at " + (curX - dirX) + ", " + (curY - dirY) + ", " + curZ);
							levelRef.entityCounter ++;
							var newX = curX - dirX;
							var newY = curY - dirY;
							var blockEntityData = {
								id: levelRef.entityCounter ++,
								x: newX,
								y: newY,
								z: curZ,
								settings: {
									visible: true,
									solid: true,
									standable: true,
									pushable: false,
									gravity: false,
								},
								style: "#2daa2d",
								variables: [],
								rules: [],
								templates: ["block"],
								variableCounter: 0,
							};
							levelRef.AddEntity(blockEntityData, sessionRef, levelRef);
							// Subtract 1 block
							newBlockCount = prevBlockCount - 1;
							blockCountVariableToSet.value = newBlockCount;
							// Update block count value visible on web page
							if (!IS_SERVER) {
								document.querySelector(".variable_tracker").textContent = "Blocks: " + newBlockCount;
							}
							// Making a neat particle effect
							if (!IS_SERVER) {
								var startX = entityRef.x;
								var startY = entityRef.y;
								var xSize = Math.abs(newX - startX);
								var ySize = Math.abs(newY - startY);
								if (newX > startX) {
									startX += 1;
									xSize -= 1;
									ySize = 1;
								}
								if (newX < startX) {
									startX -= xSize - 1;
									xSize -= 1;
									ySize = 1;
								}
								if (newY > startY) {
									startY += 1;
									ySize -= 1;
									xSize = 1;
								}
								if (newY < startY) {
									startY -= ySize - 1;
									ySize -= 1;
									xSize = 1;
								}
								//xSize = Math.max(xSize, 1);
								//ySize = Math.max(ySize, 1);
								MakeParticle("block_shot", startX, startY, entityRef.z, xSize, ySize, 1, 10);
							}
							return;
						}
						passedFirstTile = true;
					}
					else if (collectMode) {
						var entitiesAtLocation = levelRef.GetEntitiesAtLocation(curX, curY, curZ);
						for (var ei = 0; ei < entitiesAtLocation.length; ei++) {
							var entityAtLocation = entitiesAtLocation[ei]
							if (Array.isArray(entityAtLocation.templates) && entityAtLocation.templates.includes("block")) {
								// console.log("Remove entity at " + curX + ", " + curY + ", " + curZ)
								levelRef.RemoveEntity(entityAtLocation, sessionRef, levelRef);
								// Add 1 block
								newBlockCount = prevBlockCount + 1;
								blockCountVariableToSet.value = newBlockCount;
								// Update block count value visible on web page
								if (!IS_SERVER) {
									document.querySelector(".variable_tracker").textContent = "Blocks: " + newBlockCount;
								}
								// Make a neat particle effect
								if (!IS_SERVER) {
									var startX = entityRef.x;
									var startY = entityRef.y;
									var xSize = Math.abs(curX - startX);
									var ySize = Math.abs(curY - startY);
									if (curX > startX) {
										startX += 1;
										xSize -= 1;
										ySize = 1;
									}
									if (curX < startX) {
										startX -= xSize - 1;
										xSize -= 1;
										ySize = 1;
									}
									if (curY > startY) {
										startY += 1;
										ySize -= 1;
										xSize = 1;
									}
									if (curY < startY) {
										startY -= ySize - 1;
										ySize -= 1;
										xSize = 1;
									}
									//xSize = Math.max(xSize, 1);
									//ySize = Math.max(ySize, 1);
									// Beam
									MakeParticle("block_collect", startX, startY, entityRef.z, xSize, ySize, 1, 10);
									// Dissapearing block
									MakeParticle("block_disappear", curX, curY, curZ, 1, 1, 1, 10);
								}
								return;
							}
						}
						// Check if the tile is otherwise solid - hit a wall for example
						if (levelRef.CheckLocationSolid(curX, curY, curZ)) {
							return;
						}
					}
				}
			},
		},
		laser_action: {
			text: "Laser: Detect solid entities in this space and send bool signal to connected door",
			requiredVariables: ["entity_door_to_signal"],
			requiredVariableTypes: ["entity"],
			effectFunction: function (sessionRef, levelRef, entityRef, useVariables) {
				// Determine bounds
				var xStart = entityRef.x;
				var yStart = entityRef.y;
				var zStart = entityRef.z;
				var xEnd = entityRef.x + entityRef.xSize - 1;
				var yEnd = entityRef.y + entityRef.ySize - 1;
				var zEnd = entityRef.z + entityRef.zSize - 1;
				// Loop through entities, counting the ones that:
				// - are solid
				// - within the bounds
				// - not this entity
				var solidOverlapEntityCount = 0;
				for (var i = 0; i < levelRef.entities.length; i++) {
					var checkEntity = levelRef.entities[i]
					// Must be solid
					if (checkEntity.settings.solid === true) {
						// Must be inside the bounds of this laser
						if (checkEntity.x >= xStart && checkEntity.y >= yStart && checkEntity.z >= zStart && checkEntity.x <= xEnd && checkEntity.y <= yEnd && checkEntity.z <= zEnd) {
							// Must not be the same entity as this laser
							if (checkEntity !== entityRef) {
								// Must not be marked for deletion
								// (for example, block getting removed right now)
								if (!checkEntity.toBeRemoved) {
									solidOverlapEntityCount += 1;
								}
							}
						}
					}
				}
				// Signal value is either true or false
				var signalValue = (solidOverlapEntityCount === 0);
				// Send signal to connected entity
				// useVariables[0]
				// debugger;
				var otherEntity = useVariables[0];
				otherEntity.FireTrigger("receive_signal_boolean", signalValue, curSession, curLevel);
			},
		},
		door_action: {
			text: "Door: Use signal to either open or close this door, setting solid state on/off",
			requiredVariables: ["signal_bool_state"],
			requiredVariableTypes: ["boolean"],
			effectFunction: function (sessionRef, levelRef, entityRef, useVariables) {
				//
				// debugger;
				var signalState = useVariables[0];
				entityRef.settings.solid = signalState;
				entityRef.settings.visible = signalState;
			},
		},
		// Variable setters
		set_variable_string: {
			text: "Set a variable (string)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["string", "string"],
			variableSetter: true,
			effectFunction: setVariableFunc,
		},
		set_variable_number: {
			text: "Set a variable (number)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["number", "number"],
			variableSetter: true,
			effectFunction: setVariableFunc,
		},
		set_variable_boolean: {
			text: "Set a variable (boolean)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["boolean", "boolean"],
			variableSetter: true,
			effectFunction: setVariableFunc,
		},
		set_variable_entity: {
			text: "Set a variable (entity)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["entity", "entity"],
			variableSetter: true,
			effectFunction: setVariableFunc,
		},
		set_variable_area: {
			text: "Set a variable (area)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["area", "area"],
			variableSetter: true,
			effectFunction: setVariableFunc,
		},
		set_variable_level: {
			text: "Set a variable (level)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["level", "level"],
			variableSetter: true,
			effectFunction: setVariableFunc,
		},
		set_variable_tile: {
			text: "Set a variable (tile)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["tile", "tile"],
			variableSetter: true,
			effectFunction: setVariableFunc
		},
		set_variable_coordinates: {
			text: "Set a variable (coordinates)",
			requiredVariables: ["variableToSet", "valueToUse"],
			requiredVariableTypes: ["coordinates", "coordinates"],
			variableSetter: true,
			effectFunction: setVariableFunc,
		},
	};
	var constructions = {
		string: {
			concatenate_two_strings: {
				text: "Concatenate two strings",
				requiredVariables: ["string1", "string2"],
				requiredVariableTypes: ["string", "string"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					var stringConcat = useVariables[0] + useVariables[1];
					return stringConcat;
				},
			},
			convert_number_to_string: {
				text: "Convert number to string",
				requiredVariables: ["number1"],
				requiredVariableTypes: ["number"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					var stringFromNum = String(useVariables[0]);
					return stringFromNum;
				},
			},
		},
		number: {
			add_two_numbers: {
				text: "Add two numbers",
				requiredVariables: ["addend1", "addend2"],
				requiredVariableTypes: ["number", "number"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return useVariables[0] + useVariables[1];
				},
			},
			subtract_two_numbers: {
				text: "Subtract a number from another number",
				requiredVariables: ["minuend", "subtrahend"],
				requiredVariableTypes: ["number", "number"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return useVariables[0] - useVariables[1];
				},
			},
			multiply_two_numbers: {
				text: "Multiply two numbers together",
				requiredVariables: ["multiplicand", "multiplier"],
				requiredVariableTypes: ["number", "number"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return useVariables[0] * useVariables[1];
				},
			},
			divide_two_numbers: {
				text: "Divide a number by another number",
				requiredVariables: ["dividend", "divisor"],
				requiredVariableTypes: ["number"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					if (useVariables[1] === 0) {
						// What to do about divide by zero problem?
						return Infinity;
					}
					return useVariables[0] / useVariables[1];
				},
			},
			length_of_string: {
				text: "Get the number of characters in a string",
				requiredVariables: ["string"],
				requiredVariableTypes: ["string"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return useVariables[0].length;
				},
			},
			number_read_from_string: {
				text: "Try to read a number from a string",
				requiredVariables: ["string"],
				requiredVariableTypes: ["string"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					var onlyDigits = useVariables[0].replace(/[^0-9]/g, "");
					return parseFloat(onlyDigits);
				},
			},
		},
		boolean: {
			equal_two_strings: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			not_equal_two_strings: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			equal_two_numbers: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			not_equal_two_numbers: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			greater_than: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			greater_than_or_equal: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			less_than: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			less_than_or_equal: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			boolean_and: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			boolean_or: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			boolean_xor: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
			boolean_not: {
				text: "",
				requiredVariables: [""],
				requiredVariableTypes: [""],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return 3;
				},
			},
		},
		entity: {
			first_entity_of_type_in_direction: {
				text: "Get first entity of a certain type in a direction.",
				requiredVariables: ["starting_point", "direction", "entity_type", "limit"],
				requiredVariableTypes: ["coordinates", "string", "string", "number"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return undefined;
				},
			},
		},
		area: {},
		level: {},
		tile: {},
		coordinates: {
			last_empty_before_solid: {
				text: "Get coordinates of last empty tile before a solid tile.",
				requiredVariables: ["starting_point", "direction", "limit"],
				requiredVariableTypes: ["coordinates", "string", "number"],
				constructionFunction: function (sessionRef, levelRef, entityRef, useVariables) {
					return [3, 3, 3];
				},
			},
		},
	};

	// Todo: Rename this function?
	// This does the prep-work of determining the variables to use
	// in the effect functions, so that the effect functions can just use
	// final versions of the variables instead of figuring them out
	function effectFunctionVariableSetupFunction (effectFunction, localVariables, sessionRef, levelRef, entityRef, useVariables, isVariableSetter) {
		// This is the old version
		// effectFunction(localVariables, sessionRef, levelRef, entityRef, useVariables);

		// New approach: Figure out variables first
		var finalVariableData = [];
		for (var i = 0; i < useVariables.length; i++) {
			// Get the variable info
			var variableInfo = GetVariableByID(entityRef.variables, useVariables[i]);
			var variableData = undefined;
			// If local variable, get from local variables
			// (So far, just a single local variable is possible.)
			// (Will later need to figure out further info)
			if (variableInfo.local === true)
			{
				variableData = localVariables;
			}
			else
			{
				// Get the actual data for that variable.
				// (Different process for different types)
				switch (variableInfo.type) {
					case "string":
						variableData = variableInfo.value;
					break;
					case "number":
						variableData = variableInfo.value;
					break;
					case "boolean":
						variableData = variableInfo.value;
					break;
					case "entity":
						variableData = levelRef.GetEntityByID(variableInfo.value);
					break;
					case "area":
						variableData = variableInfo.value;
					break;
					case "level":
						variableData = sessionRef.GetLevelByID(variableInfo.value)
					break;
					case "tile":
						variableData = variableInfo.value;
					break;
					case "coordinates":
						variableData = variableInfo.value;
					break;
				}
			}
			finalVariableData[i] = variableData;
		}

		if (isVariableSetter) {
			// Need to pass variable ID's so variable's value can be changed
			effectFunction(sessionRef, levelRef, entityRef, finalVariableData, useVariables);
		}
		else {
			// Normal, just pass values
			// run the effectFunction with the now-already-setup variable data
			effectFunction(sessionRef, levelRef, entityRef, finalVariableData);
		}
	}

	// var entityIDCounter = 0;
	//x, y, z, style, settings, rules, templates
	function Entity (entityData) {
		this.type = "Entity";

		this.id = entityData.id
		this.x = entityData.x;
		this.y = entityData.y;
		this.z = entityData.z;
		this.xSize = entityData.xSize ?? 1;
		this.ySize = entityData.ySize ?? 1;
		this.zSize = entityData.zSize ?? 1;
		this.style = entityData.style ?? "#208020";
		this.settings = entityData.settings ?? {
			visible: true,
			solid: false,
			standable: false,
			pushable: false,
			gravity: true,
		};
		this.variables = entityData.variables;
		this.rules = entityData.rules;
		this.templates = entityData.templates;
		this.variableCounter = entityData.variableCounter;

		this.xMov = 0;
		this.yMov = 0;
		this.zMov = 0;
		this.moveTime = 0;
		this.moveDuration = entityData.moveDuration ?? MOVE_SPEED;

		this.falling = false;
		this.fallSpeed = entityData.fallSpeed ?? FALL_SPEED_START;

		this.moveDirections = {up: false, down: false, left: false, right: false, changed: false};

		this.xCorrection = 0;
		this.yCorrection = 0;
		this.zCorrection = 0;
		this.needCorrection = false;
		this.xMovCorrection = 0;
		this.yMovCorrection = 0;
		this.zMovCorrection = 0;
		this.moveTimeCorrection = 0;
		this.moveDurationCorrection = MOVE_SPEED;

		this.tempMessageString = "";
		this.tempMessageTime = 0;
	}
	Entity.prototype.Export = function () {
		var entityData = {
			id: this.id,
			x: this.x,
			y: this.y,
			z: this.z,
			xSize: this.xSize,
			ySize: this.ySize,
			zSize: this.zSize,
			style: this.style,
			settings: this.settings,
			variables: this.variables,
			variableCounter: this.variableCounter,
			rules: this.rules,
			templates: this.templates,
		};
		return entityData;
	};
	Entity.prototype.Update = function (sessionRef, levelRef) {
		// Update an entity:
		// - Input (if player-controlled)
		// - Rules
		// - Movement

		if (this.tempMessageTime > 0) {
			this.tempMessageTime -= 1;
		}
		else {
			this.tempMessageString = "";
		}

		// Position Correction (Needs to be smoother)
		if (this.needCorrection) {
			this.needCorrection = false;
			this.x = this.xCorrection;
			this.y = this.yCorrection;
			this.z = this.zCorrection;
			this.xMov = this.xMovCorrection;
			this.yMov = this.yMovCorrection;
			this.zMov = this.zMovCorrection;
			this.moveTime = this.moveTimeCorrection;
			this.moveDuration = this.moveDurationCorrection;
		}

		// one tick of movement
		if (this.xMov !== 0 || this.yMov !== 0 || this.zMov !== 0) {
			this.moveTime ++;
			if (this.moveTime >= this.moveDuration) {
				// end movement if done
				this.moveTime = 0;
				this.x += this.xMov;
				this.y += this.yMov;
				this.z += this.zMov;
				this.xMov = 0;
				this.yMov = 0;
				this.zMov = 0;
				this.TriggerStepEndsForNearby(sessionRef, levelRef);
			}
		}
		// Not moving - able to start a movement
		// OR started moving ~3 or fewer frames ago, able to cancel into other movements
		if ((this.xMov === 0 && this.yMov === 0 && this.zMov === 0) || (this.moveTime < MOVE_CANCEL_TIME && this.moveDirections.changed)) {
			var floorSolid = levelRef.CheckRelativeLocationSolid(this, 0, 0, -1);
			// Solid ground below player (Floor): Can move if solid
			if (floorSolid || this.settings.gravity === false) {
				this.moveDirections.changed = false;
				this.falling = false;
				this.fallSpeed = FALL_SPEED_START;
				// Input for movement
				if (this.moveDirections.up || this.moveDirections.down || this.moveDirections.left || this.moveDirections.right) {
					// Set movement based on input
					this.xMov = (this.moveDirections.left ? -1 : 0) + (this.moveDirections.right ? 1 : 0);
					this.yMov = (this.moveDirections.up ? -1 : 0) + (this.moveDirections.down ? 1 : 0);
					this.zMov = 0;
					this.moveDuration = MOVE_SPEED;

					var ceilSolid = levelRef.CheckRelativeLocationSolid(this, 0, 0, 1);
					// Adjust movement for walls/other obstacles
					// If player is moving diagonally, check if the x or y aspect is blocked
					if (this.xMov !== 0 && this.yMov !== 0) {
						// DIAGRAM (SIDE VIEW):
						// ceil  above
						// |   /
						// E --- space
						// |   \
						// floor below

						// Space next to entity
						var xSpaceSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, 0, 0);
						var ySpaceSolid = levelRef.CheckRelativeLocationSolid(this, 0, this.yMov, 0);
						// Space above that space (Diagonally above the entity)
						var xAboveSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, 0, 1);
						var yAboveSolid = levelRef.CheckRelativeLocationSolid(this, 0, this.yMov, 1);
						// Space directly above the entity

						// Check if X direction is blocked
						if (xSpaceSolid && (xAboveSolid || ceilSolid)) {
							this.xMov = 0;
						}
						// Check if Y direction is blocked
						if (ySpaceSolid && (yAboveSolid || ceilSolid)) {
							this.yMov = 0;
						}
					}

					// Check if any movement is still happening
					// If so, do final movement adjustments (Up/down stairs, corner walls)
					if (this.xMov !== 0 || this.yMov !== 0) {
						var spaceSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, this.yMov, 0);
						var aboveSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, this.yMov, 1);
						// Space below that space (Diagonally below the entity)
						var belowSolid = levelRef.CheckRelativeLocationSolid(this, this.xMov, this.yMov, -1);
						if (spaceSolid) {
							if (aboveSolid || ceilSolid) {
								// Blocked off
								this.xMov = 0;
								this.yMov = 0;
								this.zMov = 0;
								this.moveTime = 0;
							}
							else {
								// Upwards movement (stairs)
								this.zMov = 1;
							}
						}
						else if (!belowSolid) {
							// Downwards movement (stairs down or pit)
							this.zMov = -1;
						}
					}
					// Stop movement
					else {
						this.xMov = 0;
						this.yMov = 0;
						this.zMov = 0;
						this.moveTime = 0;
					}
				}
				// Stop movement
				else {
					this.xMov = 0;
					this.yMov = 0;
					this.zMov = 0;
					this.moveTime = 0;
				}
			}
			// Player falls down
			else {
				this.moveDuration = this.fallSpeed;
				this.zMov = -1;
				if (this.falling && this.fallSpeed > FALL_SPEED_MIN) {
					this.fallSpeed --;
				}
				this.falling = true;
				if (this.z < -20 && this === curPlayer && curSession.playerTemplate !== undefined) {
					this.x = curSession.playerTemplate.x;
					this.y = curSession.playerTemplate.y;
					this.z = curSession.playerTemplate.z;
					this.falling = false;
				}
			}
		}
	}
	Entity.prototype.GetX = function () {
		return this.x + (this.xMov * this.moveTime / this.moveDuration);
	};
	Entity.prototype.GetY = function () {
		return this.y + (this.yMov * this.moveTime / this.moveDuration);
	};
	Entity.prototype.GetZ = function () {
		return this.z + (this.zMov * this.moveTime / this.moveDuration);
	};
	Entity.prototype.SetMoveDirections = function (up, down, left, right) {
		this.moveDirections.up = up;
		this.moveDirections.down = down;
		this.moveDirections.left = left;
		this.moveDirections.right = right;
		this.moveDirections.changed = true;
	}
	Entity.prototype.SetLocationCorrection = function (x, y, z, xMov, yMov, zMov, moveTime, moveDuration) {
		this.xCorrection = x;
		this.yCorrection = y;
		this.zCorrection = z;
		this.xMovCorrection = xMov;
		this.yMovCorrection = yMov;
		this.zMovCorrection = zMov;
		this.moveTimeCorrection = moveTime;
		this.moveDurationCorrection = moveDuration;
		this.needCorrection = true;
	};
	// Add a trigger and any needed variables
	Entity.prototype.AddTrigger = function (triggerType) {
		// Create the trigger object Add it to the rule array
		var rulesObj = {
			trigger: triggerType,
			block: [],
			connectedVariables: [],
		};
		this.rules.push(rulesObj);
		// Check if any variables need to be created
		var triggerData = triggers[triggerType];
		if (triggerData.createdVariables.length > 0) {
			for (var i = 0; i < triggerData.createdVariables.length; i++) {
				var varToCreate = triggerData.createdVariables[i]
				var variableObj = {
					name: varToCreate.name,
					value: undefined,
					type: varToCreate.type,
					local: true,
				};
				this.variableCounter += 1;
				variableObj.id = this.variableCounter;
				this.variables.push(variableObj);
				rulesObj.connectedVariables.push(variableObj.id);
			}
		}
	};
	// Event handling
	// Is this funcion needed? May only need version that immediately runs rules if they're present
	Entity.prototype.CheckHaveTrigger = function (triggerType) {
		// Could be improved to not have to loop through all rules every time
		for (var i = 0; i < this.rules.length; i++) {
			var rule = this.rules[i];
			if (rule.trigger !== undefined && rule.trigger === triggerType) {
				return true;
			}
		}
		return false;
	}
	// If the entity has the specified trigger type, run that rule
	// triggerVariables - anything else that needs to be passed to rule
	Entity.prototype.FireTrigger = function (triggerType, triggerVariables, sessionRef, levelRef) {
		for (var i = 0; i < this.rules.length; i++) {
			var rule = this.rules[i];
			if (rule.trigger !== undefined && rule.trigger === triggerType) {
				this.ExecuteRule(rule, triggerVariables, sessionRef, levelRef);
				// Only executes first instance of rule... is this correct?
				return;
			}
		}
		return;
	};
	// Step adjacent trigger
	Entity.prototype.TriggerStepEndsForNearby = function (sessionRef, levelRef) {
		for (var i = 0; i < levelRef.entities.length; i++) {
			var otherEntity = levelRef.entities[i];
			// Requires bine_misc
			// if (IsNear(this.x, this.y, this.z, otherEntity.x, otherEntity.y, otherEntity.z, 1)) {
			if (IsNearWithSizes(this.x, this.y, this.z, this.xSize, this.ySize, this.zSize, otherEntity.x, otherEntity.y, otherEntity.z, otherEntity.xSize, otherEntity.ySize, otherEntity.zSize, 1)) {
				// No need to check if rule exists before running it?
				// if (otherEntity.CheckHaveTrigger("entity_steps_adjacent"))
				// {
				// }
				otherEntity.FireTrigger("entity_steps_adjacent", this, sessionRef, levelRef);
			}
			// Requires bine_misc
			// if (IsSameCoord(this.x, this.y, this.z, otherEntity.x, otherEntity.y, otherEntity.z)) {
			if (CoordsOverlapWithSizes(this.x, this.y, this.z, this.xSize, this.ySize, this.zSize, otherEntity.x, otherEntity.y, otherEntity.z, otherEntity.xSize, otherEntity.ySize, otherEntity.zSize)) {
				// No need to check for rule exists
				otherEntity.FireTrigger("entity_steps_here", this, sessionRef, levelRef);
			}
		}
		// if (!IS_SERVER) {
		// 	// Play footstep sound when stepping on solid tiles
		// 	if (levelRef.CheckRelativeLocationSolid(this, 0, 0, -1)) {
		// 		// PlayRandomFootstep();
		// 		// DirectionalSound("footstep", this.x, this.y, this.z, levelRef);
		// 		// soundType, sourceX, sourceY, sourceZ, levelRef
		// 	}
		// }
	};
	Entity.prototype.TriggerCreationsForNearby = function (sessionRef, levelRef) {
		for (var i = 0; i < levelRef.entities.length; i++) {
			var otherEntity = levelRef.entities[i];
			// Requires bine_misc
			if (IsNearWithSizes(this.x, this.y, this.z, this.xSize, this.ySize, this.zSize, otherEntity.x, otherEntity.y, otherEntity.z, otherEntity.xSize, otherEntity.ySize, otherEntity.zSize, 1)) {
				// No need to check if rule exists
				otherEntity.FireTrigger("entity_created_adjacent", this, sessionRef, levelRef);
			}
			// Requires bine_misc
			if (CoordsOverlapWithSizes(this.x, this.y, this.z, this.xSize, this.ySize, this.zSize, otherEntity.x, otherEntity.y, otherEntity.z, otherEntity.xSize, otherEntity.ySize, otherEntity.zSize)) {
				// No need to check for rule exists
				otherEntity.FireTrigger("entity_created_here", this, sessionRef, levelRef);
			}
		}
	};
	Entity.prototype.TriggerRemovalsForNearby = function (sessionRef, levelRef) {
		for (var i = 0; i < levelRef.entities.length; i++) {
			var otherEntity = levelRef.entities[i];
			// Requires bine_misc
			if (IsNearWithSizes(this.x, this.y, this.z, this.xSize, this.ySize, this.zSize, otherEntity.x, otherEntity.y, otherEntity.z, otherEntity.xSize, otherEntity.ySize, otherEntity.zSize, 1)) {
				// No need to check if rule exists
				otherEntity.FireTrigger("entity_removed_adjacent", this, sessionRef, levelRef);
			}
			// Requires bine_misc
			if (CoordsOverlapWithSizes(this.x, this.y, this.z, this.xSize, this.ySize, this.zSize, otherEntity.x, otherEntity.y, otherEntity.z, otherEntity.xSize, otherEntity.ySize, otherEntity.zSize)) {
				// No need to check for rule exists
				otherEntity.FireTrigger("entity_removed_here", this, sessionRef, levelRef);
			}
		}
	};
	// Execute an entity's rule
	// rule: The rule block, with a trigger/condition/effect, block, and connectedVariables
	// localVariables: variables from the trigger rule that started this execution sequence
	// sessionRef: reference to the current session
	// levelRef: reference to the level
	Entity.prototype.ExecuteRule = function (rule, localVariables, sessionRef, levelRef) {
		var entityRef = this;
		if (rule.trigger) {
			// Trigger - Go ahead and run the rule block.
			var trigger = triggers[rule.trigger];
			if (EVENT_DEBUGGING) {
				console.log(trigger.text);
			}
			this.ExecuteBlock(rule.block, localVariables, sessionRef, levelRef);
		}
		else if (rule.condition) {
			// Condition - Check the condition, then run the true or false block
			var condition = conditions[rule.condition];
			if (EVENT_DEBUGGING) {
				console.log(condition.text);
			}
			var result = condition.conditionFunction(localVariables, sessionRef, levelRef, entityRef, rule.variables);
			if (result === true) {
				this.ExecuteBlock(rule.trueBlock, localVariables, sessionRef, levelRef);
			}
			// False by default?
			else {
				this.ExecuteBlock(rule.falseBlock, localVariables, sessionRef, levelRef);
			}
		}
		else if (rule.effect) {
			// Effect - Do something. (End result)
			var effect = effects[rule.effect];
			if (EVENT_DEBUGGING) {
				console.log(effect.text);
			}
			var result;
			if (effect.variableSetter === true) {
				// Same as below but with "true" at end
				effectFunctionVariableSetupFunction(effect.effectFunction, localVariables, sessionRef, levelRef, entityRef, rule.variables, true);
			}
			else {
				effectFunctionVariableSetupFunction(effect.effectFunction, localVariables, sessionRef, levelRef, entityRef, rule.variables);
			}
			// Is there a result from an effect????
			// Should just be "side effects"?
			// var result = 
			// var result = effect.effectFunction(localVariables, sessionRef, levelRef, entityRef, rule.variables);
		}
	};
	Entity.prototype.ExecuteBlock = function (ruleBlock, variables, sessionRef, levelRef) {
		// Loop through the block and execute each rule in it
		for (var i = 0; i < ruleBlock.length; i++) {
			var rule = ruleBlock[i];
			this.ExecuteRule(rule, variables, sessionRef, levelRef);
		}
	};

	// var areaIDCounter = 0;
	//x, y, z, xSize, ySize, zSize, settings, map, extra, style, rules, templates
	function Area (areaData) {
		this.type = "Area";

		this.id = areaData.id;

		this.x = areaData.x;
		this.y = areaData.y;
		this.z = areaData.z;
		
		this.xSize = areaData.xSize;
		this.ySize = areaData.ySize;
		this.zSize = areaData.zSize;

		this.settings = areaData.settings;
		this.map = areaData.map;
		this.extra = areaData.extra;
		this.style = areaData.style;
		this.rules = areaData.rules;
		this.templates = areaData.templates;

		// Fill in with empty if map isn't exported
		if (areaData.map === undefined || areaData.map.length === 0) {
			this.map = [];
			for (var i = 0; i < this.xSize; i++) {
				var xLayer = [];
				for (var j = 0; j < this.ySize; j++) {
					var yLayer = [];
					for (var k = 0; k < this.zSize; k++) {
						// Fill with 0 for empty
						var zLayer = 0;
						yLayer.push(zLayer);
					}
					xLayer.push(yLayer)
				}
				this.map.push(xLayer);
			}
		}

		this.xMov = 0;
		this.yMov = 0;
		this.zMov = 0;
		this.moveTime = 0;
		this.moveDuration = MOVE_SPEED;
	}
	Area.prototype.Export = function () {
		var areaData = {
			id: this.id,
			x: this.x,
			y: this.y,
			z: this.z,
			xSize: this.xSize,
			ySize: this.ySize,
			zSize: this.zSize,
			settings: this.settings,
			map: this.map,
			extra: this.extra,
			style: this.style,
			rules: this.rules,
			templates: this.templates,
		};
		return areaData;
	};
	Area.prototype.Update = function (sessionRef, levelRef) {
		// Update an area:
		// - Rules
		// - Movement
		// - Simulations

		// Rules

		// Movement

		if (this.xMov !== 0 || this.yMov !== 0 || this.zMov !== 0) {
			this.moveTime ++;
			if (this.moveTime >= this.moveDuration) {
				this.moveTime = 0;
				this.x += this.xMov;
				this.y += this.yMov;
				this.z += this.zMov;
				this.xMov = 0;
				this.yMov = 0;
				this.zMov = 0;
			}
		}

		// Simulations
	}
	Area.prototype.GetX = function () {
		return this.x + (this.xMov * this.moveTime / this.moveDuration);
	};
	Area.prototype.GetY = function () {
		return this.y + (this.yMov * this.moveTime / this.moveDuration);
	};
	Area.prototype.GetZ = function () {
		return this.z + (this.zMov * this.moveTime / this.moveDuration);
	};

	function Level (levelData) {
		this.type = "Level";

		this.id = levelData.id
		this.name = levelData.name;

		if (!IS_SERVER) {
			this.drawObjects = [];
		}

		// Prep areas
		this.areas = [];
		for (var i = 0; i < levelData.areaDatas.length; i++) {
			var areaData = levelData.areaDatas[i];
			var newArea = new Area(areaData);
			this.areas.push(newArea);
			if (!IS_SERVER) {
				this.drawObjects.push(newArea);
			}
		}
		this.areaCounter = this.areas.length;

		// Prep entities
		this.entities = [];
		for (var i = 0; i < levelData.entityDatas.length; i++) {
			var entityData = levelData.entityDatas[i];
			var newEntity = new Entity(entityData);
			this.entities.push(newEntity);
			if (!IS_SERVER) {
				this.drawObjects.push(newEntity);
			}
		}
		this.entityCounter = this.entities.length;

	}
	Level.prototype.Export = function () {
		var areaDatas = [];
		for (var i = 0; i < this.areas.length; i++) {
			areaDatas.push(this.areas[i].Export());
		}
		var entityDatas = [];
		for (var i = 0; i < this.entities.length; i++) {
			entityDatas.push(this.entities[i].Export());
		}
		var levelData = {
			id: this.id,
			name: this.name,
			areaDatas: areaDatas,
			entityDatas: entityDatas,
		};
		return levelData;
	};
	Level.prototype.Update = function (sessionRef) {
		for (var i = 0; i < this.entities.length; i++) {
			// Update entitites
			var entity = this.entities[i];
			entity.Update(sessionRef, this);
		}
		for (var i = 0; i < this.areas.length; i++) {
			// Update areas
			var area = this.areas[i];
			area.Update(sessionRef, this);
		}
	}
	Level.prototype.AddArea = function (areaData) {
		var newArea = new Area(areaData);
		this.areas.push(newArea);
		if (!IS_SERVER) {
			this.drawObjects.push(newArea);
		}
		return newArea;
	};
	Level.prototype.GetAreaByID = function (areaID) {
		var id = Number(areaID);
		var result = this.areas.filter(function (area) {
			return area.id === id;
		});
		if (result[0] !== undefined) {
			return result[0];
		}
	};
	Level.prototype.DeleteArea = function (areaID) {
		var area = this.GetAreaByID(areaID);
		if (!IS_SERVER) {
			this.drawObjects.splice(this.drawObjects.indexOf(area), 1);
		}
		this.areas.splice(this.areas.indexOf(area), 1);
	};
	Level.prototype.AddEntity = function (entityData, sessionRef, levelRef) {
		var newEntity = new Entity(entityData);
		this.entities.push(newEntity);
		if (!IS_SERVER) {
			this.drawObjects.push(newEntity);
		}
		// This can trigger another entity's events possibly
		newEntity.TriggerCreationsForNearby(sessionRef, levelRef);
		return newEntity;
	};
	Level.prototype.AddExistingEntity = function (entity) {
		this.entities.push(entity);
		if (!IS_SERVER) {
			this.drawObjects.push(entity);
		}
		return entity;
	};
	Level.prototype.RemoveEntity = function (entity, sessionRef, levelRef) {
		entity.toBeRemoved = true;
		// Can trigger another entity's events
		entity.TriggerRemovalsForNearby(sessionRef, levelRef);
		this.entities.splice(this.entities.indexOf(entity), 1);
		if (!IS_SERVER) {
			this.drawObjects.splice(this.drawObjects.indexOf(entity), 1);
		}
		return entity;
	};
	Level.prototype.GetEntityByID = function (entityID) {
		var id = Number(entityID);
		var result = this.entities.filter(function (entity) {
			return entity.id === id;
		});
		if (result[0] !== undefined) {
			return result[0];
		}
	};
	Level.prototype.CheckLocationSolid = function(x, y, z, forRendering) {
		for (var i = 0; i < this.areas.length; i++) {
			var area = this.areas[i];
			if (x >= area.x && x < area.x + area.xSize &&
				y >= area.y && y < area.y + area.ySize &&
				z >= area.z && z < area.z + area.zSize) {
				//Within area's bounds
				var tile = area.map[x - area.x][y - area.y][z - area.z];
				if (TileIsSolid(tile)) {
					return true;
				}
			}
			//if (area.xMov !== 0 || area.yMov !== 0 || area.zMov !== 0)
			//{
			//	//Area is moving: check new bounds
			//	if (x >= area.x + area.xMov && x < area.x + area.xMov + area.xSize &&
			//		y >= area.y + area.yMov && y < area.y + area.yMov + area.ySize &&
			//		z >= area.z + area.zMov && z < area.z + area.zMov + area.zSize) {
			//		var tile = area.map[x - area.x - area.xMov][y - area.y - area.yMov][z - area.z - area.zMov];
			//		if (TileIsSolid(tile)) {
			//			return true;
			//		}
			//	}
			//}
		}
		for (var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			if (entity.settings.solid === true) {
				// if (entity.x === x && entity.y === y && entity.z === z) {
				// xyz within bounds of entity.xyz + entity.xyzSize
				if (x >= entity.x && y >= entity.y && z >= entity.z &&
					x <= entity.x + entity.xSize - 1 &&
					y <= entity.y + entity.ySize - 1 &&
					z <= entity.z + entity.zSize - 1) {
					// If this is a solidity check for rendering purposes, skip if entity is moving
					if (forRendering) {
						if (entity.xMov === 0 && entity.yMov === 0 && entity.zMov === 0) {
							if (entity.settings.visible === true) {
								return true;
							}
						}
					}
					else
					{
						return true;
					}
				}
			}
		}
		return false;
	};
	Level.prototype.CheckRelativeLocationSolid = function (entity, x, y, z) {
		return this.CheckLocationSolid(entity.x + x, entity.y + y, entity.z + z);
	};
	Level.prototype.GetAreaAtLocation = function (x, y, z) {
		for (var i = 0; i < this.areas.length; i++) {
			var area = this.areas[i];
			if (x >= area.x && x < area.x + area.xSize &&
				y >= area.y && y < area.y + area.ySize &&
				z >= area.z && z < area.z + area.zSize) {
				//Within area's bounds
				return area;
			}
		}
		return undefined;
	};
	// Only gets first entity found
	Level.prototype.GetEntityAtLocation = function (x, y, z) {
		for (var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			if (x === entity.x &&
				y === entity.y &&
				z === entity.z) {
				// On entity's location
				return entity;
			}
		}
		return undefined;
	};
	Level.prototype.GetEntitiesAtLocation = function (x, y, z) {
		var resultArr = [];
		for (var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			if (x === entity.x &&
				y === entity.y &&
				z === entity.z) {
				// On entity's location
				resultArr.push(entity);
			}
		}
		return resultArr;
	};
	function TileIsSolid (tile) {
		if (tile !== 0) {
			return true;
		}
		return false;
	}
	function Session (name, worldData) {
		this.type = "Session";
		// name: string
		this.name = name;
		this.worldName = worldData.worldName;
		this.levels = [];
		for (var i = 0; i < worldData.levelDatas.length; i++) {
			var levelData = worldData.levelDatas[i];
			var newLevel = new Level(levelData);
			this.levels.push(newLevel);
		}
		this.levelCounter = this.levels.length;
		// tileData: [{name: string, solid: boolean, rules: [rules...]}, ...]
		this.tileData = worldData.tileData;

		// worldRules: [rules...]
		this.worldRules = worldData.worldRules;

		// entityTemplates: [entityTemplates...]
		// entityTemplate: {name: string, rules: [rules...], variables: [variables...]}
		this.entityTemplates = worldData.entityTemplates;

		// areaTemplates: [areaTemplates...]
		// areaTemplate: {name: string, rules: [rules...], variables: [variables...]}
		this.areaTemplates = worldData.areaTemplates;

		// playerTemplate
		this.playerTemplate = worldData.playerTemplate;

		// itemData
		this.itemData = worldData.itemData;
	}
	Session.prototype.ExportWorld = function () {
		var levelDatas = [];
		for (var i = 0; i < this.levels.length; i++) {
			var level = this.levels[i];
			levelDatas.push(level.Export());
		}
		var worldData = {
			worldName: this.worldName || "World Name",
			levelCount: this.levels.length,
			levelDatas: levelDatas,
			tileData: this.tileData,
			worldRules: this.worldRules,
			entityTemplates: this.entityTemplates,
			areaTemplates: this.areaTemplates,
			playerTemplate: this.playerTemplate,
			itemData: this.itemData,
		};
		return worldData;
	}
	Session.prototype.ExportWorldNoPlayers = function() {
		var worldExport = this.ExportWorld();
		for (var i = 0; i < worldExport.levelDatas.length; i++) {
			var level = worldExport.levelDatas[i];

			// TODO: should check if each entity is a player or not, and take all the players out
			// for (var i = 0; i < level.entityDatas.length; i++) {
			// 	var entityData = level.entityDatas[i];
			// 	if (true) {
			// 		// Delete entity if it is a player
			// 	}
			// }
			
			// For now, just clear all entities
			level.entityDatas = [];
		}
		return worldExport;
	};
	Session.prototype.AddLevel = function (levelData) {
		var newLevel = new Level(levelData);
		this.levels.push(newLevel);
		return newLevel;
	};
	Session.prototype.RemoveLevel = function (id) {
		var level = this.GetLevelByID(id);
		if (level !== undefined) {
			this.levels.splice(this.levels.indexOf(level), 1);
		}
	}
	Session.prototype.GetLevelByID = function (id) {
		id = Number(id);
		var result = this.levels.filter(function (level) {
			return level.id === id;
		});
		if (result[0] !== undefined) {
			return result[0];
		}
		else {
			console.log("Couldn't find level with id: " + id);
		}
	}
	Session.prototype.EditTile = function (levelID, areaID, tileData) {
		var level = this.GetLevelByID(levelID);
		var area = level.GetAreaByID(areaID);
		area.map[tileData.x][tileData.y][tileData.z] = tileData.tile;
		// area.extra[tileData.x][tileData.y][tileData.z] = tileData.extra;
	};
	// Session.prototype.CreatePlayerEntity = function (levelID) {
	// 	//
	// 	var newPlayer = new Entity(0, 0, 0, {color: "#FFFFFF", border: "#208080"}, {gravity: true, solid: true}, [], []);
	// 	var level = this.GetLevelByID(levelID);
	// 	return newPlayer.id;
	// }
	// Session.prototype.CreateEntity = function (levelID) {
	// 	var newEntity = new Entity(0, 0, 0, {color: "#FF80FF", border: "#2080F0"}, {gravity: true, solid: true}, [], []);
		
	// 	return newEntity.id;
	// }
	Session.prototype.DeleteEntity = function (levelID, entityID) {
		var level = this.GetLevelByID(levelID);
		var entity = level.GetEntityByID(entityID);
		entity.toBeRemoved = true;

		// Can trigger removal events
		entity.TriggerRemovalsForNearby(this, level);

		if (!IS_SERVER) {
			level.drawObjects.splice(level.drawObjects.indexOf(entity), 1);
		}
		level.entities.splice(level.entities.indexOf(entity), 1);
	}
	Session.prototype.ChangeEntity = function (levelID, entityID, entityData) {
		var level = this.GetLevelByID(levelID);
		var entity = level.GetEntityByID(entityID);

		// Update all values to the ones passed in, except for ID
		// entity.id = entityData.id
		entity.x = entityData.x;
		entity.y = entityData.y;
		entity.z = entityData.z;
		entity.style = entityData.style;
		entity.settings = entityData.settings;
		entity.variables = entityData.variables;
		entity.rules = entityData.rules;
		entity.templates = entityData.templates;
		entity.variableCounter = entityData.variableCounter;
	};
	Session.prototype.GetEntityByID = function (levelID, id) {
		var level = this.GetLevelByID(levelID);
		id = Number(id);
		var result = worldArray.filter(function (world) {
			return world.id === id;
		});
		if (result[0] !== undefined) {
			return result[0];
		}
	}
	Session.prototype.ExportTriggerData = function () {
		return triggers;
	}
	Session.prototype.ExportConditionData = function () {
		return conditions;
	}
	Session.prototype.ExportEffectData = function () {
		return effects;
	}
	Session.prototype.ExportConstructionData = function () {
		return constructions;
	}
	Session.prototype.GetEntityTemplateByID = function (id) {
		var result = this.entityTemplates.filter(function (entityTemplate) {
			entityTemplate.id === id;
		});
		if (result[0] !== undefined) {
			return result;
		}
	}
	Session.prototype.UpdateEntityTemplateByID = function (id, entityData) {
		var result = this.entityTemplates.filter(function (entityTemplate) {
			entityTemplate.id === id;
		});
		if (result[0] !== undefined) {
			var index = this.entityTemplates.indexOf(result[0]);
			this.entityTemplates[index] = entityData;
		}
	}
	return Session;
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = Session;
}
else {
	window.Session = Session;
}

})();
