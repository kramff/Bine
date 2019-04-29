// Bine puzzle game copyright Mark Foster 2015-2016

"use strict";



// Random stuff for game

var orbsCollected = 0;








// Canvas stuff
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var CANVAS_WIDTH = 600;
var CANVAS_HEIGHT = 600;
var CANVAS_HALF_WIDTH = 300;
var CANVAS_HALF_HEIGHT = 300;

// Display variables
var EYE_DISTANCE = 45;
var SCALE_MULTIPLIER = 490;
var Z_MULTIPLIER = 3.1;
var TILE_SIZE = 5.4;

var CEILING_FADE_DIST = 2;

// Editor variables
var editorActive = false;
var selectedArea = undefined;
var fakeExtra = {opacity: 1, pattern: 0, fill: 1};

var editingEntity = false;
var currentEntity = undefined;
var E_MODE_NORMAL = 0; //Look at and click on all rules
var E_MODE_CHOOSE_TRIGGER = 1; //Choose a new trigger to add in
var E_MODE_CHOOSE_RULE = 2; //Choose a new rule (Condition or Result) to add in
var E_MODE_EDIT_RULE = 3; //Edit a rule (Trigger, Condition, or Result)
var E_MODE_EDIT_VALUE = 3; //Edit a value for a rule
var editingEntitySpot = undefined;
var editingEntityMode = E_MODE_NORMAL;
var ruleHoverSpot = undefined;
var ruleHoverMode = 0;
var ruleHoverPossible = true;
var editingValueSpot = undefined;
var editValue = undefined;
var editValueType = undefined


var choosingTrigger = false;
var choosingRule = false;
var editingRule = false;

// Input variables
var wKey = false;
var aKey = false;
var sKey = false;
var dKey = false;
var qKey = false;
var eKey = false;
var upKey = false;
var downKey = false;
var leftKey = false;
var rightKey = false;
var shiftPressed = false;
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;
var mouseMovement = false;
var mouseTilesX = 0;
var mouseTilesY = 0;
var middleClick = false;
var midStartX = 0;
var midStartY = 0;

// Special camera/screen manipulation
var edgeSquareLimit = {active:false, x: 300, y: 300, xSize: 0, ySize: 0}

// After holding a direction down from this long, that movement can't be canceled
var MOVEMENT_CHANGE_WINDOW = 3;

// Tile types
var EMPTY = 0;
var SOLID = 1;
var DISAPPEAR_BLOCK = 2;
var APPEAR_BLOCK = 3;
var PATTERN_BLOCK = 4;
var PATTERN_CLEAR_BLOCK = 5;
var PATTERN_ACTIVATE_BLOCK = 6;
var PATTERN_EFFECT_BLOCK = 7;
var PATTERN_HOLE_BLOCK = 8;
var SIMULATION_BLOCK = 9;
var FLUID_BLOCK = 10;
var ORB_BLOCK = 11;

// Number of tile types
var TILE_TYPES = 12;

// Area status
var STATUS_NORMAL = 0;
var STATUS_DRAWING = 1;
var STATUS_ACTIVE = 2;

// Array of directions
var DIRECTIONS = [
	{x: 0, y: -1, z: 0}, //North
	{x: 1, y: 0, z: 0},  //East
	{x: 0, y: 1, z: 0},  //South
	{x: -1, y: 0, z: 0}, //West
	{x: 0, y: 0, z: 1},  //Up
	{x: 0, y: 0, z: -1}  //Down
];

// Game data
var areas = [];
var areaColors = [];
var entities = [];
var drawObjects = [];
var messages = [];



function CreateEntity (x, y, z) {
	//initial location
	var newEntity = new Entity (x, y, z);
	entities.push(newEntity);
	drawObjects.push(newEntity);
	return newEntity;
}

function Entity (x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.xMov = 0;
	this.yMov = 0;
	this.zMov = 0;
	this.moveDelay = 0;
	this.delayTime = 10;

	//Riding on (standing on) an area: only 1 at a time, undefined if none
	this.ridingArea = undefined;

	//Pushed by an area: can be multiple, pushing areas stored in array
	this.pushingAreas = [];

	this.fallTime = 0;
	this.lastSafeCoord = {x: this.x, y: this.y, z: this.z};

	// Rules
	this.rules = [];

	this.isEntity = true;
	this.isArea = false;
}

var player;
var firstTransparentTilesArray = [[99, 99, 99],[99, 99, 99],[99, 99, 99]];
var underCeiling = false;
var areaCounter = 0;

function Area (x, y, z, xSize, ySize, zSize, useImport, map, rule) {
	this.x = x;
	this.y = y;
	this.z = z;
	
	this.xSize = xSize;
	this.ySize = ySize;
	this.zSize = zSize;

	this.xMov = 0;
	this.yMov = 0;
	this.zMov = 0;
	this.moveDelay = 0;
	this.delayTime = 10;

	this.rule = rule;
	this.simulate = false;

	areaCounter ++;
	this.name = "Area " + areaCounter;

	this.status = 0;
	this.extraData = []; //[x][y][z] - object with any values
	this.map = []; //[x][y][z] - type (number)
	if (useImport)
	{
		this.map = map;
	}
	for (var i = 0; i < xSize; i++)
	{
		if (!useImport)
		{
			this.map.push([]);
		}
		this.extraData.push([]);
		for (var j = 0; j < ySize; j++)
		{
			if (!useImport)
			{
				this.map[i].push([]);
			}
			this.extraData[i].push([]);
			for (var k = 0; k < zSize; k++)
			{
				var tile = EMPTY;
				if (!useImport)
				{
					
				}
				else // (useImport === true)
				{
					tile = this.map[i][j][k];
				}
				var extra;
				switch (tile)
				{
					default:
						extra = {};
					break
					case APPEAR_BLOCK:
						extra = {opacity: 0};
					break;
					case DISAPPEAR_BLOCK:
						extra = {opacity: 1};
					break;
					case PATTERN_BLOCK:
						extra = {pattern: 0};
					break;
					case SIMULATION_BLOCK:
						extra = {prevSim: 0, newSim: 0};
						area.simulate = true;
					break;
					case FLUID_BLOCK:
						extra = {prevFill: 0.1, newFill: 0.1, prevflow: [0, 0, 0, 0, 0, 0], newFlow: [0, 0, 0, 0, 0, 0]};
						area.simulate = true;
					break;
					case ORB_BLOCK:
						extra = {orbHere: true};
					break;
				}
				this.extraData[i][j].push(extra);
				if (!useImport)
				{
					this.map[i][j].push(tile);
				}
			}
		}
	}
	this.isEntity = false;
	this.isArea = true;
}

function SetTile (area, x, y, z, tile) {
	var prevTile = area.map[x][y][z];
	if (tile === prevTile)
	{
		// No change needed
		return false;
	}
	area.map[x][y][z] = tile;
	switch (tile)
	{
		default:
			area.extraData[x][y][z] = {};
		break
		case APPEAR_BLOCK:
			area.extraData[x][y][z] = {opacity: 0};
		break;
		case DISAPPEAR_BLOCK:
			area.extraData[x][y][z] = {opacity: 1};
		break;
		case PATTERN_BLOCK:
			area.extraData[x][y][z] = {pattern: 0};
		break;
		case PATTERN_EFFECT_BLOCK:
			area.extraData[x][y][z] = {opacity: 0};
		break;
		case PATTERN_HOLE_BLOCK:
			area.extraData[x][y][z] = {opacity: 1};
		break;
		case SIMULATION_BLOCK:
			area.extraData[x][y][z] = {prevSim: 0, newSim: 0};
			area.simulate = true;
		break;
		case FLUID_BLOCK:
			area.extraData[x][y][z] = {prevFill: 0.1, newFill: 0.1, prevflow: [0, 0, 0, 0, 0, 0], newFlow: [0, 0, 0, 0, 0, 0]};
			area.simulate = true;
		break;
		case ORB_BLOCK:
			area.extraData[x][y][z] = {orbHere: true};
		break;
	}
}

function GetAreaByName (name) {
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (area.name === name)
		{
			return area;
		}
	}
	return undefined;
}

function InitGame () {

	xCam = player.x + 0.5;
	yCam = player.y + 0.5;
	zCam = player.z;

	
	if (MULTI_ON)
	{
		for (var i = 0; i < playerArray.length; i++)
		{
			var otherPlayer = playerArray[i];
			drawObjects.push(otherPlayer);
		}
	}
}


var lastX = 0;
var lastY = 0;
var lastZ = 0;


var lastTime = new Date;
var delay = 0;
var totalDelay = 0;
var frameCount = 0;
var numSquares = 0;

var showStats = false;

