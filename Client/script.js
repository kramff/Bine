// Bine puzzle game copyright Mark Foster 2015



// Server stuff

// motd: message of the day (string)
var motd = "";

// serverLevels: list of levels available from server.
// [{name, curPlayers}, ...]
var serverLevels = [];

// downloadedLevel: most recently downloaded level (in json string data form (?))
var downloadedLevel = "";

var usingServerLevel = false;

// playerArray: other players in the same server level
// [{id, name, color, x, y, z}, ...]
var playerArray = [];

// recievedMessages: recently recieved messages
// [{id, text, timestamp, misc}, ...]
// misc: {utterance, ...other effects go here}
var receivedMessages = [];



// socket.io connection
var MULTI_ON = false;

var socketScript = document.createElement("script");
if (location.href === "http://kramff.github.io/")
{
	socketScript.setAttribute("src", "https://bine-online.herokuapp.com/socket.io/socket.io.js");
}
else
{
	socketScript.setAttribute("src", "http://localhost:5000/socket.io/socket.io.js");
}
document.getElementsByTagName('body')[0].appendChild(socketScript);
var ssLoaded = false;
function loadSScript () {
	if (!ssLoaded)
	{
		ssLoaded = true;
		InitSocketConnection();
	}
}
socketScript.onreadystatechange = loadSScript;
socketScript.onload = loadSScript;


function InitSocketConnection (argument) {
	try
	{
		if (location.href === "http://kramff.github.io/")
		{
			socket = io("bine-online.herokuapp.com")
		}
		else
		{
			socket = io("http://localhost:5000");
		}
		socket.on("connect", function (data) {
			console.log("Connected to server with id: " + socket.id);
		});
		socket.on("motd", function (data) {
			motd = data;
			console.log("Message of the day: " + motd);
		});
		socket.on("serverLevels", function (data) {
			serverLevels = data;
			console.log("Server levels: " + serverLevels);
		});
		socket.on("playerMove", function (data) {
			UpdatePlayer(data);
		});
		socket.on("disconnection", function (data) {
			console.log("player disconnected");
			RemovePlayer(data);
		});
		socket.on("message", function (data) {
			RecieveChatMessage(data);
		});

		//Temporary level direct download
		socket.on("chosenLevel", function (data) {
			console.log("got chosen level from server");
			ImportLevel(data.data);
		});

		

		MULTI_ON = true;

	}
	catch (err)
	{
		console.error("server not up");
		MULTI_ON = false;
	}
}

//Functions to apply incoming data to game state
function UpdatePlayer (playerData) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id === playerData.id)
		{
			// playerArray[i] = playerData;
			playerArray[i].x = playerData.x;
			playerArray[i].y = playerData.y;
			playerArray[i].z = playerData.z;
			return;
		}
	}
	//New player
	playerArray.push(playerData);
	//Add to draw objects

	drawObjects.push(playerData);
	console.log("New player");
}
function RemovePlayer (playerData) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id === playerData.id)
		{
			drawObjects.splice(drawObjects.indexOf(playerArray[i]), 1)
			playerArray.splice(i, 1);
			return;
		}
	}
}
function RecieveChatMessage (message)
{
	console.log(message.text)
	TextToSpeech(message.text);
	AddMessage(message);
}

// Functions to send data to server
function SendPositionUpdate (position)
{
	socket.emit("playerMove", position);
}
function SendChatMessage (message)
{
	socket.emit("message", message);
	message.id = socket.id;
	AddMessage(message);
}

function AddMessage (message) {
	message.startTime = Date.now();
	messages.push(message);
}




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

// Editor variables
var editorActive = false;
var selectedArea = undefined;
var fakeExtra = {opacity: 1, pattern: 0, fill: 1};

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

// Camera
var xCam = 0;
var yCam = 0;
var zCam = 0;

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

// Number of tile types
var TILE_TYPES = 11;

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



function CreateEntity () {
	//initial location
	var newEntity = new Entity (16, 5, -4);
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

}

var player;
var firstTransparentTilesArray = [[99, 99, 99],[99, 99, 99],[99, 99, 99]];
var underCeiling = false;

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

	this.name = "Area " + (areas.length + 1);

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
				}
				this.extraData[i][j].push(extra);
				if (!useImport)
				{
					this.map[i][j].push(tile);
				}
			}
		}
	}
}

function SetTile (area, x, y, z, tile) {
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
	}
}

