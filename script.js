//Bine puzzle game copyright Mark Foster 2015

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var CANVAS_WIDTH = 600;
var CANVAS_HEIGHT = 600;

var CANVAS_HALF_WIDTH = 300;
var CANVAS_HALF_HEIGHT = 300;

var EYE_DISTANCE = 45;
var SCALE_MULTIPLIER = 490;
var Z_MULTIPLIER = 3.1;
var TILE_SIZE = 5.4;




var wKey;
var aKey;
var sKey;
var dKey;

var qKey;
var eKey;

var xCam = 0;
var yCam = 0;
var zCam = 0;

var edgeSquareLimit = {active:false, x: 300, y: 300, xSize: 0, ySize: 0}


var MOVEMENT_CHANGE_WINDOW = 3;

var EMPTY = 0;
var SOLID = 1;
var DISAPPEAR_BLOCK = 2;
var APPEAR_BLOCK = 3;

var areas = [];
var entities = [];
var drawObjects = [];

function CreateEntity () {
	var newEntity = new Entity (16, 5, 4);
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
}

var player = CreateEntity();

function CreateArea () {
	var newArea = new Area(0, 0, 0, 11, 11, 10);
	areas.push(newArea);
	drawObjects.push(newArea);
	return newArea;
}

function Area (x, y, z, xSize, ySize, zSize) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.xSize = xSize;
	this.ySize = ySize;
	this.zSize = zSize;
	this.extraData = [];
	this.map = [];
	for (var i = 0; i < xSize; i++)
	{
		this.map.push([]);
		this.extraData.push([]);
		for (var j = 0; j < ySize; j++)
		{
			this.map[i].push([]);
			this.extraData[i].push([]);
			for (var k = 0; k < zSize; k++)
			{
				var tile = EMPTY;

				if (areas.length === 0)
				{
					//stairs room with right side open
					if (i%11 === 0 || j%10 === 0 || k === 0)
					{
						tile = SOLID;
					}
					if (i === 5 && j > k && k !== 0 && j !== 10)
					{
						tile = APPEAR_BLOCK;
					}
					if (i === 8 &&  k !== 0 && j !== 10 && j !== 0 && k < 4)
					{
						tile = DISAPPEAR_BLOCK;
					}
				}
				else if (areas.length === 1)
				{
					//Valley
					if (k === Math.abs(i - 5))
					{
						tile = APPEAR_BLOCK;
					}
				}
				else if (areas.length === 2)
				{
					//some pillars room
					if (j === 0 || j === 10 || i === 10 || k === 0)
					{
						tile = SOLID;
					}
					if ((i-j)%3 === 0 && (i+j)/2-0>k)
					{
						tile = APPEAR_BLOCK;
					}
				}
				else
				{
					//narrow walkway room
					if ((i === 4 || i === 5 || i === 6) && k === 4 || ((i === 2 || i === 8) && j%5 === 2))
					{
						tile = SOLID;
					}
				}
				var extra;
				switch (tile)
				{
					default:
						this.extra = {};
					break
					case APPEAR_BLOCK:
						this.extra = {opacity: 0};
					break;
					case DISAPPEAR_BLOCK:
						this.extra = {opacity: 1};
					break;
				}
				this.extraData[i][j].push(extra);
				this.map[i][j].push(tile);
			}
		}
	}
}

function Init () {
	window.requestAnimationFrame(Update);
	CreateArea();
	CreateArea(); areas[1].x = 11; areas[1].z = -5;
	CreateArea(); areas[2].x = 22;
	CreateArea(); areas[3].y = 11; areas[3].z = 5;
	CreateArea(); areas[4].y = 22; areas[4].z = 5;
	CreateArea(); areas[5].y = 33; areas[5].z = 5;
	CreateArea(); areas[6].y = 44; areas[6].z = 5;
	

}

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


	Control();
	Render();

	//Stats
	delay = (new Date - lastTime);
	totalDelay += delay;
	frameCount ++;
	lastTime = new Date;
}