var slowmoActive = false;
var slowmoCounter = 0;

function Update () {
	window.requestAnimationFrame(Update);

	if (slowmoActive)
	{
		slowmoCounter--;
		if (slowmoCounter <= 0)
		{
			slowmoCounter = 5;
		}
		else
		{
			return;
		}
	}

	AreaUpdate();
	Control();
	Render();

	if (lastX !== GetEntityX(player) || lastY !== GetEntityY(player) || lastZ !== GetEntityZ(player))
	{
		if (editorActive && mousePressed)
		{
			// EditorMouseDown();
			EditorMouseMove();
		}
		if (MULTI_ON)
		{
			SendPositionUpdate({x: GetEntityX(player), y: GetEntityY(player), z: GetEntityZ(player)});
		}
	}

	lastX = GetEntityX(player);
	lastY = GetEntityY(player);
	lastZ = GetEntityZ(player);

	//Stats
	delay = (new Date - lastTime);
	totalDelay += delay;
	frameCount ++;
	lastTime = new Date;
}

function AreaUpdate () {
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (area.moveDelay > 0)
		{
			area.moveDelay --;
			if (area.moveDelay <= 0)
			{
				//End area movement

				//Move player if they are riding on this area
				if (player.ridingArea === area)
				{
					player.ridingArea = undefined;
					player.x += area.xMov;
					player.y += area.yMov;
					player.z += area.zMov;
				}
				//Move player if they are being pushed by this area
				if (player.pushingAreas.indexOf(area) !== -1)
				{
					player.pushingAreas.splice(player.pushingAreas.indexOf(area));
					player.x += area.xMov;
					player.y += area.yMov;
					player.z += area.zMov;

				}

				//Move area
				area.x += area.xMov;
				area.y += area.yMov;
				area.z += area.zMov;
				area.xMov = 0;
				area.yMov = 0;
				area.zMov = 0;
			}
		}
		if (area.simulate)
		{
			//Update tile by tile
			for (var i = 0; i < area.xSize; i++)
			{
				for (var j = 0; j < area.ySize; j++)
				{
					for (var k = 0; k < area.zSize; k++)
					{
						var tile = area.map[i][j][k];
						var extra = area.extraData[i][j][k];
						if (tile === FLUID_BLOCK)
						{
							//***
							var amt = extra.prevFill / 10;
							for (var d = 0; d < DIRECTIONS.length; d++)
							{
								var dir = DIRECTIONS[d];
								if (CheckTileType(area, i + dir.x, j + dir.y, k + dir.z, FLUID_BLOCK))
								{
									var otherExtra = area.extraData[i + dir.x][j + dir.y][k + dir.z];

									//Do actual flow stuff here
									if (extra.prevFill > otherExtra.prevFill)
									{
										extra.newFill -= 0.01;
										otherExtra.newFill += 0.01;
									}
								}
							}
						}
					}
				}
			}
			//Update prev statuses from new statuses
			for (var i = 0; i < area.xSize; i++)
			{
				for (var j = 0; j < area.ySize; j++)
				{
					for (var k = 0; k < area.zSize; k++)
					{
						var tile = area.map[i][j][k];
						var extra = area.extraData[i][j][k];
						if (tile === FLUID_BLOCK)
						{
							extra.prevFill = extra.newFill;
						}
					}
				}
			}
		}
	}
}

function Control () {

	var up = wKey || upKey;
	var down = sKey || downKey;
	var left = aKey || leftKey;
	var right = dKey || rightKey;
	if (mouseMovement)
	{
		up = mouseTilesY < 0;
		down = mouseTilesY > 0;
		left = mouseTilesX < 0;
		right = mouseTilesX > 0;
	}


	//Move delay greater than 0 -> in the process of moving
	if (player.moveDelay > 0)
	{
		player.moveDelay --;

		//Done with this movement
		if (player.moveDelay <= 0)
		{
			if (mouseMovement)
			{
				mouseTilesX -= player.xMov;
				mouseTilesY -= player.yMov;
			}
			player.x += player.xMov;
			player.y += player.yMov;
			player.z += player.zMov;
			player.xMov = 0;
			player.yMov = 0;
			player.zMov = 0;
			if (!editorActive)
			{
				EndMovement(player);
			}
		}
		else
		{
			if (player.moveDelay > player.delayTime - MOVEMENT_CHANGE_WINDOW && IsSolidEOffset(player, 0, 0, -1))
			{
				var movementChanged = false;
				// Allow diagonal movement within a few frames
				if (up && player.yMov === 0)
				{
					player.yMov = -1;
					movementChanged = true;
				}
				if (down && player.yMov === 0)
				{
					player.yMov = 1;
					movementChanged = true;
				}
				if (left && player.xMov === 0)
				{
					player.xMov = -1;
					movementChanged = true;
				}
				if (right && player.xMov === 0)
				{
					player.xMov = 1;
					movementChanged = true;
				}
				if (editorActive)
				{
					if (qKey && player.zMov === 0)
					{
						player.zMov = 1;
					}
					if (eKey && player.zMov === 0)
					{
						player.zMov = -1;
					}
				}
				// Allow canceling movement by releasing key or pressing opposite
				if (player.yMov === -1 && (!up || down))
				{
					player.yMov = 0;
					if (player.xMov === 0)
					{
						player.zMov = 0;
						SetMoveDelay(player, 1);
					}
					else
					{
						movementChanged = true;
					}
				}
				if (player.yMov === 1 && (!down || up))
				{
					player.yMov = 0;
					if (player.xMov === 0)
					{
						player.zMov = 0;
						SetMoveDelay(player, 1);
					}
					else
					{
						movementChanged = true;
					}
				}
				if (player.xMov === -1 && (!left || right))
				{
					player.xMov = 0;
					if (player.yMov === 0)
					{
						player.zMov = 0;
						SetMoveDelay(player, 1);
					}
					else
					{
						movementChanged = true;
					}
				}
				if (player.xMov === 1 && (!right || left))
				{
					player.xMov = 0;
					if (player.yMov === 0)
					{
						player.zMov = 0;
						SetMoveDelay(player, 1);
					}
					else
					{
						movementChanged = true;
					}
				}
				if (movementChanged && !editorActive)
				{
					player.zMov = 0;
					MovementXYRules(player);
				}
			}
			return;
		}
	}
	if (IsSolidEOffset(player, 0, 0, -1) || editorActive)
	{
		//Solid ground below player - can move
		if (up && !down)
		{
			player.yMov = -1;
			SetMoveDelay(player, 10);
		}
		if (down && !up)
		{
			player.yMov = 1;
			SetMoveDelay(player, 10);
		}
		if (left && !right)
		{
			player.xMov = -1;
			SetMoveDelay(player, 10);
		}
		if (right && !left)
		{
			player.xMov = 1;
			SetMoveDelay(player, 10);
		}
		if (editorActive)
		{
			if (qKey && !eKey)
			{
				player.zMov = 1;
				SetMoveDelay(player, 10);
			}
			if (eKey && !qKey)
			{
				player.zMov = -1;
				SetMoveDelay(player, 10);
			}
		}
		else
		{
			MovementXYRules(player);
		}
	}
	else if (!editorActive)
	{
		//Fall down
		player.xMov = 0;
		player.yMov = 0;
		player.zMov = -1;
		SetMoveDelay(player, 2);
	}
	if (false && player.z < -20)
	{
		//respawn
		player.x = 15;
		player.y = 5;
		player.z = 4;
	}
	if (editorActive)
	{
		if (shiftPressed)
		{
			player.xMov *= 5;
			player.yMov *= 5;
			player.zMov *= 5;
		}
	}
}

function SetMoveDelay (entity, delay) {
	entity.moveDelay = delay;
	entity.delayTime = delay;
}


function MovementXYRules (entity) {
	if (entity.xMov === 0 && entity.yMov === 0)
	{
		//No x or y movement
	}
	else if (entity.xMov === 0 || entity.yMov === 0)
	{
		//No diagonal movment to deal with, just possibly going up stairs/falling into hole
		MovementZRules(entity);
		return;
	}
	else
	{
		//Diagonal movement
		var xOption = MovementZRulesCheck(entity, entity.xMov, 0);
		var yOption = MovementZRulesCheck(entity, 0, entity.yMov);
		if ((xOption && yOption) && MovementZRulesCheck(entity, entity.xMov, entity.yMov))
		{
			//regular diagonal movment
			MovementZRules(entity);
		}
		else
		{
			//regular diagonal movement blocked, check x and y options
			if (xOption && !yOption)
			{
				//Go x direction only if y blocked
				entity.yMov = 0;
				MovementZRules(entity);
			}
			else if (yOption && !xOption)
			{
				//Go y direction only if x blocked
				entity.xMov = 0;
				MovementZRules(entity);
			}
			else
			{
				//If both are blocked or both open, default to x movement i guess
				entity.yMov = 0;
				MovementZRules(entity);
			}
		}
	}
}