function Init () {
	window.requestAnimationFrame(Update);
	

	areaColors = GenerateColorPalette(100);


	ResizeCanvas();
	// StartMapEditor();

	player = CreateEntity();
	InitGame();
	
	/*setTimeout(function() {
		ImportLevel(pyramidLevel2);
	}, 500);
	*/

}

function InitGame () {
	//player = CreateEntity();

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
			EditorMouseDown();
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
			EndMovement(player);
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
	
	if (!aboveSolid || !levelSolid)
	{
		if (levelSolid && selfAboveSolid)
		{
			return false;
		}
		return true;
	}
	return false;
}

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

function Render () {

	//Camera position
	if (middleClick)
	{
		xCam += (midStartX - mouseX) / 58.8;
		yCam += (midStartY - mouseY) / 58.8;
		zCam = (zCam * 4 + GetEntityZ(player)) * 0.2;
		midStartX = mouseX;
		midStartY = mouseY;
	}
	else
	{
		//Standard camera movement
		xCam = (xCam * 4 + GetEntityX(player) + 0.5) * 0.2;
		yCam = (yCam * 4 + GetEntityY(player) + 0.5) * 0.2;
		zCam = (zCam * 4 + GetEntityZ(player)) * 0.2;
	}

	//Canvas rendering
	canvas.width = canvas.width;

	//Set standard font
	ctx.font = "16px sans-serif";

	ctx.strokeStyle = "#FFFFFF";
	ctx.fillStyle = "#101010";

	numSquares = 0;

	GetFirstTransparentTiles();
	underCeiling = UnderCeilingCheck();

	DrawAllObjects();
	DrawAllMessages();

	if (edgeSquareLimit.active)
	{
		edgeSquareLimit.x -= 3;
		edgeSquareLimit.y -= 3;
		edgeSquareLimit.xSize += 6;
		edgeSquareLimit.ySize += 6;
		if (edgeSquareLimit.xSize > CANVAS_WIDTH + 310)
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

	if (editorActive)
	{

		//Draw tile select left sidebar
		ctx.fillStyle = "#300030";
		ctx.fillRect(0, 0, 70, CANVAS_HEIGHT);
		for (var i = 0; i < TILE_TYPES; i++)
		{
			//Selected tile highlight
			if (editTypeL === i || editTypeR === i)
			{
				ctx.save();
				ctx.globalAlpha = 0.5;
				ctx.fillStyle = (editTypeL === i) ? "#CCCCCC" : "#000000";
				ctx.fillRect(0, i * 60, 70, 70);
				ctx.restore();
			}
			DrawTileExtra(10, 10 + i * 60, 50, i, 0, 0, 0, fakeExtra);
		}

		//Draw area/other menu right sidebar
		ctx.fillStyle = "#303000";
		ctx.fillRect(CANVAS_WIDTH - 200, 0, 200, CANVAS_HEIGHT);
		//Draw area/other buttons
		DrawEditorButton(0, "Create Area " + (shiftPressed ? "10x10x10" : "5x5x5"));
		DrawEditorButton(1, "Remove Area");
		DrawEditorButton(2, "Resize Area");
		DrawEditorButton(3, "Load Level");
		DrawEditorButton(4, "Save Level");

		//Draw area selector top bar
		ctx.fillStyle = "#404040";
		ctx.fillRect(70, 0, CANVAS_WIDTH - 270, 40);
		ctx.fillStyle = "#FFFFFF";
		var infoString = "Level 1: " + GetAreasAtPosition(player.x, player.y, player.z, true).join(", ");
		ctx.fillText(infoString, 70, 30);


		//Draw rules menu bottom bar
		ctx.fillStyle = "#003030";
		ctx.fillRect(70, CANVAS_HEIGHT - 100, CANVAS_WIDTH - 270, 100);

	}

}

function DrawEditorButton (btnNum, text) {
	ctx.fillStyle = "#303030";
	ctx.fillRect(CANVAS_WIDTH - 190, 10 + btnNum * 60, 170, 50);
	ctx.fillStyle = "#FFFFFF";
	ctx.fillText(text, CANVAS_WIDTH - 90 - text.length * 5, 40 + btnNum * 60);
}

function DrawAllMessages () {
	ctx.save();
	var currentTime = Date.now();
	ctx.fillStyle = "#FFFFFF";
	for (var i = messages.length - 1; i >= 0; i--) {
		var message = messages[i];
		var x = -100;
		var y = -100;
		if (MULTI_ON)
		{
			if (message.id === socket.id)
			{
				// Local player
				x = GetScale(GetEntityZ(player)) * (GetEntityX(player) - xCam) + CANVAS_HALF_WIDTH;
				y = GetScale(GetEntityZ(player)) * (GetEntityY(player) - yCam) + CANVAS_HALF_HEIGHT;
			}
			else
			{
				// Loop through network players
				for (var np = 0; np < playerArray.length; np++)
				{
					var nPlayer = playerArray[np];
					if (nPlayer.id === message.id)
					{
						x = GetScale(nPlayer.z) * (nPlayer.x - xCam) + CANVAS_HALF_WIDTH;
						y = GetScale(nPlayer.z) * (nPlayer.y - yCam) + CANVAS_HALF_HEIGHT;
					}
				}
			}
		}
		else
		{
			// Must be local player
			x = GetScale(GetEntityZ(player)) * (GetEntityX(player) - xCam) + CANVAS_HALF_WIDTH;
			y = GetScale(GetEntityZ(player)) * (GetEntityY(player) - yCam) + CANVAS_HALF_HEIGHT;
		}
		DrawTextBox(message.text, x, y - 0.02 * (currentTime - message.startTime));

		if (currentTime - message.startTime > 5000)
		{
			messages.splice(i, 1);
		}
	}
	if (writingMessage)
	{
		var x = GetScale(GetEntityZ(player)) * (GetEntityX(player) - xCam) + CANVAS_HALF_WIDTH;
		var y = GetScale(GetEntityZ(player)) * (GetEntityY(player) - yCam + 1.1) + CANVAS_HALF_HEIGHT;
		DrawTextBox("> " + messageInput, x, y);
	}
	ctx.restore();
}

function DrawTextBox (text, x, y) {
	ctx.fillText(text, x, y);
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

function DrawAllObjects () {
	if (drawObjects.length === 0)
	{
		//no objects to draw
		return;
	}
	drawObjects.forEach(function (obj) {
		SetDrawZ(obj);
	});
	drawObjects.sort(function (a, b) {
		if (a === player || b === player)
		{
			if (a === player) return a.drawZ + 0.1 - b.drawZ;
			else return a.drawZ - b.drawZ - 0.1;
		}
		return a.drawZ - b.drawZ;
	});
	var bottomZ = drawObjects[0].drawZ;
	var topZ = drawObjects[drawObjects.length - 1].drawZ;
	var bottomI = 0;
	for (var i = 0; i < drawObjects.length; i++)
	{
		if (drawObjects[i] instanceof Area)
		{
			//Only areas can have a higher z than the last object
			topZ = Math.max(topZ, drawObjects[i].drawZ + drawObjects[i].zSize);
		}
	}
	for (var z = bottomZ; z <= topZ + 1; z++)
	{
		var i = bottomI;
		var currentObject = drawObjects[i];

		//Loop through objects, stopping when no more objects or next object is above currentZ
		while (currentObject !== undefined && currentObject.drawZ <= z)
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
					if (z > currentObject.drawZ)
					{
						bottomI ++;
					}
				}
				else if (currentObject instanceof Area)
				{
					if (z > currentObject.drawZ + currentObject.zSize)
					{
						bottomI ++;
					}
				}
			}
			


			i ++;
			currentObject = drawObjects[i];
		}
	}
}

