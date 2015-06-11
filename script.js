//Bine puzzle game copyright Mark Foster 2015

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var CANVAS_WIDTH = 600;
var CANVAS_HEIGHT = 600;

var CANVAS_HALF_WIDTH = 300;
var CANVAS_HALF_HEIGHT = 300;

var TILE_SIZE = 30;

var wKey;
var aKey;
var sKey;
var dKey;

var qKey;
var eKey;

var xCam = 0;
var yCam = 0;
var zCam = 0;

var player = {x:2, y:2, z:2, moveDelay: 0, xMov: 0, yMov: 0, zMov: 0};

var areas = [];

function CreateArea () {
	areas.push(new Area(0, 0, 0, 100, 100, 30));
}

function Area (x, y, z, xSize, ySize, zSize) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.xSize = xSize;
	this.ySize = ySize;
	this.zSize = zSize;
	this.map = [];
	for (var i = 0; i < xSize; i++)
	{
		this.map.push([]);
		for (var j = 0; j < ySize; j++)
		{
			this.map[i].push([]);
			for (var k = 0; k < zSize; k++)
			{
				var tile = 0;
				if (i%5 == 0 || j%5 == 0 || k == 0)
				{
					tile = 1;
				}
				this.map[i][j].push(tile);
			}
		}
	}
}

function Init () {
	window.requestAnimationFrame(Update);
	CreateArea();
}

var lastTime = new Date;
var delay = 0;
var totalDelay = 0;
var frameCount = 0;

function Update () {
	window.requestAnimationFrame(Update);
	Control();
	Render();

	delay = (new Date - lastTime);
	totalDelay += delay;
	frameCount ++;
	lastTime = new Date;
}

function Control () {
	if (player.moveDelay > 0)
	{
		player.moveDelay --;
		if (player.moveDelay <= 0)
		{
			player.x += player.xMov;
			player.y += player.yMov;
			player.z += player.zMov;
			player.xMov = 0;
			player.yMov = 0;
			player.zMov = 0;
		}
		if (player.moveDelay > 7)
		{
			// Allow diagonal movement within a few frames
			if (wKey && player.yMov === 0)
			{
				player.yMov = -1;
			}
			if (sKey && player.yMov === 0)
			{
				player.yMov = 1;
			}
			if (aKey && player.xMov === 0)
			{
				player.xMov = -1;
			}
			if (dKey && player.xMov === 0)
			{
				player.xMov = 1;
			}
			// Allow canceling movement by releasing key or pressing opposite
			if (player.yMov === -1 && (!wKey || sKey))
			{
				player.yMov = 0;
				if (player.xMov === 0)
				{
					player.moveDelay = 2;
				}
			}
			if (player.yMov === 1 && (!sKey || wKey))
			{
				player.yMov = 0;
				if (player.xMov === 0)
				{
					player.moveDelay = 2;
				}
			}
			if (player.xMov === -1 && (!aKey || dKey))
			{
				player.xMov = 0;
				if (player.yMov === 0)
				{
					player.moveDelay = 2;
				}
			}
			if (player.xMov === 1 && (!dKey || aKey))
			{
				player.xMov = 0;
				if (player.yMov === 0)
				{
					player.moveDelay = 2;
				}
			}
		}
		return;
	}
	if (wKey && !sKey)
	{
		player.yMov = -1;
		player.moveDelay = 10;
	}
	if (sKey && !wKey)
	{
		player.yMov = 1;
		player.moveDelay = 10;
	}
	if (aKey && !dKey)
	{
		player.xMov = -1;
		player.moveDelay = 10;
	}
	if (dKey && !aKey)
	{
		player.xMov = 1;
		player.moveDelay = 10;
	}
	if (qKey)
	{
		player.zMov = -1;
		player.moveDelay = 10;
	}
	if (eKey)
	{
		player.zMov = 1;
		player.moveDelay = 10;
	}
}

function Render () {
	canvas.width = canvas.width;

	xCam = (xCam * 4 + GetXPos(player) + 0.5) * 0.2;
	yCam = (yCam * 4 + GetYPos(player) + 0.5) * 0.2;
	zCam = (zCam * 4 + GetZPos(player)) * 0.2;

	ctx.strokeStyle = "#FFFFFF";
	ctx.fillStyle = "#FFFFFF";

	
	DrawAreas();

	var scale = GetScale(player.z);
	var x = (GetXPos(player) - xCam) * scale;
	var y = (GetYPos(player) - yCam) * scale;

	ctx.fillRect(TILE_SIZE * x + CANVAS_HALF_WIDTH, TILE_SIZE * y + CANVAS_HALF_HEIGHT, TILE_SIZE * scale, TILE_SIZE * scale);

	ctx.fillRect(0, 0, 30, 40)

	ctx.strokeStyle = "#008080";
	ctx.strokeText("" + delay, 10, 10);
	ctx.strokeText("" + Math.round(totalDelay / frameCount), 10, 30);
}

function GetXPos (entity) {
	return entity.x + entity.xMov * (10 - entity.moveDelay) / 10;
}

function GetYPos (entity) {
	return entity.y + entity.yMov * (10 - entity.moveDelay) / 10;
}

function GetZPos (entity) {
	return entity.z + entity.zMov * (10 - entity.moveDelay) / 10;
}

function GetScale (z) {
	return (20 + z - zCam) / 30;
}

function DrawAreas () {
	for (var i = 0; i < areas.length; i++)
	{
		DrawArea(areas[i]);
	}
}

function DrawArea (area) {
	//Loop through Z first
	for (var k = 0; k < area.zSize; k++)
	{
		var scale = GetScale(k + area.z);
		var scaledTileSize = TILE_SIZE * scale
		for (var i = 0; i < area.xSize; i++)
		{
			var x = scaledTileSize * (i + area.x - xCam) + CANVAS_HALF_WIDTH;
			if (x > 0 - scaledTileSize && x < CANVAS_WIDTH)
			{
				for (var j = 0; j < area.ySize; j++)
				{
					var y = scaledTileSize * (j + area.y - yCam) + CANVAS_HALF_HEIGHT;
					if (y > 0 - scaledTileSize && y < CANVAS_HEIGHT)
					{	
						var tile = area.map[i][j][k];
						if (tile === 1)
						{
							ctx.strokeRect(x, y, scaledTileSize, scaledTileSize);
						}
					}
				}
			}
		}
	}
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