//x, y: position offset from entity to check
//return: true if possible to move that direction, false otherwise
function MovementZRulesCheck (entity, x, y) {
	var aboveSolid = IsSolidEOffset(entity, x, y, 1);
	var levelSolid = IsSolidEOffset(entity, x, y, 0);
	var selfAboveSolid = IsSolidEOffset(entity, 0, 0, 1);
	
	// There is an open space at entity's level or above (side view)
	//     .
	//   /
	// E - .
	if (!aboveSolid || !levelSolid)
	{
		// Entity is not boxed in (side view)
		// 
		// X   .
		//   /
		// E   X
		if (levelSolid && selfAboveSolid)
		{
			return false;
		}
		return true;
	}
	return false;
}

// Change the actual movement of the entity
function MovementZRules (entity) {
	var aboveSolid = IsSolidEMovOffset(entity, 0, 0, 1);
	var levelSolid = IsSolidEMovOffset(entity, 0, 0, 0);
	var belowSolid = IsSolidEMovOffset(entity, 0, 0, -1);
	var selfAboveSolid = IsSolidEOffset(entity, 0, 0, 1);

	if (levelSolid)
	{
		if (aboveSolid)
		{
			//Stop
			entity.xMov = 0;
			entity.yMov = 0;
		}
		else
		{
			if (selfAboveSolid)
			{
				//blocked by ceiling
				entity.xMov = 0;
				entity.yMov = 0;
			}
			else
			{
				//upwards movement
				entity.zMov = 1;
			}
		}
	}
	else if (!belowSolid)
	{
		//downwards movement
		entity.zMov = -1;
	}
	//otherwise: level movement
}

function BeginAreaMovement (area, xMov, yMov, zMov, delay) {
	area.moveDelay = delay;
	area.delayTime = delay;
	area.xMov = xMov;
	area.yMov = yMov;
	area.zMov = zMov;

	//Check if player is standing on any tiles in area
	if (LocationInArea(area, player.x, player.y, player.z - 1))
	{
		var onTile = area.map[player.x - area.x][player.y - area.y][player.z - area.z - 1];
		if (TileIsSolid(onTile))
		{
			//Player is riding on moving tile
			console.log("Standing on tile");
			player.riding = true;
			player.ridingArea = area;
		}
	}
	//Check if player is standing in path of a tile
	//(cannot be pushed if already riding on area)
	else if (LocationInArea(area, player.x - xMov, player.y - yMov, player.z - zMov))
	{
		var pushingTile = area.map[player.x - area.x - xMov][player.y - area.y - yMov][player.z - area.z - zMov];
		if (TileIsSolid(pushingTile))
		{
			//Player is in path of pushing tile
			console.log("Pushed by tile");
			player.pushed = true;
			player.pushingAreas.push(area);
		}
	}

}


//getName: if true, get the name of each area
//(For now, name is just "Area #")
function GetAreasAtPosition (x, y, z, getName) {
	var areasHere = [];
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (LocationInArea(area, x, y, z))
		{
			if (getName === true)
			{
				if (area === selectedArea)
				{
					areasHere.push("~" + area.name.toUpperCase() + "~");
				}
				else
				{
					areasHere.push(area.name);
				}
			}
			else
			{
				areasHere.push(area);
			}
		}
	}
	return areasHere;
}

function GetEntityX (entity) {
	return entity.x +
		entity.xMov * (entity.delayTime - entity.moveDelay) / entity.delayTime +
		(entity.ridingArea !== undefined ? GetAreaX(entity.ridingArea) - entity.ridingArea.x : 0) +
		(entity.pushingAreas.length > 0 ? GetAreaX(entity.pushingAreas[0]) - entity.pushingAreas[0].x : 0) +
		(entity.pushingAreas.length > 1 ? GetAreaX(entity.pushingAreas[1]) - entity.pushingAreas[1].x : 0) +
		(entity.pushingAreas.length > 2 ? GetAreaX(entity.pushingAreas[2]) - entity.pushingAreas[2].x : 0);
}

function GetEntityY (entity) {
	return entity.y +
		entity.yMov * (entity.delayTime - entity.moveDelay) / entity.delayTime +
		(entity.ridingArea !== undefined ? GetAreaY(entity.ridingArea) - entity.ridingArea.y : 0) +
		(entity.pushingAreas.length > 0 ? GetAreaY(entity.pushingAreas[0]) - entity.pushingAreas[0].y : 0) +
		(entity.pushingAreas.length > 1 ? GetAreaY(entity.pushingAreas[1]) - entity.pushingAreas[1].y : 0) +
		(entity.pushingAreas.length > 2 ? GetAreaY(entity.pushingAreas[2]) - entity.pushingAreas[2].y : 0);
}

function GetEntityZ (entity) {
	return entity.z +
		entity.zMov * (entity.delayTime - entity.moveDelay) / entity.delayTime +
		(entity.ridingArea !== undefined ? GetAreaZ(entity.ridingArea) - entity.ridingArea.z : 0) +
		(entity.pushingAreas.length > 0 ? GetAreaZ(entity.pushingAreas[0]) - entity.pushingAreas[0].z : 0) +
		(entity.pushingAreas.length > 1 ? GetAreaZ(entity.pushingAreas[1]) - entity.pushingAreas[1].z : 0) +
		(entity.pushingAreas.length > 2 ? GetAreaZ(entity.pushingAreas[2]) - entity.pushingAreas[2].z : 0);
}

function GetAreaX (area) {
	return area.x + area.xMov * (area.delayTime - area.moveDelay) / area.delayTime;
}

function GetAreaY (area) {
	return area.y + area.yMov * (area.delayTime - area.moveDelay) / area.delayTime;
}

function GetAreaZ (area) {
	return area.z + area.zMov * (area.delayTime - area.moveDelay) / area.delayTime;
}

function GetScale (z) {
	return -(TILE_SIZE / ( Z_MULTIPLIER * (z - zCam) - EYE_DISTANCE)) * SCALE_MULTIPLIER;
}


//Up to <dist> tiles away in all directions, except for z which is more forgiving by 2
function IsNear (x1, y1, z1, x2, y2, z2, dist) {
	if (Math.abs(x1 - x2) <= dist && Math.abs(y1 - y2) <= dist && Math.abs(z1 - z2) <= dist + 2)
	{
		return true;
	}
	return false;
}

function InCeiling (x, y, z) {
	//Check if player is under a ceiling
	if (!underCeiling)
	{
		return false;
	}
	//Check if z is above player
	if (z <= player.z)
	{
		return false;
	}
	//Check if x, y are within 3x3 square around player
	if (x > player.x + CEILING_FADE_DIST || x < player.x - CEILING_FADE_DIST || y > player.y + CEILING_FADE_DIST || y < player.y - CEILING_FADE_DIST)
	{
		return false;
	}
	//Check if tile is above an empty tile above the player
	if (firstTransparentTilesArray[x - player.x + CEILING_FADE_DIST][y - player.y + CEILING_FADE_DIST] > z)
	{
		return false;
	}
	return true;
}

function IsOpaque (x, y, z) {
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (x >= area.x && x < area.x + area.xSize && y >= area.y && y < area.y + area.ySize && z >= area.z && z < area.z + area.zSize)
		{
			//Within area's bounds
			var tile = area.map[x - area.x][y - area.y][z - area.z];
			if (TileIsOpaque(tile))
			{
				return true;
			}
		}
	}
	return false;
}

function TileIsOpaque (tile) {
	if (tile === SOLID)
	{
		return true;
	}
	if (tile === DISAPPEAR_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_ACTIVATE_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_CLEAR_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_EFFECT_BLOCK)
	{
		return true;
	}
	if (tile === ORB_BLOCK)
	{
		return true;
	}
}

function IsSolid (x, y, z) {
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (x >= area.x && x < area.x + area.xSize &&
			y >= area.y && y < area.y + area.ySize &&
			z >= area.z && z < area.z + area.zSize)
		{
			//Within area's bounds
			var tile = area.map[x - area.x][y - area.y][z - area.z];
			if (TileIsSolid(tile))
			{
				return true;
			}
		}
		if (area.xMov !== 0 || area.yMov !== 0 || area.zMov !== 0)
		{
			//Area is moving: check new bounds
			if (x >= area.x + area.xMov && x < area.x + area.xMov + area.xSize &&
				y >= area.y + area.yMov && y < area.y + area.yMov + area.ySize &&
				z >= area.z + area.zMov && z < area.z + area.zMov + area.zSize)
			{
				var tile = area.map[x - area.x - area.xMov][y - area.y - area.yMov][z - area.z - area.zMov];
				if (TileIsSolid(tile))
				{
					return true;
				}
			}
		}
	}
	return false;
}