function SetDrawZ (dObj) {
	if (dObj instanceof Entity)
	{
		dObj.drawZ = Math.ceil(GetEntityZ(dObj));
	}
	else if (dObj instanceof Area)
	{
		dObj.drawZ = dObj.z;
	}
	else
	{
		dObj.drawZ = Math.ceil(dObj.z);
	}
}

//Draw Object in Z: returns true if the object should be drawn at the given z
function DObjInZ (dObj, z) {
	if (dObj instanceof Entity)
	{
		return Math.ceil(GetEntityZ(dObj)) === z;
	}
	else if (dObj instanceof Area)
	{
		return (dObj.z <= z && dObj.z + dObj.zSize > z);
	}
	else
	{
		return Math.ceil(dObj.z) === z;
	}
}

// Entity - DrawEntity
// Area - DrawAreaZSlice
// Other - should be a Network Player
function DrawDObjZ (dObj, z) {
	if (dObj instanceof Entity)
	{
		DrawEntity(dObj);
	}
	else if (dObj instanceof Area)
	{
		DrawAreaZSlice(dObj, z);
	}
	else
	{
		// Otherwise: Network player
		DrawNPlayer(dObj);
	}
}

function DrawAreaZSlice(area, z) {
	var scale = GetScale(z + GetAreaZ(area) - area.z);
	if (scale > 0.01)
	{
		for (var i = 0; i < area.xSize; i++)
		{
			var x = scale * (i + GetAreaX(area) - xCam) + CANVAS_HALF_WIDTH;
			if (x > 0 - scale && x < CANVAS_WIDTH)
			{
				for (var j = 0; j < area.ySize; j++)
				{
					var y = scale * (j + GetAreaY(area) - yCam) + CANVAS_HALF_HEIGHT;
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
								//SOLID tile
								if (InCeiling(i + area.x, j + area.y, z))
								{
									DrawTileInCeiling(x, y, scale);
								}
								else
								{
									DrawTile(x, y, scale);
								}
							}
							numSquares ++;
						}
					}
				}
			}
		}
		if (editorActive)
		{
			DrawAreaEdges(area, scale, z);
		}
	}
}