function Control () {
	//Move delay greater than 0 -> in the process of moving
	if (player.moveDelay > 0)
	{
		player.moveDelay --;

		//Done with this movement
		if (player.moveDelay <= 0)
		{
			player.x += player.xMov;
			player.y += player.yMov;
			player.z += player.zMov;
			player.xMov = 0;
			player.yMov = 0;
			player.zMov = 0;
		}
		else
		{
			if (player.moveDelay > player.delayTime - MOVEMENT_CHANGE_WINDOW && IsSolidEOffset(player, 0, 0, -1))
			{
				var movementChanged = false;
				// Allow diagonal movement within a few frames
				if (wKey && player.yMov === 0)
				{
					player.yMov = -1;
					movementChanged = true;
				}
				if (sKey && player.yMov === 0)
				{
					player.yMov = 1;
					movementChanged = true;
				}
				if (aKey && player.xMov === 0)
				{
					player.xMov = -1;
					movementChanged = true;
				}
				if (dKey && player.xMov === 0)
				{
					player.xMov = 1;
					movementChanged = true;
				}
				// Allow canceling movement by releasing key or pressing opposite
				if (player.yMov === -1 && (!wKey || sKey))
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
				if (player.yMov === 1 && (!sKey || wKey))
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
				if (player.xMov === -1 && (!aKey || dKey))
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
				if (player.xMov === 1 && (!dKey || aKey))
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
				if (movementChanged)
				{
					player.zMov = 0;
					MovementXYRules(player);
				}
			}
			return;
		}
	}
	if (IsSolidEOffset(player, 0, 0, -1))
	{
		//Solid ground below player - can move
		if (wKey && !sKey)
		{
			player.yMov = -1;
			SetMoveDelay(player, 10);
		}
		if (sKey && !wKey)
		{
			player.yMov = 1;
			SetMoveDelay(player, 10);
		}
		if (aKey && !dKey)
		{
			player.xMov = -1;
			SetMoveDelay(player, 10);
		}
		if (dKey && !aKey)
		{
			player.xMov = 1;
			SetMoveDelay(player, 10);
		}
		MovementXYRules(player);
	}
	else
	{
		//Fall down
		player.xMov = 0;
		player.yMov = 0;
		player.zMov = -1;
		SetMoveDelay(player, 2);
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
	
	if (!aboveSolid || !levelSolid)
	{
		return true;
	}
	return false;
}

function MovementZRules (entity) {
	var aboveSolid = IsSolidEMovOffset(entity, 0, 0, 1);
	var levelSolid = IsSolidEMovOffset(entity, 0, 0, 0);
	var belowSolid = IsSolidEMovOffset(entity, 0, 0, -1);

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
			//upwards movement
			entity.zMov = 1;
		}
	}
	else if (!belowSolid)
	{
		//downwards movement
		entity.zMov = -1;
	}
	//otherwise: level movement
}

function Render () {
	canvas.width = canvas.width;

	xCam = (xCam * 4 + GetEntityX(player) + 0.5) * 0.2;
	yCam = (yCam * 4 + GetEntityY(player) + 0.5) * 0.2;
	zCam = (zCam * 4 + GetEntityZ(player)) * 0.2;

	ctx.strokeStyle = "#FFFFFF";
	ctx.fillStyle = "#101010";

	numSquares = 0;
	DrawAllObjects();

	if (edgeSquareLimit.active)
	{
		edgeSquareLimit.x -= 3;
		edgeSquareLimit.y -= 3;
		edgeSquareLimit.xSize += 6;
		edgeSquareLimit.ySize += 6;
		if (edgeSquareLimit.xSize > CANVAS_WIDTH + 300)
		{
			edgeSquareLimit.active = false;
		}
		edgeSquareLimit.x = 10;
		edgeSquareLimit.xSize = 580;
		edgeSquareLimit.y = 10;
		edgeSquareLimit.ySize = 580;
	}

	if (showStats)
	{
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, 100, 200)

		ctx.strokeStyle = "#800000";
		ctx.strokeText("delay:", 5, 20);
		ctx.strokeText(delay, 70, 20);
		ctx.strokeText("avg delay:", 5, 40);
		ctx.strokeText(Math.round(totalDelay / frameCount), 70, 40);
		ctx.strokeText("squares:", 5, 60);
		ctx.strokeText(numSquares, 70, 60);

		ctx.strokeStyle = "#008000";
		ctx.strokeText("X(player):", 5, 80);
		ctx.strokeText(GetEntityX(player), 70, 80);
		ctx.strokeText("Y(player):", 5, 100);
		ctx.strokeText(GetEntityY(player), 70, 100);
		ctx.strokeText("Z(player):", 5, 120);
		ctx.strokeText(GetEntityZ(player), 70, 120);
	}
}

function GetEntityX (entity) {
	return entity.x + entity.xMov * (entity.delayTime - entity.moveDelay) / entity.delayTime;
}

function GetEntityY (entity) {
	return entity.y + entity.yMov * (entity.delayTime - entity.moveDelay) / entity.delayTime;
}

function GetEntityZ (entity) {
	return entity.z + entity.zMov * (entity.delayTime - entity.moveDelay) / entity.delayTime;
}

function GetScale (z) {
	return -(TILE_SIZE / ( Z_MULTIPLIER * (z - zCam) - EYE_DISTANCE)) * SCALE_MULTIPLIER;
}

/*function GetScale (z) {
	return -(Math.atan(TILE_SIZE / ( Z_MULTIPLIER * (z - zCam) - EYE_DISTANCE))) * SCALE_MULTIPLIER;
}*/