//Same as IsSolid but ignore an area
function IsSolidIgnoreArea (x, y, z, ignoreArea) {
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (area !== ignoreArea)
		{
			if (x >= area.x && x < area.x + area.xSize &&
				y >= area.y && y < area.y + area.ySize &&
				z >= area.z && z < area.z + area.zSize)
			{
				//Within area's bounds
				var tile = area.map[x - area.x][y - area.y][z - area.z];
				if (TileIsSolid(tile))
				{
					return true;
				}
			}
			if (area.xMov !== 0 || area.yMov !== 0 || area.zMov !== 0)
			{
				//Area is moving: check new bounds
				if (x >= area.x + area.xMov && x < area.x + area.xMov + area.xSize &&
					y >= area.y + area.yMov && y < area.y + area.yMov + area.ySize &&
					z >= area.z + area.zMov && z < area.z + area.zMov + area.zSize)
				{
					var tile = area.map[x - area.x - area.xMov][y - area.y - area.yMov][z - area.z - area.zMov];
					if (TileIsSolid(tile))
					{
						return true;
					}
				}
			}
		}
	}
	return false;
}

function TileIsSolid (tile) {
	if (tile === SOLID)
	{
		return true;
	}
	if (tile === APPEAR_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_ACTIVATE_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_CLEAR_BLOCK)
	{
		return true;
	}
	if (tile === PATTERN_EFFECT_BLOCK)
	{
		return true;
	}
	if (tile === ORB_BLOCK)
	{
		return true;
	}
	return false;
}

function CheckTileType (area, i, j, k, type) {
	if (!PositionInBounds(area, i, j, k))
	{
		return false;
	}
	return (area.map[i][j][k] === type);
}

function IsSolidE (entity) {
	return IsSolid(entity.x, entity.y, entity.z);
}

function IsSolidEOffset (entity, x, y, z) {
	return IsSolid(entity.x + x, entity.y + y, entity.z + z);
}

function IsSolidEMov (entity) {
	return IsSolid(entity.x + entity.xMov, entity.y + entity.yMov, entity.z + entity.zMov);
}

function IsSolidEMovOffset (entity, x, y, z) {
	return IsSolid(entity.x + entity.xMov + x, entity.y + entity.yMov + y, entity.z + entity.zMov + z);
}

function LocationInArea (area, x, y, z) {
	if (area.x <= x && x < area.x + area.xSize)
	{
		if (area.y <= y && y < area.y + area.ySize)
		{
			if (area.z <= z && z < area.z + area.zSize)
			{
				return true;
			}
		}
	}
	return false;
}

function PositionInBounds (area, i, j, k) {
	if (0 <= i && i < area.xSize)
	{
		if (0 <= j && j < area.ySize)
		{
			if (0 <= k && k < area.zSize)
			{
				return true;
			}
		}
	}
	return false;
}

function Between (a, b, c) {
	return (a < b && b < c);
}
function BetweenInclusive (a, b, c) {
	return (a <= b && b <= c);
}

function EntitiesAtCoordinates (x, y, z) {
	var list = [];
	for (var i = 0; i < entities.length; i++)
	{
		var entity = entities[i];
		if (entity.x === x && entity.y === y && entity.z === z)
		{
			list.push(entity);
		}
	}
	return list;
}

function EntitiesAtCoordinatesNotPlayer (x, y, z) {
	var list = [];
	for (var i = 0; i < entities.length; i++)
	{
		var entity = entities[i];
		if (entity.x === x && entity.y === y && entity.z === z)
		{
			if (entity !== player)
			{
				list.push(entity);
			}
		}
	}
	return list;
}

function EndMovement (entity) {
	//Multiple tiles could exist at the same location
	
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (LocationInArea(area, entity.x, entity.y, entity.z - 1))
		{
			StepOnTile(entity, area, entity.x - area.x, entity.y - area.y, entity.z - 1 - area.z);
		}
	}
	if (!IsSolid(entity.x, entity.y, entity.z - 1))
	{
		// Stepped on nothing
		entity.fallTime ++;
		if (editorActive)
		{
			entity.fallTime = 0;
		}
		if (entity.fallTime > 15)
		{
			entity.x = entity.lastSafeCoord.x;
			entity.y = entity.lastSafeCoord.y;
			entity.z = entity.lastSafeCoord.z + 1;
			entity.fallTime = 0;
			mouseTilesX = 0;
			mouseTilesY = 0;
		}
	}
	else
	{
		entity.fallTime = 0;
		entity.lastSafeCoord.x = entity.x;
		entity.lastSafeCoord.y = entity.y;
		entity.lastSafeCoord.z = entity.z;
	}
	if (entity === player)
	{
		for (var i = 0; i < entities.length; i++)
		{
			var otherEntity = entities[i];
			if (otherEntity !== entity)
			{
				if (IsNear(entity.x, entity.y, entity.z, otherEntity.x, otherEntity.y, otherEntity.z, 1))
				{
					SendTrigger(otherEntity, TRIGGERS.PLAYER_STEPS_ADJACENT);
				}
			}
		}
	}
}

function StepOnTile (entity, area, x, y, z) {
	var tile = area.map[x][y][z];
	var extra = area.extraData[x][y][z];

	switch (tile) {
		case PATTERN_BLOCK:
			if (area.status === STATUS_NORMAL)
			{
				area.status = STATUS_DRAWING;
			}
			if (area.status === STATUS_DRAWING)
			{
				extra.pattern = 1;
			}
		break;
		case PATTERN_CLEAR_BLOCK:
			ClearAreaPattern(area);
			area.status = STATUS_NORMAL
		break;
		case PATTERN_ACTIVATE_BLOCK:
			ActivateAreaPattern(area);
		break;
		case ORB_BLOCK:
			if (extra.orbHere)
			{
				extra.orbHere = false;
				orbsCollected ++;
			}
		break;
	}
}


var PATTERN_STAIRS_V = {
	pattern:[
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],],
	effect: function (area) {
		//Create stairs
		if (player.y > GetAreaY(area) + 5)
		{
			//Stairs with top on north
			for (var i = 0; i < 5; i++)
			{
				SetTile(area, 5, 3+i, 5-i, PATTERN_EFFECT_BLOCK)
			}
		}
		else
		{
			//Stairs with top on south
			for (var i = 0; i < 5; i++)
			{
				SetTile(area, 5, 3+i, 1+i, PATTERN_EFFECT_BLOCK)
			}
		}
	}
}
var PATTERN_STAIRS_H = {
	pattern:[
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],
		[1, 1, 1, 1, 1],
		[0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0],],
	effect: function (area) {
		//Create stairs
		if (player.x > GetAreaX(area) + 5)
		{
			//Stairs with top on west
			for (var i = 0; i < 5; i++)
			{
				SetTile(area, 3+i, 5, 5-i, PATTERN_EFFECT_BLOCK)
			}
		}
		else
		{
			//Stairs with top on east
			for (var i = 0; i < 5; i++)
			{
				SetTile(area, 3+i, 5, 1+i, PATTERN_EFFECT_BLOCK)
			}
		}
	}
}

var PATTERN_HOLE = {
	pattern:[
		[1, 1, 1, 1, 1],
		[1, 0, 0, 0, 1],
		[1, 0, 0, 0, 1],
		[1, 0, 0, 0, 1],
		[1, 1, 1, 1, 1],],
	effect: function (area) {
		//Create hole
		for (var i = 0; i < 3; i++)
		{
			for (var j = 0; j < 3; j++)
			{
				SetTile(area, 4+i, 4+j, 0, PATTERN_HOLE_BLOCK)
			}
		}
	}
}

var patterns = [PATTERN_STAIRS_V, PATTERN_STAIRS_H, PATTERN_HOLE];