function DrawTileExtra (x, y, scale, tile, i, j, k, extra) {
	ctx.save();
	var doDraw = true;
	switch (tile)
	{
		default:
			//DrawTile(x, y, scale);
		break;
		case EMPTY:
			doDraw = false;
		break;
		case DISAPPEAR_BLOCK:
			if (!IsNear(i, j, k, player.x, player.y, player.z, 1))
			{
				extra.opacity = Math.min(1, extra.opacity + 0.07);
			}
			else
			{
				extra.opacity = Math.max(0, extra.opacity - 0.07);
			}
			if (editorActive)
			{
				extra.opacity = 1;
				ctx.fillStyle = "#501010"
			}
			if (extra.opacity !== 1)
			{
				ctx.globalAlpha = extra.opacity;
			}
			if (extra.opacity < 0.1)
			{
				doDraw = false;
			}
		break;
		case APPEAR_BLOCK:
			if (IsNear(i, j, k, player.x, player.y, player.z, 1))
			{
				extra.opacity = Math.min(1, extra.opacity + 0.07);
			}
			else
			{
				extra.opacity = Math.max(0, extra.opacity - 0.07);
			}
			if (editorActive)
			{
				extra.opacity = 1;
				ctx.fillStyle = "#105010"
			}
			if (extra.opacity !== 1)
			{
				ctx.globalAlpha = extra.opacity;
			}
			if (extra.opacity < 0.1)
			{
				doDraw = false;
			}
		break;
		case PATTERN_BLOCK:
			if (extra.pattern === 0)
			{
				ctx.fillStyle = "#800000";
			}
			else
			{
				ctx.fillStyle = "#C0C000";
			}
		break;
		case PATTERN_CLEAR_BLOCK:
			ctx.fillStyle = "#000080";
		break;
		case PATTERN_ACTIVATE_BLOCK:
			ctx.fillStyle = "#400080";
		break;
		case PATTERN_EFFECT_BLOCK:
			extra.opacity = Math.min(0.75, extra.opacity + 0.02);
			ctx.globalAlpha = extra.opacity;
		break;
		case PATTERN_HOLE_BLOCK:
			extra.opacity = Math.max(0, extra.opacity - 0.07);
			if (extra.opacity >= 0.1)
			{
				ctx.fillStyle = "#800000";
				ctx.globalAlpha = extra.opacity;
			}
			else
			{
				doDraw = false;
			}
		break;
		case SIMULATION_BLOCK:
			ctx.fillStyle = "#C000C0";
		break;
		case FLUID_BLOCK:
			ctx.fillStyle = "#0080C0";
			ctx.strokeStyle = "#0080C0";
			ctx.globalAlpha = extra.prevFill;
		break;
	}
	if (doDraw)
	{
		if (InCeiling(i, j, k))
		{
			DrawTileInCeiling(x, y, scale);
		}
		else
		{
			DrawTile(x, y, scale);
		}
	}
	ctx.restore();
}

//i, j, k: world x, y, z position
function DrawTile (x, y, scale) {
	ctx.fillRect(x, y, scale, scale);
	ctx.strokeRect(x, y, scale, scale);
}

function DrawTileInCeiling (x, y, scale) {
	ctx.save();

	ctx.globalAlpha *= 0.5;
	ctx.fillRect(x, y, scale, scale);
	ctx.strokeRect(x, y, scale, scale);
	ctx.restore();
}