function DrawAllObjects () {
	if (drawObjects.length === 0)
	{
		//no objects to draw
		return;
	}
	drawObjects.sort(function (a, b) {return a.z - b.z;});
	var bottomZ = drawObjects[0].z;
	var topZ = drawObjects[drawObjects.length - 1].z;
	var bottomI = 0;
	for (var i = 0; i < drawObjects.length; i++)
	{
		if (drawObjects[i] instanceof Area)
		{
			//Only areas can have a higher z than the last object
			topZ = Math.max(topZ, drawObjects[i].z + drawObjects[i].zSize);
		}
	}
	for (var z = bottomZ; z <= topZ; z++)
	{
		var i = bottomI;
		var currentObject = drawObjects[i];

		//Loop through objects, stopping when no more objects or next object is above currentZ
		while (currentObject !== undefined && currentObject.z <= z)
		{
			if (DObjInZ(currentObject, z))
			{
				DrawDObjZ(currentObject, z);
			}

			//move bottomI up when possible
			if (i === bottomI)
			{
				if (currentObject instanceof Entity)
				{
					if (z > currentObject.z)
					{
						bottomI ++;
					}
				}
				else if (currentObject instanceof Area)
				{
					if (z > currentObject.z + currentObject.zSize)
					{
						bottomI ++;
					}
				}
			}
			


			i ++;
			currentObject = drawObjects[i];
		}
	}
	//debugger;
}

//Draw Object in Z: returns true if the object should be drawn at the given z
function DObjInZ (dObj, z) {
	if (dObj instanceof Entity)
	{
		return Math.ceil(GetEntityZ(dObj)) === z;
	}
	if (dObj instanceof Area)
	{
		return (dObj.z <= z && dObj.z + dObj.zSize > z);
	}
}

//Entity - DrawEntity
//Area - DrawAreaZSlice
function DrawDObjZ (dObj, z) {
	if (dObj instanceof Entity)
	{
		DrawEntity(dObj);
	}
	else if (dObj instanceof Area)
	{
		DrawAreaZSlice(dObj, z);
	}
}

function DrawAreaZSlice(area, z) {
	var scale = GetScale(z);
	if (scale > 0.01)
	{
		for (var i = 0; i < area.xSize; i++)
		{
			var x = scale * (i + area.x - xCam) + CANVAS_HALF_WIDTH;
			if (x > 0 - scale && x < CANVAS_WIDTH)
			{
				for (var j = 0; j < area.ySize; j++)
				{
					var y = scale * (j + area.y - yCam) + CANVAS_HALF_HEIGHT;
					if (y > 0 - scale && y < CANVAS_HEIGHT)
					{	
						var tile = area.map[i][j][z - area.z];
						if (tile > 0)
						{
							if (tile > 1)
							{
								DrawTileExtra(x, y, scale, tile, i + area.x, j + area.y, z, area.extraData[i][j][z - area.z]);
							}
							else
							{
								DrawTile(x, y, scale, tile, i + area.x, j + area.y, z);
							}
							numSquares ++;
						}
					}
				}
			}
		}
	}
}

function DrawTileExtra (x, y, scale, tile, i, j, k, extra) {
	switch (tile)
	{
		case DISAPPEAR_BLOCK:
			if (!IsNear(i, j, k, player.x, player.y, player.z, 3))
			{
				ctx.fillRect(x, y, scale, scale);
				ctx.strokeRect(x, y, scale, scale);
			}
		break;
		case APPEAR_BLOCK:
			if (IsNear(i, j, k, player.x, player.y, player.z, 3))
			{
				ctx.fillRect(x, y, scale, scale);
				ctx.strokeRect(x, y, scale, scale);
			}
		break;
	}
}

//i, j, k: world x, y, z position
function DrawTile (x, y, scale, tile, i, j, k) {
	ctx.fillRect(x, y, scale, scale);
	ctx.strokeRect(x, y, scale, scale);
}

//Up to 1 tile away in all directions
function IsNear (x1, y1, z1, x2, y2, z2, dist) {
	if (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2) <= dist)
	{
		return true;
	}
	return false;
}

function DrawEntity (entity) {
	ctx.save();
	var scale = GetScale(GetEntityZ(entity));
	var x = scale * (GetEntityX(entity) - xCam) + CANVAS_HALF_WIDTH;
	var y = scale * (GetEntityY(entity) - yCam) + CANVAS_HALF_HEIGHT;
	ctx.strokeStyle = "#00FF00";
	ctx.fillStyle = "#004000";
	ctx.fillRect(x, y, scale, scale);
	ctx.strokeRect(x, y, scale, scale);
	ctx.restore();
}


function IsSolid (x, y, z) {
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		if (x >= area.x && x < area.x + area.xSize && y >= area.y && y < area.y + area.ySize && z >= area.z && z < area.z + area.zSize)
		{
			//Within area's bounds
			var tile = area.map[x - area.x][y - area.y][z - area.z];
			if (tile === SOLID)
			{
				return true;
			}
			if (tile === APPEAR_BLOCK)
			{
				return true;
			}
		}
	}
	return false;
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

window.addEventListener('keydown', DoKeyDown, true);
window.addEventListener('keyup', DoKeyUp, true);

function DoKeyDown (e) {
	if (e.keyCode === 8)
	{
		//Backspace - prevent going back a page
		e.preventDefault();
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
}

function DoKeyUp (e) {
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
}