function ActivateAreaPattern (area) {
	if (area.status !== STATUS_DRAWING)
	{
		return;
	}

	var possiblePatterns = patterns.slice(0);
	for (var i = 0; i < 5; i++)
	{
		for (var j = 0; j < 5; j++)
		{
			var areaX = i + 3;
			var areaY = j + 3;
			var areaZ = 0;
			//reverse iteration to because patterns will be removed from this array
			for (var p = possiblePatterns.length - 1; p >= 0; p--)
			{
				var pattern = possiblePatterns[p];
				var patternFailed = false;
				//Use [j][i] because arrays are flipped
				if (pattern.pattern[j][i] === 1)
				{
					if (area.map[areaX][areaY][areaZ] === PATTERN_BLOCK)
					{
						if (area.extraData[areaX][areaY][areaZ].pattern === 1)
						{
							//cool
						}
						else
						{
							//bad: not lit up
							patternFailed = true;
						}
					}
					else
					{
						//bad: not pattern block
						patternFailed = true;
					}
				}
				else
				{
					if (area.map[areaX][areaY][areaZ] === PATTERN_BLOCK)
					{
						if (area.extraData[areaX][areaY][areaZ].pattern === 1)
						{
							//bad: shouldn't be lit up
							patternFailed = true;
						}
					}
				}
				if (patternFailed)
				{
					possiblePatterns.splice(p, 1);
				}
			}
		}
	}
	if (possiblePatterns.length > 0)
	{
		area.status = STATUS_ACTIVE;
		var usePattern = possiblePatterns[0];
		usePattern.effect(area);
	}
	else
	{
		ClearAreaPattern(area);
	}
}

function ClearAreaPattern (area) {
	for (var i = 0; i < area.xSize; i++)
	{
		for (var j = 0; j < area.ySize; j++)
		{
			for (var k = 0; k < area.zSize; k++)
			{
				var tile = area.map[i][j][k];
				if (tile === PATTERN_BLOCK)
				{
					area.extraData[i][j][k].pattern = 0;
				}
				if (tile === PATTERN_EFFECT_BLOCK)
				{
					SetTile(area, i, j, k, EMPTY);
				}
				if (tile === PATTERN_HOLE_BLOCK)
				{
					SetTile(area, i, j, k, PATTERN_BLOCK);
				}
			}
		}
	}
}

function TextToSpeech (text) {
	// Too distracting for right now
	return;
	if (window.SpeechSynthesisUtterance === undefined)
	{
		return;
	}
	var utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "en-US";
	window.speechSynthesis.speak(utterance);
}

//Should care about input z level
function ScreenXToWorldX (screenX, z) {
	return Math.round((screenX - CANVAS_HALF_WIDTH) / GetScale(z));
}

function ScreenYToWorldY (screenY, z) {
	return Math.round((screenY - CANVAS_HALF_HEIGHT) / GetScale(z));
}

var writingMessage = false;
var messageInput = "";
var enterPressed = false;

// document.addEventListener("keypress", DoKeyPress);