function UnderCeilingCheck () {
	var x = player.x;
	var y = player.y;
	var z = player.z;

	while (!IsOpaque(x, y, z))
	{
		z ++;
		if (GetScale(z) < 0)
		{
			return false;
		}
	}
	return true;
}

function GetFirstTransparentTiles () {
	for (var i = 0; i < 3; i++)
	{
		for (var j = 0; j < 3; j++)
		{
			var x = player.x + i - 1;
			var y = player.y + j - 1;
			var z = player.z;
			
			while (IsOpaque(x, y, z))
			{
				z ++;
			}
			firstTransparentTilesArray[i][j] = z;
		}
	}
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
	if (x > player.x + 1 || x < player.x - 1 || y > player.y + 1 || y < player.y - 1)
	{
		return false;
	}
	//Check if tile is above an empty tile above the player
	if (firstTransparentTilesArray[x - player.x + 1][y - player.y + 1] > z)
	{
		return false;
	}
	return true;
}

function DrawEntity (entity) {
	var scale = GetScale(GetEntityZ(entity));
	var x = scale * (GetEntityX(entity) - xCam) + CANVAS_HALF_WIDTH;
	var y = scale * (GetEntityY(entity) - yCam) + CANVAS_HALF_HEIGHT;
	DrawCharacter(entity, scale, x, y);
}

function DrawNPlayer (nPlayer) {
	var scale = GetScale(nPlayer.z);
	var x = scale * (nPlayer.x - xCam) + CANVAS_HALF_WIDTH;
	var y = scale * (nPlayer.y - yCam) + CANVAS_HALF_HEIGHT;
	DrawCharacter(nPlayer, scale, x, y);
}

function DrawCharacter (character, scale, x, y) {
	
	if (scale < 0)
	{
		return;
	}
	if (x > 0 - scale && x < CANVAS_WIDTH && y > 0 - scale && y < CANVAS_HEIGHT)
	{
		ctx.save();
		ctx.strokeStyle = "#80FFFF";
		ctx.fillStyle = "#208080";
		if (editorActive && character === player)
		{
			//Editor player: transparent, move with camera when middle clicking
			ctx.globalAlpha = 0.5;
			if (middleClick)
			{
				x = CANVAS_HALF_WIDTH - scale / 2;
				y = CANVAS_HALF_HEIGHT - scale / 2;
			}
		}
		ctx.fillRect(x, y, scale, scale);
		ctx.strokeRect(x, y, scale, scale);
		ctx.restore();
	}
}