function DoKeyPress (e) {
	if (editingValueSpot !== undefined)
	{
		var char = String.fromCharCode(e.keyCode);

		editValue = editValue + char;
	}
	else if (writingMessage)
	{
		if (e.keyCode == 13 && !enterPressed)
		{
			if (messageInput.length == 0)
			{
				writingMessage = false;
				return;
			}
			// Add own message to screen
			AddMessage({text:messageInput, target: player});
			// Send message to server
			if (MULTI_ON)
			{
				SendChatMessage({text:messageInput});
			}

			// TEXT TO SPEECH
			TextToSpeech(messageInput);

			messageInput = "";
			writingMessage = false;
			return;
		}
		var letter = String.fromCharCode(e.keyCode);
		letter = letter.replace(/[^a-zA-Z0-9 \\ \| ! @ # \$ % \^ & \* \( \) \- _ \+ = : ; " ' < > ,\. \? \/ \[ \] \{ \} ]/g, '');
		messageInput += letter;
		return;
	}
}

// document.addEventListener("keydown", DoKeyDown);

function DoKeyDown (e) {
	if (e.keyCode == 8)
	{
		//Backspace - prevent going back a page
		e.preventDefault();
	}
	if (editingValueSpot !== undefined)
	{
		if (e.keyCode === 32)
		{
			//spacebar
			editValue += " ";
			e.preventDefault();
		}
		if (e.keyCode === 8)
		{
			//backspace
			editValue = editValue.slice(0, editValue.length - 1);
		}
		return;
	}
	if (writingMessage)
	{
		if (e.keyCode === 32)
		{
			//spacebar
			messageInput += " ";
			e.preventDefault();
		}
		if (e.keyCode === 8)
		{
			//backspace
			messageInput = messageInput.slice(0, messageInput.length - 1);
		}
		return;
	}
	if (e.keyCode === 13)
	{
		if (!enterPressed)
		{
			writingMessage = true;
			wKey = false;
			aKey = false;
			sKey = false;
			dKey = false;
			upKey = false;
			downKey = false;
			leftKey = false;
			rightKey = false;
		}
		enterPressed = true;
		return;
	}

	else if (e.keyCode === 87)
	{
		wKey = true;
	}
	else if (e.keyCode === 65)
	{
		aKey = true;
	}
	else if (e.keyCode === 83)
	{
		sKey = true;
	}
	else if (e.keyCode === 68)
	{
		dKey = true;
	}
	else if (e.keyCode === 81)
	{
		qKey = true;
	}
	else if (e.keyCode === 69)
	{
		eKey = true;
	}
	else if (e.keyCode === 38)
	{
		upKey = true;
	}
	else if (e.keyCode === 40)
	{
		downKey = true;
	}
	else if (e.keyCode === 37)
	{
		leftKey = true;
	}
	else if (e.keyCode === 39)
	{
		rightKey = true;
	}
	else if (e.keyCode === 32)
	{
		//Spacebar: select next overlapping area
		SelectNextOverlappingArea(player.x, player.y, player.z);
	}
	else if (e.keyCode === 9)
	{
		//Tab: select and jump to next area
		//prevent default because it selects address bar or whatever
		e.preventDefault();
		SelectAndJumpToNextArea();
	}
	else if (e.keyCode === 49)
	{
		// 1
		//start map editor
		if (editorActive)
		{
			EndMapEditor();
		}
		else
		{
			StartMapEditor();
		}
	}
	else if (e.keyCode === 50)
	{
		// 2
		//move areas[6] left

		// BeginAreaMovement(areas[6], -1, 0, 0, 10);

		//create test entity
		testCreateEntityWithRules();
	}
	else if (e.keyCode === 51)
	{
		// 3
		//move areas[6] right

		// BeginAreaMovement(areas[6], 1, 0, 0, 10);
	}

	shiftPressed = e.shiftKey;

	// console.log(e.keyCode);
	mouseMovement = false;
}

// document.addEventListener("keyup", DoKeyUp);

function DoKeyUp (e) {
	if (e.keyCode == 13)
	{
		enterPressed = false;
	}

	if (e.keyCode === 87)
	{
		wKey = false;
	}
	else if (e.keyCode === 65)
	{
		aKey = false;
	}
	else if (e.keyCode === 83)
	{
		sKey = false;
	}
	else if (e.keyCode === 68)
	{
		dKey = false;
	}
	else if (e.keyCode === 81)
	{
		qKey = false;
	}
	else if (e.keyCode === 69)
	{
		eKey = false;
	}
	else if (e.keyCode === 38)
	{
		upKey = false;
	}
	else if (e.keyCode === 40)
	{
		downKey = false;
	}
	else if (e.keyCode === 37)
	{
		leftKey = false;
	}
	else if (e.keyCode === 39)
	{
		rightKey = false;
	}
	shiftPressed = e.shiftKey;
}

var mButton;

// window.addEventListener("mousedown", DoMouseDown);

function DoMouseDown (e) {
	//e.preventDefault();

	mouseX = e.clientX;
	mouseY = e.clientY;
	mousePressed = true;
	mButton = e.button;
	if (editorActive)
	{
		EditorMouseDown();
		return;
	}
	else
	{
		var result = RegularMouseDown();
		if (result === false)
		{
			return;
		}
	}
	mouseTilesX = ScreenXToWorldX(mouseX, player.z - 1);
	mouseTilesY = ScreenYToWorldY(mouseY, player.z - 1);
	
	mouseMovement = true;

}

// window.addEventListener("mousemove", DoMouseMove);

function DoMouseMove (e) {
	e.preventDefault();
	
	mouseX = e.clientX;
	mouseY = e.clientY;
	if (editorActive)
	{
		EditorMouseMove();
		return;
	}
}

// window.addEventListener("mouseup", DoMouseUp);

function DoMouseUp (e) {
	e.preventDefault();
	
	mouseX = e.clientX;
	mouseY = e.clientY;
	mousePressed = false;
	if (e.button === 1)
	{
		middleClick = false;
	}
	if (editorActive)
	{
		EditorMouseUp();
		return;
	}
}

// window.addEventListener("mousewheel", DoMouseWheel);

function DoMouseWheel (e) {
	e.preventDefault();
	if (!editorActive)
	{
		return;
	}
	if (e.deltaY > 0)
	{
		player.z += 1;
	}
	else if (e.deltaY < 0)
	{
		player.z -= 1;
	}
	if (e.deltaX > 0)
	{
		player.z += 5;
	}
	else if (e.deltaX < 0)
	{
		player.z -= 5;
	}
}

// window.addEventListener("resize", DoResize);

function DoResize (e) {
	ResizeCanvas();
}

function ResizeCanvas () {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	CANVAS_WIDTH = canvas.width;
	CANVAS_HEIGHT = canvas.height;
	CANVAS_HALF_WIDTH = CANVAS_WIDTH / 2;
	CANVAS_HALF_HEIGHT = CANVAS_HEIGHT / 2;
}

// document.addEventListener("contextmenu", DoContextMenu);

function DoContextMenu (e) {
	e.preventDefault();
}

function SelectNextOverlappingArea (atX, atY, atZ) {
	if (!shiftPressed)
	{
		//Forwards (no shift)
		if (selectedArea !== undefined && LocationInArea(selectedArea, player.x, player.y, player.z))
		{
			//Select next overlapping area, starting from the current selected area
			for (var i = areas.indexOf(selectedArea) + 1; i < areas.length; i++)
			{
				var area = areas[i];
				if (LocationInArea(area, atX, atY, atZ))
				{
					selectedArea = area;
					return;
				}
			}
			//and then looping around from the start again
			for (var i = 0; i < areas.indexOf(selectedArea); i++)
			{
				var area = areas[i];
				if (LocationInArea(area, atX, atY, atZ))
				{
					selectedArea = area;
					return;
				}
			}

		}
		//select first overlapping area
		for (var i = 0; i < areas.length; i++)
		{
			var area = areas[i];
			if (LocationInArea(area, atX, atY, atZ))
			{
				selectedArea = area;
				return;
			}
		}
	}
	else
	{
		//Backwards (Shift)
		if (selectedArea !== undefined && LocationInArea(selectedArea, player.x, player.y, player.z))
		{
			//Select prev overlapping area, starting from currently selected area
			for (var i = areas.indexOf(selectedArea) - 1; i >= 0; i--)
			{
				var area = areas[i];
				if (LocationInArea(area, atX, atY, atZ))
				{
					selectedArea = area;
					return;
				}
			}
			//and then looping around from the end
			for (var i = areas.length - 1; i > areas.indexOf(selectedArea); i--)
			{
				var area = areas[i];
				if (LocationInArea(area, atX, atY, atZ))
				{
					selectedArea = area;
					return;
				}
			}
		}
		//select last overlapping area
		for (var i = areas.length - 1; i >= 0; i--)
		{
			var area = areas[i];
			if (LocationInArea(area, atX, atY, atZ))
			{
				selectedArea = area;
				return;
			}
		}
	}
	//no area to select, clear selection 
	selectedArea = undefined;
}

function SelectAndJumpToNextArea () {
	var prevIndex = areas.indexOf(selectedArea);
	if (!shiftPressed)
	{
		//forwards (no shift)
		if (prevIndex + 1 >= areas.length)
		{
			//loop to start
			selectedArea = areas[0];
		}
		else
		{
			//Go to next area
			selectedArea = areas[prevIndex + 1]
		}
	}
	else
	{
		//backwards (shift)
		if (prevIndex <= 0)
		{
			//loop to end
			selectedArea = areas[areas.length - 1];
		}
		else
		{
			//Go to previous area
			selectedArea = areas[prevIndex - 1];
		}
	}
	if (selectedArea !== undefined)
	{
		//Jump the player to the new selected area (if it exists)
		player.x = selectedArea.x;
		player.y = selectedArea.y;
		player.z = selectedArea.z;
	}
}

function EditTile (editX, editY, editZ, tile) {
	//Target area is either first area containing this tile, or the selected area if it contains this tile
	ActualEditTile(editX, editY, editZ, tile);
	if (MULTI_ON)
	{
		SendTileChange({editX:editX, editY:editY, editZ:editZ, tile:tile});
	}
}
function ActualEditTile (editX, editY, editZ, tile) {
	var targetArea;
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (LocationInArea(area, editX, editY, editZ))
		{
			if (area === selectedArea)
			{
				//Selected area: affect
				SetTile(area, editX - area.x, editY - area.y, editZ - area.z, tile);
				return;
			}
			else if (targetArea === undefined)
			{
				targetArea = area;
			}
		}
	}
	if (targetArea !== undefined)
	{
		SetTile(targetArea, editX - targetArea.x, editY - targetArea.y, editZ - targetArea.z, tile);
	}
}

function CreateArea (x, y, z, xSize, ySize, zSize) {
	ActualCreateArea(x, y, z, xSize, ySize, zSize);
	if (MULTI_ON)
	{
		SendCreateArea({x: x, y: y, z: z, xSize: xSize, ySize: ySize, zSize: zSize});
	}
}
function ActualCreateArea (x, y, z, xSize, ySize, zSize) {
	var newArea = new Area(x, y, z, xSize, ySize, zSize);
	areas.push(newArea);
	drawObjects.push(newArea);
	return newArea;
}

function RemoveAreaAt (x, y, z) {
	ActualRemoveAreaAt(x, y, z);
	if (MULTI_ON)
	{
		SendRemoveArea({x: x, y: y, z: z});
	}
}

function ActualRemoveAreaAt (x, y, z) {
 	for (var i = 0; i < areas.length; i++)
 	{
 		var area = areas[i];
 		if (LocationInArea(area, x, y, z))
 		{
 			drawObjects.splice(drawObjects.indexOf(area), 1);
 			areas.splice(areas.indexOf(area), 1);
 			return; //Only remove 1 area at a time
 		}
 	}
}

function ResizeAreaTo (x, y, z) {
 	for (var i = 0; i < areas.length; i++)
 	{
 		var area = areas[i];
 		if (LocationInArea(area, x, y, z))
 		{
 			area.xSize = x - area.x + 1;
 			area.ySize = y - area.y + 1;
 			area.zSize = z - area.z + 1;
 		}
 	}
}

function RemoveEntity (entity) {
	drawObjects.splice(drawObjects.indexOf(entity), 1);
	entities.splice(entities.indexOf(entity), 1);
}

function RegularMouseDown () {
	if (mouseX > CANVAS_WIDTH - 200)
	{
		//mouse is in the button menu part of screen
		var buttonNum = Math.floor((mouseY - 5) / 60);
		switch (buttonNum)
		{
			case 0:
				// Enter Editor
				StartMapEditor();
				return false;
			break;
		}
	}
}


var lastEditedX;
var lastEditedY;
var lastEditedZ;

var editType = SOLID;
var editTypeL = SOLID;
var editTypeR = EMPTY;

var lastAreaTime = 0;

function EditorMouseDown () {
	if (mouseX < 70)
	{
		// mouse is in tile selection part of screen
		var tileNum = Math.floor((mouseY - 5) / 60);
		if (mButton === 0)
		{
			editTypeL = tileNum;
		}
		if (mButton === 2)
		{
			editTypeR = tileNum;
		}
		return;
	}
	else if (mouseX > CANVAS_WIDTH - 200)
	{
		//mouse is in the button menu part of screen
		var buttonNum = Math.floor((mouseY - 5) / 60);
		switch (buttonNum)
		{
			case 0: 
				// Exit Editor
				EndMapEditor();
			break;
			case 1:
				// Create Area
				var currentTime = Date.now()
				if (currentTime - lastAreaTime > 1000)
				{
					if (shiftPressed)
					{
						CreateArea(player.x, player.y, player.z, 10, 10, 10);
					}
					else
					{
						CreateArea(player.x, player.y, player.z, 5, 5, 5);
					}
					lastAreaTime = currentTime;
				}
			break;
			case 2:
				// Remove Area
				RemoveAreaAt(player.x, player.y, player.z);
			break;
			case 3:
				// Resize Area
				ResizeAreaTo(player.x, player.y, player.z)
			break;
			case 4:
				// Load Level
				ImportLevel(LoadFromLocalStorage("level1"));
			break;
			case 5:
				// Save Level
				SaveToLocalStorage(ExportLevel(), "level1");
			break;
			case 6:
				// New Entity
				var entitiesHere = EntitiesAtCoordinatesNotPlayer(player.x, player.y, player.z);
				if (entitiesHere.length === 0)
				{
					var newEntity = CreateEntity(player.x, player.y, player.z);
				}
				else
				{
					console.log("Coordinates occupied by existing entity")
				}
			break;
			case 7:
				// Remove Entity
				var entitiesHere = EntitiesAtCoordinatesNotPlayer(player.x, player.y, player.z);
				if (entitiesHere.length >= 1)
				{
					var thisEntity = entitiesHere[0];
					if (thisEntity === currentEntity)
					{
						editingEntity = false;
						currentEntity = undefined;
					}
					RemoveEntity(thisEntity);
				}
			break;
			case 8:
				// Edit Entity / Done Editing
				if (editingEntity)
				{
					editingEntity = false;
					currentEntity = undefined;
					editingEntityMode = E_MODE_NORMAL;
					editingEntitySpot = undefined;
					editingValueSpot = undefined;
				}
				else
				{
					var entitiesHere = EntitiesAtCoordinatesNotPlayer(player.x, player.y, player.z);
					if (entitiesHere.length >= 1)
					{
						var thisEntity = entitiesHere[0];
						editingEntity = true;
						currentEntity = thisEntity;
					}
				}
			break;

		}

		return;
	}
	else if (editingEntity)
	{
		// Mouse isn't on left or right side of screen and entity editor window is open

		// Normal mode
		if (editingEntityMode === E_MODE_NORMAL)
		{
			if (ruleHoverSpot !== undefined && ruleHoverMode !== E_MODE_NORMAL)
			{
				editingEntitySpot = ruleHoverSpot;
				editingEntityMode = ruleHoverMode;
			}
		}
		// Selecting a trigger to add
		else if (editingEntityMode === E_MODE_CHOOSE_TRIGGER)
		{
			// Click "Cancel"
			if (ruleHoverMode === E_MODE_NORMAL && ruleHoverSpot === -1)
			{
				editingEntityMode = E_MODE_NORMAL;
			}
			// Hovering over a trigger
			else if (ruleHoverSpot !== undefined)
			{
				// Create a trigger
				if (triggersValue[ruleHoverSpot])
				{
					var newTrigger = {
						trigger: ruleHoverSpot,
						trigValues: JSON.parse(JSON.stringify(triggersValue[ruleHoverSpot])),
						eventBlock: [],
					}
					editingEntitySpot.push(newTrigger);
					editingEntitySpot = undefined;
					editingEntityMode = E_MODE_NORMAL;
				}
			}
		}
		// Selecting a condition or result to add
		else if (editingEntityMode === E_MODE_CHOOSE_RULE)
		{
			// Click "Cancel"
			if (ruleHoverMode === E_MODE_NORMAL)
			{
				editingEntityMode = E_MODE_NORMAL;
			}
			// Hovering over a condition or result
			else if (ruleHoverSpot !== undefined)
			{
				// Create a condition
				if (conditionsValue[ruleHoverSpot] !== undefined)
				{
					var newCondition = {
						condition: ruleHoverSpot,
						condValues: JSON.parse(JSON.stringify(conditionsValue[ruleHoverSpot])),
						trueBlock: [],
						falseBlock: [],
					};
					editingEntitySpot.push(newCondition);
					editingEntitySpot = undefined;
					editingEntityMode = E_MODE_NORMAL;
				}
				// Create a result
				else if (resultsValue[ruleHoverSpot] !== undefined)
				{
					var newResult = {
						result: ruleHoverSpot,
						resValues: JSON.parse(JSON.stringify(resultsValue[ruleHoverSpot])),
					};
					editingEntitySpot.push(newResult);
					editingEntitySpot = undefined;
					editingEntityMode = E_MODE_NORMAL;
				}
			}
		}
		else if (editingEntityMode === E_MODE_EDIT_RULE)
		{
			// Currently editing a value and clicked "done"
			if (editingValueSpot !== undefined && ruleHoverMode === E_MODE_NORMAL)
			{
				if (editValueType === "number")
				{
					editValue = Number(editValue);
					if (isNaN(editValue))
					{
						editValue = 0;
					}
				}
				if (editingEntitySpot.trigValues)
				{
					editingEntitySpot.trigValues[editingValueSpot] = editValue;
				}
				else if (editingEntitySpot.condValues)
				{
					editingEntitySpot.condValues[editingValueSpot] = editValue;
				}
				else if (editingEntitySpot.resValues)
				{
					editingEntitySpot.resValues[editingValueSpot] = editValue;
				}
				editValue = undefined
				editingValueSpot = undefined;
			}
			// Not editing a value and clicked "done"
			else if (ruleHoverMode === E_MODE_NORMAL)
			{
				editingEntityMode = E_MODE_NORMAL;
			}
			// Clicked on a valid spot and not currently editing a value -> Start editing that value
			else if (ruleHoverSpot !== undefined && editingValueSpot === undefined)
			{
				editingValueSpot = ruleHoverSpot;
				editValue = undefined;
				if (editingEntitySpot.trigValues)
				{
					editValue = editingEntitySpot.trigValues[editingValueSpot];
				}
				else if (editingEntitySpot.condValues)
				{
					editValue = editingEntitySpot.condValues[editingValueSpot];
				}
				else if (editingEntitySpot.resValues)
				{
					editValue = editingEntitySpot.resValues[editingValueSpot];
				}
				editValueType = typeof editValue;
			}
		}
	}
	else
	{
		var editX = ScreenXToWorldX(mouseX, GetEntityZ(player)) + Math.round(GetEntityX(player));
		var editY = ScreenYToWorldY(mouseY, GetEntityZ(player)) + Math.round(GetEntityY(player));
		var editZ = Math.round(GetEntityZ(player));

		lastEditedX = editX;
		lastEditedY = editY;
		lastEditedZ = editZ;

		if (mButton === 1)
		{
			//Middle mouse drag
			mousePressed = false;
			middleClick = true;
			midStartX = mouseX;
			midStartY = mouseY;
		}
		else
		{
			if (mButton === 0)
			{
				editType = editTypeL;
			}
			if (mButton === 2)
			{
				editType = editTypeR;
			}

			EditTile(editX, editY, editZ, editType);
		}
	}
	
	
	
}

function EditorMouseMove () {
	if (editingEntity)
	{
		return;
	}
	if (mButton === 1)
	{
		player.x = Math.round(xCam - 0.5);
		player.y = Math.round(yCam - 0.5);
	}
	if (mousePressed)
	{
		var editX = ScreenXToWorldX(mouseX, GetEntityZ(player)) + Math.round(GetEntityX(player));
		var editY = ScreenYToWorldY(mouseY, GetEntityZ(player)) + Math.round(GetEntityY(player));
		var editZ = Math.round(GetEntityZ(player));

		if (lastEditedX !== editX || lastEditedY !== editY || lastEditedZ !== editZ)
		{
			lastEditedX = editX;
			lastEditedY = editY;
			lastEditedZ = editZ;

			EditTile(editX, editY, editZ, editType);
		}
	}
}

function EditorMouseUp () {
	if (mButton === 1)
	{
		player.x = Math.round(xCam - 0.5);
		player.y = Math.round(yCam - 0.5);
	}
	lastAreaTime = 0;
}

// mix: 0 = color0, 1 = color1
function ColorBlend (color0, color1, mix) {
	var r0 = parseInt(color0.slice(1, 3), 16);
	var g0 = parseInt(color0.slice(3, 5), 16);
	var b0 = parseInt(color0.slice(5, 7), 16);
	var r1 = parseInt(color1.slice(1, 3), 16);
	var g1 = parseInt(color1.slice(3, 5), 16);
	var b1 = parseInt(color1.slice(5, 7), 16);
	var rm = Math.round((r0 * (1 - mix) + r1 * mix)).toString(16);
	var gm = Math.round((g0 * (1 - mix) + g1 * mix)).toString(16);
	var bm = Math.round((b0 * (1 - mix) + b1 * mix)).toString(16);
	rm = (rm.length === 2) ? rm : "0" + rm;
	gm = (gm.length === 2) ? gm : "0" + gm;
	bm = (bm.length === 2) ? bm : "0" + bm;
	
	return "#" + rm + gm + bm;
}

function GenerateColorPalette (numColors) {
	var rFrq = 1.66;
	var gFrq = 2.66;
	var bFrq = 4.66;
	var start = Math.random() * Math.PI;
	var starti = Math.round(Math.random() * 20) + 10;
	var colors = [];
	for (var i = starti; i < starti + numColors; i++)
	{
		var r = Math.sin(start + rFrq * i) * 100 + 155;
		var g = Math.sin(start + gFrq * i) * 100 + 155;
		var b = Math.sin(start + bFrq * i) * 100 + 155;
		var rm = Math.round(r).toString(16);
		var gm = Math.round(g).toString(16);
		var bm = Math.round(b).toString(16);
		rm = (rm.length === 2) ? rm : "0" + rm;
		gm = (gm.length === 2) ? gm : "0" + gm;
		bm = (bm.length === 2) ? bm : "0" + bm;
		colors.push("#" + rm + gm + bm); 
	}
	return colors;
}

function RandomBrightColor () {
	var vv = Math.random() * 500 + 200;
	var rf = Math.random(); var rr = rf;
	var gf = Math.random(); var gg = gf;
	var bf = Math.random(); var bb = bf;
	if (rf < gf - 0.3 || rf < bf - 0.3) { rr *= 0.3; }
	if (gf < rf - 0.3 || gf < bf - 0.3) { gg *= 0.3; }
	if (bf < gf - 0.3 || bf < rf - 0.3) { bb *= 0.3; }
	var tt = 1 / (rr + gg + bb);
	var r = tt * vv * rr
}

function RandomColor () {
	return "#" + Math.round(Math.random() * 0xFFFFFF).toString(16);
}

function StartMapEditor () {
	// Uncomment to lock editing
	// return;
	editorActive = true;
}
function EndMapEditor () {
	editorActive = false;
	editingEntity = false;
	currentEntity = undefined;
	while (IsSolidE(player))
	{
		// Move player up so they can stay on top of edited layer
		player.z += 1;
	}
	player.lastSafeCoord.x = player.x;
	player.lastSafeCoord.y = player.y;
	player.lastSafeCoord.z = player.z;
	player.fallTime = -20;
}

function ClearLevel () {
	currentEntity = undefined;
	editingEntity = false;
	areas = [];
	drawObjects = [];
	entities = [];
	areaColors = [];

	InitGame();

}

function ImportLevel (levelData) {
	//import a levelData string into the current level
	var importedData = JSON.parse(levelData);
	if (importedData === null)
	{
		console.log("null levelData");
		return;
	}
	ClearLevel();

	for (var i = 0; i < importedData.areas.length; i++)
	{
		var areaData = importedData.areas[i];
		var newArea = new Area(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize, true, areaData.map);
		areas.push(newArea);
		drawObjects.push(newArea);
	}
	for (var i = 0; i < importedData.entities.length; i++) {
		var entityData = importedData.entities[i];
		var newEntity = new Entity(entityData.x, entityData.y, entityData.z);
		newEntity.rules = entityData.rules;
		entities.push(newEntity);
		drawObjects.push(newEntity)
	}
	player = new Entity(importedData.player.x, importedData.player.y, importedData.player.z);
	entities.push(player);
	drawObjects.push(player);
	InitGame();
}

function ExportLevel () {
	//export the current level to a levelData string
	var levelData = {areas:[], entities:[], player:{x: player.x, y: player.y, z: player.z}};
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		var areaDataObj = {
			x: area.x,
			y: area.y,
			z: area.z,
			xSize: area.xSize,
			ySize: area.ySize,
			zSize: area.zSize,
			map: area.map,
			rules: 0,
		};
		levelData.areas.push(areaDataObj); 
	}
	for (var i = 0; i < entities.length; i++)
	{
		var entity = entities[i];
		if (entity !== player)
		{
			var entityDataObj = {
				x: entity.x,
				y: entity.y,
				z: entity.z,
				rules: entity.rules,
			};
			levelData.entities.push(entityDataObj)
		}
	}
	return JSON.stringify(levelData);
}