function DrawAreaEdges (area, scale, z) {
	var x0 = scale * (0 + GetAreaX(area) - xCam) + CANVAS_HALF_WIDTH;
	var x1 = scale * (area.xSize + GetAreaX(area) - xCam) + CANVAS_HALF_WIDTH;
	var y0 = scale * (0 + GetAreaY(area) - yCam) + CANVAS_HALF_HEIGHT;
	var y1 = scale * (area.ySize + GetAreaY(area) - yCam) + CANVAS_HALF_HEIGHT;
	ctx.save();
	if (z === player.z - 1)
	{
		ctx.fillStyle = "#000000";
		ctx.globalAlpha = 0.9;
		ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
	}
	ctx.strokeStyle = areaColors[areas.indexOf(area)];
	ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
	if (z === player.z)
	{
		ctx.fillStyle = "#FFFFFF";
		ctx.globalAlpha = 0.2;
		ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
	}
	ctx.restore();
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

function EndMovement (entity) {
	//Multiple tiles could exist at the same location
	
	for (var i = 0; i < areas.length; i++) {
		var area = areas[i];
		if (LocationInArea(area, entity.x, entity.y, entity.z - 1))
		{
			StepOnTile(entity, area, entity.x - area.x, entity.y - area.y, entity.z - 1 - area.z);
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
	var utterance = new SpeechSynthesisUtterance(text);
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

document.addEventListener("keypress", DoKeyPress);

function DoKeyPress (e) {
	if (writingMessage)
	{
		if (e.keyCode == 13 && !enterPressed)
		{
			if (messageInput.length == 0)
			{
				writingMessage = false;
				return;
			}
			// Send message
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

document.addEventListener("keydown", DoKeyDown);

function DoKeyDown (e) {
	if (e.keyCode == 8)
	{
		//Backspace - prevent going back a page
		e.preventDefault();
	}
	if (writingMessage)
	{
		if (e.keyCode == 32)
		{
			//spacebar
			messageInput += " ";
			e.preventDefault();
		}
		if (e.keyCode == 8)
		{
			//backspace
			messageInput = messageInput.slice(0, messageInput.length - 1);
		}
		return;
	}
	if (e.keyCode == 13)
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
		//1
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
		//2
		//move areas[6] left

		// BeginAreaMovement(areas[6], -1, 0, 0, 10);
	}
	else if (e.keyCode === 51)
	{
		//3
		//move areas[6] right

		// BeginAreaMovement(areas[6], 1, 0, 0, 10);
	}

	shiftPressed = e.shiftKey;

	// console.log(e.keyCode);
	mouseMovement = false;
}

document.addEventListener("keyup", DoKeyUp);

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

window.addEventListener("mousedown", DoMouseDown);

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
	mouseTilesX = ScreenXToWorldX(mouseX, player.z);
	mouseTilesY = ScreenYToWorldY(mouseY, player.z);
	
	mouseMovement = true;

}

window.addEventListener("mousemove", DoMouseMove);

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

window.addEventListener("mouseup", DoMouseUp);

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

window.addEventListener("mousewheel", DoMouseWheel);

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

window.addEventListener("resize", DoResize);

function DoResize (e) {
	ResizeCanvas();
}

function ResizeCanvas () {
	canvas.width = window.innerWidth - 25;
	canvas.height = window.innerHeight - 25;
	CANVAS_WIDTH = canvas.width;
	CANVAS_HEIGHT = canvas.height;
	CANVAS_HALF_WIDTH = CANVAS_WIDTH / 2;
	CANVAS_HALF_HEIGHT = CANVAS_HEIGHT / 2;
}

document.addEventListener("contextmenu", DoContextMenu);

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
	var newArea = new Area(x, y, z, xSize, ySize, zSize);
	areas.push(newArea);
	drawObjects.push(newArea);
	return newArea;
}

function RemoveAreaAt (x, y, z) {
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



var lastEditedX;
var lastEditedY;
var lastEditedZ;

var editType = SOLID;
var editTypeL = SOLID;
var editTypeR = EMPTY;

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
	if (mouseX > CANVAS_WIDTH - 200)
	{
		//mouse is in the button menu part of screen
		var buttonNum = Math.floor((mouseY - 5) / 60);
		switch (buttonNum)
		{
			case 0:
				//Create Area
				if (shiftPressed)
				{
					CreateArea(player.x, player.y, player.z, 10, 10, 10);
				}
				else
				{
					CreateArea(player.x, player.y, player.z, 5, 5, 5);
				}
			break;
			case 1:
				//Remove Area
				RemoveAreaAt(player.x, player.y, player.z);
			break;
			case 2:
				//Resize Area
				ResizeAreaTo(player.x, player.y, player.z)
			break;
			case 3:
				//Load Level
				ImportLevel(LoadFromLocalStorage("level1"));
			break;
			case 4:
				//Save Level
				SaveToLocalStorage(ExportLevel(), "level1");
			break;
		}

		return;
	}
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

function EditorMouseMove () {
	if (mButton === 1)
	{
		player.x = Math.round(xCam - 0.5);
		player.y = Math.round(yCam - 0.5);
	}
	if (mousePressed)
	{
		var editX = ScreenXToWorldX(mouseX, player.z) + player.x;
		var editY = ScreenYToWorldY(mouseY, player.z) + player.y;
		var editZ = player.z;

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
	editorActive = true;
}
function EndMapEditor () {
	editorActive = false;
}

function ClearLevel () {
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
		areaData = importedData.areas[i];
		var newArea = new Area(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize, true, areaData.map);
		areas.push(newArea);
		drawObjects.push(newArea);
	}
	player = new Entity(importedData.player.x, importedData.player.y, importedData.player.z);
	entities.push(player);
	drawObjects.push(player);
	InitGame();
}

function ExportLevel () {
	//export the current level to a levelData string
	var levelData = {areas:[], player:{x: player.x, y: player.y, z: player.z}};
	for (var i = 0; i < areas.length; i++)
	{
		var area = areas[i];
		var dataObj = {
			x: area.x,
			y: area.y,
			z: area.z,
			xSize: area.xSize,
			ySize: area.ySize,
			zSize: area.zSize,
			map: area.map,
			rule: 0
		};
		levelData.areas.push(dataObj); 
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