function SaveToLocalStorage (levelData, levelName) {
	localStorage.setItem(levelName, levelData);
}

function LoadFromLocalStorage (levelName) {
	return localStorage.getItem(levelName);
}

// ░░░░░░░░░░░░▄▐ 
// ░░░░░░▄▄▄░░▄██▄ 
// ░░░░░▐▀█▀▌░░░░▀█▄ 
// ░░░░░▐█▄█▌░░░░░░▀█▄ 
// ░░░░░░▀▄▀░░░▄▄▄▄▄▀▀ 
// ░░░░▄▄▄██▀▀▀▀ 
// ░░░█▀▄▄▄█░▀▀ 
// ░░░▌░▄▄▄▐▌▀▀▀ 
// ▄░▐░░░▄▄░█░▀▀ U HAVE BEEN SPOOKED BY THE 
// ▀█▌░░░▄░▀█▀░▀ 
// ░░░░░░░▄▄▐▌▄▄ 
// ░░░░░░░▀███▀█░▄ 
// ░░░░░░▐▌▀▄▀▄▀▐▄ SPOOKY SKILENTON 
// ░░░░░░▐▀░░░░░░▐▌ 
// ░░░░░░█░░░░░░░░█ 
// ░░░░░▐▌░░░░░░░░░█ 
// ░░░░░█░░░░░░░░░░▐▌


var TRIGGERS = {
	PLAYER_STEPS_ADJACENT: 100,
};
var triggersText = {};
var triggersValue = {};
triggersText[TRIGGERS.PLAYER_STEPS_ADJACENT] = "Player steps adjacent";
triggersValue[TRIGGERS.PLAYER_STEPS_ADJACENT] = {};

var CONDITIONS = {
	PLAYER_HAS_ORBS: 200,
};
var conditionsText = {};
var conditionsValue = {};
conditionsText[CONDITIONS.PLAYER_HAS_ORBS] = "Player has at least X orbs";
conditionsValue[CONDITIONS.PLAYER_HAS_ORBS] = {orbsNeeded: 0};

var RESULTS = {
	SAY_MESSAGE: 300,
};
var resultsText = {};
var resultsValue = {};
resultsText[RESULTS.SAY_MESSAGE] = "Say a message";
resultsValue[RESULTS.SAY_MESSAGE] = {message: "Default text"};



function SendTrigger (entity, triggerType) {
	for (var i = 0; i < entity.rules.length; i++)
	{
		var rule = entity.rules[i]
		if (rule.trigger === triggerType)
		{
			ApplyRule(entity, rule);
		}
	}
}

function ApplyRule (entity, rule) {
	// Apply result if at end of chain
	if (rule.result)
	{
		// rule.resValues can be undefined
		ApplyEndResult(entity, rule.result, rule.resValues);
		return true;
	}

	// Determine which block to go to next
	var pendingBlock = undefined;
	if (rule.eventBlock !== undefined)
	{
		pendingBlock = rule.eventBlock;
	}
	if (rule.condition)
	{
		// rule.condValues can be undefined
		if (CheckCondition(entity, rule.condition, rule.condValues))
		{
			if (rule.trueBlock !== undefined)
			{
				pendingBlock = rule.trueBlock;
			}
		}
		else
		{
			if (rule.falseBlock !== undefined);
			{
				pendingBlock = rule.falseBlock;
			}
		}
	}
	if (pendingBlock !== undefined)
	{
		// Go to chosen block and apply all rules inside it
		for (var i = 0; i < pendingBlock.length; i++)
		{
			var pBlock = pendingBlock[i];
			ApplyRule(entity, pBlock);
		}
	}
}

function CheckCondition (entity, condition, values) {
	if (values === undefined)
	{
		values = {};
	}
	switch (condition)
	{
		case CONDITIONS.PLAYER_HAS_ORBS:
			if (values.orbsNeeded === undefined)
			{
				throw "missing values.orbsNeeded";
				return false;
			}
			if (orbsCollected >= values.orbsNeeded)
			{
				return true;
			}
		break;
	}
	return false;
}

function ApplyEndResult (entity, result, values) {
	if (values === undefined)
	{
		values = {};
	}
	switch (result)
	{
		case RESULTS.SAY_MESSAGE:
			if (values.message === undefined)
			{
				throw "missing values.message";
				return false;
			}
			new Message (values.message, entity, MESG_TARGET_ENTITY);
			return true;
		break;
	}
}

function testCreateEntityWithRules () {
	var newEntity = CreateEntity(player.x + 2, player.y, player.z);
	newEntity.rules = [
		{
			trigger: TRIGGERS.PLAYER_STEPS_ADJACENT,
			trigValues: {},
			eventBlock: [
				{
					condition: CONDITIONS.PLAYER_HAS_ORBS,
					condValues: {orbsNeeded: 3},
					trueBlock: [
						{
							condition: CONDITIONS.PLAYER_HAS_ORBS,
							condValues: {orbsNeeded: 6},
							trueBlock: [
								{
									result: RESULTS.SAY_MESSAGE,
									resValues: {message: "Wow! 6 (or more) orbs!"}
								}
							],
							falseBlock: [
								{
									result: RESULTS.SAY_MESSAGE,
									resValues: {message: "Good job getting the orbs!"}
								}
							]
						}
					],
					falseBlock: [
						{
							result: RESULTS.SAY_MESSAGE,
							resValues: {message: "Please get 3 orbs!"}
						},
						{
							result: RESULTS.SAY_MESSAGE,
							resValues: {message: "..."}
						}
					]
				}
			]
		}
	]
}

