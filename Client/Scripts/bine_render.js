// bine_render.js
// drawing things to the canvas

// Global object to use instead of passing all variables to every function
// (And avoid creating objects every frame)
var R = {
	canvas: undefined,
	ctx: undefined,
	session: undefined,
	level: undefined,
	cameraX: undefined,
	cameraY: undefined,
	cameraZ: undefined,
	CANVAS_WIDTH: undefined,
	CANVAS_HEIGHT: undefined,
	CANVAS_HALF_WIDTH: undefined,
	CANVAS_HALF_HEIGHT: undefined,
	EYE_DISTANCE: 45,
	SCALE_MULTIPLIER: 490,
	Z_MULTIPLIER: 3.1,
	TILE_SIZE: 5.4,
	EDIT_MODE: false,
}

function ClearCanvas (canvas) {
	canvas.width = canvas.width;
}

function RenderLevel (canvas, session, level, cameraX, cameraY, cameraZ, editMode) {
	// Set up render object
	if (R.canvas !== canvas)
	{
		R.canvas = canvas;
		R.ctx = R.canvas.getContext("2d");
	}
	R.session = session;
	R.level = level;
	R.cameraX = cameraX
	R.cameraY = cameraY;
	R.cameraZ = cameraZ
	R.CANVAS_WIDTH = canvas.width;
	R.CANVAS_HEIGHT = canvas.height;
	R.CANVAS_HALF_WIDTH = R.CANVAS_WIDTH / 2;
	R.CANVAS_HALF_HEIGHT = R.CANVAS_HEIGHT / 2;
	R.EDIT_MODE = editMode || false;

	// Clear canvas
	R.canvas.width = R.canvas.width;

	// Set standard drawing values
	R.ctx.font = "16px sans-serif";
	R.ctx.strokeStyle = "#FFFFFF";
	R.ctx.fillStyle = "#101010";
	
	// Get level to draw and draw all objects in that level 
	var drawObjects = R.level.drawObjects;
	drawObjects.forEach(SetDrawZ);
	drawObjects.sort(DrawObjSortFunc);

	var bottomZ = 1;
	var topZ = -1;
	var bottomI = 0;


	if (drawObjects.length > 0)
	{
		bottomZ = drawObjects[0].drawZ - 1;
		topZ = drawObjects[drawObjects.length - 1].drawZ;
	}
	for (var i = 0; i < drawObjects.length; i++)
	{
		if (drawObjects[i].type === "Area")
		{
			//Only areas can have a higher z than the last object
			topZ = Math.max(topZ, drawObjects[i].drawZ + drawObjects[i].zSize);
		}
	}
	if (R.EDIT_MODE && bottomZ > Math.round(R.cameraZ))
	{
		DrawEditOutline(Math.round(R.cameraZ));
	}
	for (var z = bottomZ; z <= topZ + 1; z++)
	{
		var i = bottomI;
		var currentObject = drawObjects[i];

		//Loop through objects, stopping when no more objects or next object is above currentZ
		while (currentObject !== undefined && currentObject.drawZ - 1 <= z)
		{
			if (DObjInZ(currentObject, z))
			{
				// Draw the tops of cubes
				DrawDObjZ(currentObject, z, false);
			}
			if (DObjInZ(currentObject, z + 1))
			{
				// Draw the sides of cubes
				DrawDObjZ(currentObject, z + 1, true);
			}

			//move bottomI up when possible
			if (i === bottomI)
			{
				if (currentObject.type === "Entity")
				{
					if (z > currentObject.drawZ)
					{
						bottomI ++;
					}
				}
				else if (currentObject.type === "Area")
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
		// Draw outline where player could be placed if in edit mode
		if (R.EDIT_MODE && z === Math.round(R.cameraZ))
		{
			DrawEditOutline(z);
		}
	}
	if (R.EDIT_MODE && topZ < Math.round(R.cameraZ))
	{
		DrawEditOutline(Math.round(R.cameraZ));
	}
}

function DrawEditOutline (z) {
	R.ctx.save();
	var size = GetScale(z);
	R.ctx.strokeStyle = "#40FF80";
	R.ctx.strokeRect(R.CANVAS_HALF_WIDTH - size / 2, R.CANVAS_HALF_HEIGHT - size / 2, size, size);
	R.ctx.restore();
}

function DrawObjSortFunc (a, b) {
	if (a.isEntity !== b.isEntity)
	{
		if (a.isEntity) return a.drawZ + 0.01 - b.drawZ;
		else return a.drawZ - b.drawZ - 0.01;
	}
	if (a.drawZ - b.drawZ < 0.05)
	{
		var offsetA = (a.isEntity ? entities.indexOf(a) : (a.isArea ? areas.indexOf(a) : 0)) * 0.01;
		var offsetB = (b.isEntity ? entities.indexOf(b) : (b.isArea ? areas.indexOf(b) : 0)) * 0.01;
		return ((a.drawZ + offsetA) - (b.drawZ + offsetB));
	}
	return a.drawZ - b.drawZ;
}

function SetDrawZ (dObj) {
	if (dObj.type === "Entity")
	{
		dObj.drawZ = Math.ceil(dObj.GetZ());
	}
	else if (dObj.type === "Area")
	{
		dObj.drawZ = dObj.z;
	}
	else
	{
		dObj.drawZ = Math.ceil(dObj.z);
	}
}



function GetScale (z) {
	return -(R.TILE_SIZE / ( R.Z_MULTIPLIER * (z - R.cameraZ) - R.EYE_DISTANCE)) * R.SCALE_MULTIPLIER;
}

function DObjInZ (dObj, z) {
	if (dObj.type === "Entity")
	{
		return Math.ceil(dObj.GetZ()) === z;
	}
	else if (dObj.type === "Area")
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
// Other - should be (?) a Network Player (?)
// drawSideTiles - true: draw the side tiles, false/default: draw the top
function DrawDObjZ (dObj, z, drawSideTiles) {
	if (dObj.type === "Entity")
	{
		if (drawSideTiles)
		{
		}
		else
		{
			DrawEntity(dObj);
		}
	}
	else if (dObj.type === "Area")
	{
		if (drawSideTiles)
		{
			DrawAreaZSliceSideTiles(dObj, z);
		}
		else
		{
			DrawAreaZSlice(dObj, z);
		}
	}
	else
	{
		// Otherwise: Network player
		if (drawSideTiles)
		{
		}
		else
		{
			// DrawNPlayer(dObj);
			DrawEntity(dObj)
		}
	}
}

function DrawEntity (entity) {
	var scale = GetScale(entity.GetZ());
	var x = scale * (entity.GetX() - R.cameraX) + R.CANVAS_HALF_WIDTH;
	var y = scale * (entity.GetY() - R.cameraY) + R.CANVAS_HALF_HEIGHT;

	if (scale < 0)
	{
		return;
	}
	if (x > 0 - scale && x < R.CANVAS_WIDTH && y > 0 - scale && y < R.CANVAS_HEIGHT)
	{
		R.ctx.save();
		R.ctx.strokeStyle = "#80FFFF";
		R.ctx.fillStyle = "#208080";
		// if (editorActive && character === player)
		if (false)
		{
			//Editor player: transparent, move with camera when middle clicking
			R.ctx.globalAlpha = 0.5;
			if (middleClick)
			{
				x = R.CANVAS_HALF_WIDTH - scale / 2;
				y = R.CANVAS_HALF_HEIGHT - scale / 2;
			}
		}
		// if (character !== player)
		if (true)
		{
			R.ctx.strokeStyle = "#80FF80";
			R.ctx.fillStyle = "#208020";
		}
		R.ctx.fillRect(x, y, scale, scale);
		R.ctx.strokeRect(x, y, scale, scale);
		R.ctx.restore();
	}
}

function DrawAreaZSlice (area, z) {
	var realZ = z;
	var scale = GetScale(z + area.GetZ() - area.z);
	if (scale > 0.01)
	{
		for (var i = 0; i < area.xSize; i++)
		{
			var realX = i + area.GetX();
			var x = scale * (i + area.GetX() - R.cameraX) + R.CANVAS_HALF_WIDTH;
			if (x > 0 - scale && x < R.CANVAS_WIDTH)
			{
				for (var j = 0; j < area.ySize; j++)
				{
					var realY = j + area.GetY();
					var y = scale * (j + area.GetY() - R.cameraY) + R.CANVAS_HALF_HEIGHT;
					if (y > 0 - scale && y < R.CANVAS_HEIGHT)
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
									DrawTile(x, y, scale, realX, realY, realZ);
								}
							}
							// numSquares ++;
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
function DrawAreaZSliceSideTiles (area, z) {
	var realZ = z;
	var scale = GetScale(z + area.GetZ() - area.z);
	var scale2 = GetScale(-1 + z + area.GetZ() - area.z);
	if (scale > 0.01)
	{
		for (var i = 0; i < area.xSize; i++)
		{
			var realX = i + area.GetX();
			var x = scale * (realX - R.cameraX) + R.CANVAS_HALF_WIDTH;
			var x2 = scale2 * (realX - R.cameraX) + R.CANVAS_HALF_WIDTH;
			if (x2 > 0 - scale2 && x2 < R.CANVAS_WIDTH)
			{
				for (var j = 0; j < area.ySize; j++)
				{
					var realY = j + area.GetY()
					var y = scale * (realY - R.cameraY) + R.CANVAS_HALF_HEIGHT;
					var y2 = scale2 * (realY - R.cameraY) + R.CANVAS_HALF_HEIGHT;
					if (y2 > 0 - scale2 && y2 < R.CANVAS_HEIGHT)
					{	
						var tile = area.map[i][j][z - area.z];
						if (tile > 0)
						{
							if (tile > 1)
							{
								// DrawTileExtra(x, y, scale, tile, i + area.x, j + area.y, z, area.extraData[i][j][z - area.z]);
							}
							else
							{
								//SOLID tile
								if (InCeiling(i + area.x, j + area.y, z))
								{
									// DrawTileInCeiling(x, y, scale);
								}
								else
								{
									DrawTileSides(x, y, scale, x2, y2, scale2, realX, realY, realZ);
								}
							}
							// numSquares ++;
						}
					}
				}
			}
		}
		if (editorActive)
		{
			// DrawAreaEdges(area, scale, z);
		}
	}
}
function DrawTileExtra (x, y, scale, tile, i, j, k, extra) {
	R.ctx.save();
	var doDraw = true;
	switch (tile)
	{
		default:
			
		break;
		case EMPTY:
			doDraw = false;
		break;
		case DISAPPEAR_BLOCK:
			// if (!IsNear(i, j, k, player.x, player.y, player.z, 1))
			if (Math.random() > 0.5)
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
				R.ctx.fillStyle = "#501010"
			}
			if (extra.opacity !== 1)
			{
				R.ctx.globalAlpha = extra.opacity;
			}
			if (extra.opacity < 0.1)
			{
				doDraw = false;
			}
		break;
		case APPEAR_BLOCK:
			// if (IsNear(i, j, k, player.x, player.y, player.z, 1))
			if (Math.random() > 0.5)
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
				R.ctx.fillStyle = "#105010"
			}
			if (extra.opacity !== 1)
			{
				R.ctx.globalAlpha = extra.opacity;
			}
			if (extra.opacity < 0.1)
			{
				doDraw = false;
			}
		break;
		case PATTERN_BLOCK:
			if (extra.pattern === 0)
			{
				R.ctx.fillStyle = "#800000";
			}
			else
			{
				R.ctx.fillStyle = "#C0C000";
			}
		break;
		case PATTERN_CLEAR_BLOCK:
			R.ctx.fillStyle = "#000080";
		break;
		case PATTERN_ACTIVATE_BLOCK:
			R.ctx.fillStyle = "#400080";
		break;
		case PATTERN_EFFECT_BLOCK:
			extra.opacity = Math.min(0.75, extra.opacity + 0.02);
			R.ctx.globalAlpha = extra.opacity;
		break;
		case PATTERN_HOLE_BLOCK:
			extra.opacity = Math.max(0, extra.opacity - 0.07);
			if (extra.opacity >= 0.1)
			{
				R.ctx.fillStyle = "#800000";
				R.ctx.globalAlpha = extra.opacity;
			}
			else
			{
				doDraw = false;
			}
		break;
		case SIMULATION_BLOCK:
			R.ctx.fillStyle = "#C000C0";
		break;
		case FLUID_BLOCK:
			R.ctx.fillStyle = "#0080C0";
			R.ctx.strokeStyle = "#0080C0";
			R.ctx.globalAlpha = extra.prevFill;
		break;
		case ORB_BLOCK:
			// Draw tile but then draw circle on top
			doDraw = false;
			R.ctx.fillStyle = "#606060";
			if (InCeiling(i, j, k))
			{
				DrawTileInCeiling(x, y, scale);
			}
			else
			{
				DrawTile(x, y, scale, i, j, k);
			}
			if (extra.orbHere)
			{
				R.ctx.fillStyle = "#C0C0C0";
				R.ctx.beginPath();
				R.ctx.arc(x + scale / 2, y + scale / 2, scale / 4, 0, 2 * Math.PI);
				R.ctx.stroke();
				R.ctx.fill();
			}
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
			DrawTile(x, y, scale, i, j, k);
		}
	}
	R.ctx.restore();
}
//i, j, k: world x, y, z position
function DrawTile (x, y, scale, realX, realY, realZ) {
	// If realX isn't passed in, don't bother doing the check
	if ((realX === undefined) || !IsSolid(realX, realY, realZ + 1))
	{
		R.ctx.fillRect(x, y, scale, scale);
		R.ctx.strokeRect(x, y, scale, scale);
	}
}
// Just draws one side of a tile for now
// Need to draw all sides / not draw covered sides before drawing any tiles for that layer
function DrawTileSides (x, y, scale, x2, y2, scale2, realX, realY, realZ) {
	// top side
	if (y > y2 && !IsSolid(realX, realY - 1, realZ))
	{
		R.ctx.beginPath();
		R.ctx.moveTo(x, y);
		R.ctx.lineTo(x2, y2);
		R.ctx.lineTo(x2 + scale2, y2);
		R.ctx.lineTo(x + scale, y);
		R.ctx.closePath();
		R.ctx.fill();
		R.ctx.stroke();
	}
	// bottom side
	if (y2 + scale2 > y + scale && !IsSolid(realX, realY + 1, realZ))
	{
		R.ctx.beginPath();
		R.ctx.moveTo(x, y + scale);
		R.ctx.lineTo(x2, y2 + scale2);
		R.ctx.lineTo(x2 + scale2, y2 + scale2);
		R.ctx.lineTo(x + scale, y + scale);
		R.ctx.closePath();
		R.ctx.fill();
		R.ctx.stroke();
	}
	// left side
	if (x > x2 && !IsSolid(realX - 1, realY, realZ))
	{
		R.ctx.beginPath();
		R.ctx.moveTo(x, y);
		R.ctx.lineTo(x2, y2);
		R.ctx.lineTo(x2, y2 + scale2);
		R.ctx.lineTo(x, y + scale);
		R.ctx.closePath();
		R.ctx.fill();
		R.ctx.stroke();
	}
	// right side
	if (x2 + scale2 > x + scale && !IsSolid(realX + 1, realY, realZ))
	{
		R.ctx.beginPath();
		R.ctx.moveTo(x + scale, y);
		R.ctx.lineTo(x2 + scale2, y2);
		R.ctx.lineTo(x2 + scale2, y2 + scale2);
		R.ctx.lineTo(x + scale, y + scale);
		R.ctx.closePath();
		R.ctx.fill();
		R.ctx.stroke();
	}
}

function DrawAreaEdges (area, scale, z) {
	var x0 = scale * (0 + area.GetX() - R.cameraX) + R.CANVAS_HALF_WIDTH;
	var x1 = scale * (area.xSize + area.GetX() - R.cameraX) + R.CANVAS_HALF_WIDTH;
	var y0 = scale * (0 + area.GetY() - R.cameraY) + R.CANVAS_HALF_HEIGHT;
	var y1 = scale * (area.ySize + area.GetY() - R.cameraY) + R.CANVAS_HALF_HEIGHT;
	R.ctx.save();

	// Dark cover over tiles below the edit level
	if (R.EDIT_MODE && z === Math.floor(R.cameraZ) - 1)
	{
		R.ctx.fillStyle = "#000000";
		R.ctx.globalAlpha = 0.7;
		R.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
	}
	// R.ctx.strokeStyle = areaColors[areas.indexOf(area)];
	// Only in editior
	if (area === curArea)
	{
		R.ctx.strokeStyle = "#00FFFF";
		R.ctx.lineWidth = 2;
	}
	else
	{
		R.ctx.strokeStyle = "#FFFFFF";
	}
	R.ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

	// Light cover over tiles at the current edit level
	if (R.EDIT_MODE && z === Math.floor(R.cameraZ))
	{
		R.ctx.fillStyle = "#FFFFFF";
		R.ctx.globalAlpha = 0.15;
		R.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
	}
	R.ctx.restore();
}

function InCeiling () {
	// re-implement this feature later
	return false;
}
/*function InCeiling (x, y, z) {
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
}*/

function IsSolid () {
	return false;
}
/*function IsSolid (x, y, z) {
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
}*/

////////////////////////// OLD STUFF ////////////////////////// OLD STUFF ////////////////////////// OLD STUFF //////////////////////////
if (false) {
////////////////////////// OLD STUFF ////////////////////////// OLD STUFF ////////////////////////// OLD STUFF //////////////////////////


/**/// Camera
/**/var xCam = 0;
/**/var yCam = 0;
/**/var zCam = 0;
/**/
/**/// Colors to use for rendering
/**/var COLOR_TILE = "#101010";
/**/var COLOR_BORDER = "#FFFFFF";
/**/var BACKGROUND = "#000000";
/**/
/**/
/**/function Render () {
/**/
/**/	//Camera position
/**/	if (middleClick)
/**/	{
/**/		xCam += (midStartX - mouseX) / 58.8;
/**/		yCam += (midStartY - mouseY) / 58.8;
/**/		zCam = (zCam * 4 + GetEntityZ(player)) * 0.2;
/**/		midStartX = mouseX;
/**/		midStartY = mouseY;
/**/	}
/**/	else
/**/	{
/**/		//Standard camera movement
/**/		xCam = (xCam * 4 + GetEntityX(player) + 0.5) * 0.2;
/**/		yCam = (yCam * 4 + GetEntityY(player) + 0.5) * 0.2;
/**/		zCam = (zCam * 4 + GetEntityZ(player)) * 0.2;
/**/		if (editorActive)
/**/		{
/**/			xCam = (xCam * 1 + GetEntityX(player) + 0.5) * 0.5;
/**/			yCam = (yCam * 1 + GetEntityY(player) + 0.5) * 0.5;
/**/			zCam = (zCam * 1 + GetEntityZ(player)) * 0.5;
/**/		}
/**/	}
/**/
/**/	//Canvas rendering
/**/	canvas.width = canvas.width;
/**/
/**/	//Set standard font
/**/	ctx.font = "16px sans-serif";
/**/
/**/	ctx.strokeStyle = COLOR_BORDER;
/**/	ctx.fillStyle = COLOR_TILE;
/**/
/**/	numSquares = 0;
/**/
/**/	GetFirstTransparentTiles();
/**/	underCeiling = UnderCeilingCheck();
/**/
/**/	DrawAllObjects();
/**/	DrawAllMessages();
/**/
/**/	if (edgeSquareLimit.active)
/**/	{
/**/		edgeSquareLimit.x -= 3;
/**/		edgeSquareLimit.y -= 3;
/**/		edgeSquareLimit.xSize += 6;
/**/		edgeSquareLimit.ySize += 6;
/**/		if (edgeSquareLimit.xSize > CANVAS_WIDTH + 310)
/**/		{
/**/			edgeSquareLimit.active = false;
/**/		}
/**/		edgeSquareLimit.x = 10;
/**/		edgeSquareLimit.xSize = 580;
/**/		edgeSquareLimit.y = 10;
/**/		edgeSquareLimit.ySize = 580;
/**/	}
/**/
/**/	if (showStats)
/**/	{
/**/		ctx.fillStyle = "#FFFFFF";
/**/		ctx.fillRect(0, 0, 100, 200)
/**/
/**/		ctx.strokeStyle = "#800000";
/**/		ctx.strokeText("delay:", 5, 20);
/**/		ctx.strokeText(delay, 70, 20);
/**/		ctx.strokeText("avg delay:", 5, 40);
/**/		ctx.strokeText(Math.round(totalDelay / frameCount), 70, 40);
/**/		ctx.strokeText("squares:", 5, 60);
/**/		ctx.strokeText(numSquares, 70, 60);
/**/
/**/		ctx.strokeStyle = "#008000";
/**/		ctx.strokeText("X(player):", 5, 80);
/**/		ctx.strokeText(GetEntityX(player), 70, 80);
/**/		ctx.strokeText("Y(player):", 5, 100);
/**/		ctx.strokeText(GetEntityY(player), 70, 100);
/**/		ctx.strokeText("Z(player):", 5, 120);
/**/		ctx.strokeText(GetEntityZ(player), 70, 120);
/**/	}
/**/
/**/	if (editorActive)
/**/	{
/**/
/**/		//Draw tile select left sidebar
/**/		ctx.fillStyle = "#300030";
/**/		ctx.fillRect(0, 0, 70, CANVAS_HEIGHT);
/**/		for (var i = 0; i < TILE_TYPES; i++)
/**/		{
/**/			//Selected tile highlight
/**/			if (editTypeL === i || editTypeR === i)
/**/			{
/**/				ctx.save();
/**/				ctx.globalAlpha = 0.5;
/**/				ctx.fillStyle = (editTypeL === i) ? "#CCCCCC" : "#000000";
/**/				ctx.fillRect(0, i * 60, 70, 70);
/**/				ctx.restore();
/**/			}
/**/			DrawTileExtra(10, 10 + i * 60, 50, i, -9999, -9999, -9999, fakeExtra);
/**/		}
/**/
/**/		//Draw area/other menu right sidebar
/**/		ctx.fillStyle = "#303000";
/**/		ctx.fillRect(CANVAS_WIDTH - 200, 0, 200, CANVAS_HEIGHT);
/**/		//Draw area/other buttons
/**/		var eBI = 0; //Editor Button Iteration
/**/		DrawEditorButton(eBI, "Exit Editor");
/**/		eBI++;
/**/		DrawEditorButton(eBI, "Create Area " + (shiftPressed ? "10x10x10" : "5x5x5"));
/**/		eBI++;
/**/		DrawEditorButton(eBI, "Remove Area");
/**/		eBI++;
/**/		DrawEditorButton(eBI, "Resize Area");
/**/		eBI++;
/**/		DrawEditorButton(eBI, "Load Level");
/**/		eBI++;
/**/		DrawEditorButton(eBI, "Save Level");
/**/		eBI++;
/**/		DrawEditorButton(eBI, "Create Entity");
/**/		eBI++;
/**/		DrawEditorButton(eBI, "Remove Entity");
/**/		eBI++;
/**/		DrawEditorButton(eBI, (editingEntity ? "Done Editing" : "Edit Entity"));
/**/		eBI++;
/**/
/**/		//Draw area selector top bar
/**/		ctx.fillStyle = "#404040";
/**/		ctx.fillRect(70, 0, CANVAS_WIDTH - 270, 40);
/**/		ctx.fillStyle = "#FFFFFF";
/**/		var infoString = "Level 1: " + GetAreasAtPosition(player.x, player.y, player.z, true).join(", ");
/**/		ctx.fillText(infoString, 70, 30);
/**/
/**/
/**/
/**/
/**/		//Draw rules menu bottom bar if editing rules
/**/		if (editingEntity && currentEntity !== undefined)
/**/		{
/**/			// Draw normal box but only highlight on hover if in normal mode
/**/			ruleHoverPossible = (editingEntityMode === E_MODE_NORMAL);
/**/
/**/			ctx.save();
/**/			ctx.globalAlpha = 0.8;
/**/			ctx.fillStyle = "#003030";
/**/			ctx.fillRect(170, 150, CANVAS_WIDTH - 470, CANVAS_HEIGHT - 150);
/**/
/**/			var xPos = 180;
/**/			var yPos = 180;
/**/
/**/			ruleHoverMode = E_MODE_NORMAL;
/**/			ruleHoverSpot = undefined;
/**/			
/**/			var rules = currentEntity.rules;
/**/			for (var i = 0; i < rules.length; i++)
/**/			{
/**/				var rule = rules[i];
/**/				yPos = DrawRule(rule, xPos, yPos);
/**/				yPos += Y_RULE_ADJ; // Extra space between rules
/**/			}
/**/
/**/			DrawRuleText("+ (add trigger) ...", "#CCFFCC", xPos, yPos, rules, E_MODE_CHOOSE_TRIGGER);
/**/
/**/			// Hover highlight possible for whatever mode is on top (if any)
/**/			ruleHoverPossible = true;
/**/
/**/			if (editingEntityMode === E_MODE_CHOOSE_TRIGGER)
/**/			{
/**/				// Trigger
/**/				ctx.fillStyle = "#300000";
/**/				ctx.fillRect(270, 250, CANVAS_WIDTH - 670, CANVAS_HEIGHT - 250);
/**/				xPos = 280;
/**/				yPos = 280;
/**/				for (var trigger in TRIGGERS)
/**/				{
/**/					if (TRIGGERS.hasOwnProperty(trigger))
/**/					{
/**/						var triggerNum = TRIGGERS[trigger];
/**/						var tText = triggersText[triggerNum];
/**/						DrawRuleText(tText, "#FFCCCC", xPos, yPos, triggerNum, E_MODE_NORMAL);
/**/						yPos += Y_RULE_ADJ;
/**/					}
/**/				}
/**/				yPos += Y_RULE_ADJ;
/**/				DrawRuleText("Cancel", "#CCCCCC", xPos, yPos, -1, E_MODE_NORMAL);
/**/			}
/**/			else if (editingEntityMode === E_MODE_CHOOSE_RULE)
/**/			{
/**/				var boxWidth = (CANVAS_WIDTH - 670) / 2;
/**/
/**/				// Condition
/**/				ctx.fillStyle = "#000030";
/**/				ctx.fillRect(270, 250, boxWidth, CANVAS_HEIGHT - 250);
/**/				xPos = 280;
/**/				yPos = 280;
/**/				for (var condition in CONDITIONS)
/**/				{
/**/					if (CONDITIONS.hasOwnProperty(condition))
/**/					{
/**/						var conditionNum = CONDITIONS[condition];
/**/						var cText = conditionsText[conditionNum];
/**/						DrawRuleText(cText, "#FFCCCC", xPos, yPos, conditionNum, E_MODE_EDIT_RULE);
/**/						yPos += Y_RULE_ADJ;
/**/					}
/**/				}
/**/				yPos += Y_RULE_ADJ;
/**/				DrawRuleText("Cancel", "#CCCCCC", xPos, yPos, undefined, E_MODE_NORMAL);
/**/
/**/				// Result
/**/				ctx.fillStyle = "#303000";
/**/				ctx.fillRect(270 + boxWidth, 250, boxWidth, CANVAS_HEIGHT - 250);
/**/				xPos = 280 + boxWidth;
/**/				yPos = 280;
/**/				for (var result in RESULTS)
/**/				{
/**/					if (RESULTS.hasOwnProperty(result))
/**/					{
/**/						var resultNum = RESULTS[result];
/**/						var rText = resultsText[resultNum];
/**/						DrawRuleText(rText, "#FFCCCC", xPos, yPos, resultNum, E_MODE_EDIT_RULE);
/**/						yPos += Y_RULE_ADJ;
/**/					}
/**/				}
/**/				yPos += Y_RULE_ADJ;
/**/				DrawRuleText("Cancel", "#CCCCCC", xPos, yPos, undefined, E_MODE_NORMAL);
/**/			}
/**/			else if (editingEntityMode === E_MODE_EDIT_RULE)
/**/			{
/**/				var spotValues = undefined;
/**/				var titleString = "";
/**/				if (editingEntitySpot.trigger)
/**/				{
/**/					ctx.fillStyle = "#300000";
/**/					spotValues = editingEntitySpot.trigValues;
/**/					titleString = "Editing Trigger: " + triggersText[editingEntitySpot.trigger];
/**/				}
/**/				else if (editingEntitySpot.condition)
/**/				{
/**/					ctx.fillStyle = "#000030";
/**/					spotValues = editingEntitySpot.condValues;
/**/					titleString = "Editing Condition: " + conditionsText[editingEntitySpot.condition];
/**/				}
/**/				else if (editingEntitySpot.result)
/**/				{
/**/					ctx.fillStyle = "#303000";
/**/					spotValues = editingEntitySpot.resValues;
/**/					titleString = "Editing Result: " + resultsText[editingEntitySpot.result];
/**/				}
/**/				ctx.fillRect(270, 250, CANVAS_WIDTH - 670, CANVAS_HEIGHT - 250);
/**/				xPos = 280;
/**/				yPos = 280;
/**/
/**/				ruleHoverPossible = false;
/**/				DrawRuleText(titleString, "#CCCCCC", xPos, yPos, undefined, undefined);
/**/				yPos += Y_RULE_ADJ;
/**/				yPos += Y_RULE_ADJ;
/**/				ruleHoverPossible = true;
/**/
/**/				var hasValue = false;
/**/				for (var sValue in spotValues)
/**/				{
/**/					if (spotValues.hasOwnProperty(sValue))
/**/					{
/**/						var vText = sValue + ": " + spotValues[sValue];
/**/						DrawRuleText(vText, "#CCCCCC", xPos, yPos, sValue, E_MODE_EDIT_VALUE);
/**/						yPos += Y_RULE_ADJ;
/**/						hasValue = true;
/**/					}
/**/				}
/**/				if (!hasValue)
/**/				{
/**/					ruleHoverPossible = false;
/**/					DrawRuleText("(No values to edit)", "#CCCCCC", xPos, yPos, undefined, E_MODE_NORMAL);
/**/					yPos += Y_RULE_ADJ;
/**/					ruleHoverPossible = true;
/**/				}
/**/				yPos += Y_RULE_ADJ;
/**/				DrawRuleText("Done", "#CCCCCC", xPos, yPos, undefined, E_MODE_NORMAL);
/**/			}
/**/
/**/			if (editingValueSpot !== undefined)
/**/			{
/**/				// Draw yet another box, with the value to edit's name and a box to type into
/**/
/**/				ctx.fillStyle = "#000000";
/**/				ctx.fillRect(290, 270, CANVAS_WIDTH - 710, CANVAS_HEIGHT - 270);
/**/				xPos = 310;
/**/				yPos = 310;
/**/				ruleHoverPossible = false;
/**/				DrawRuleText(editingValueSpot, "#CCCCCC", xPos, yPos, undefined, E_MODE_NORMAL);
/**/				yPos += Y_RULE_ADJ;
/**/
/**/				DrawRuleText(editValue, "#CCCCCC", xPos, yPos, undefined, E_MODE_NORMAL);
/**/				yPos += Y_RULE_ADJ;
/**/				yPos += Y_RULE_ADJ;
/**/
/**/				ruleHoverPossible = true;
/**/				DrawRuleText("Done", "#CCCCCC", xPos, yPos, undefined, E_MODE_NORMAL);
/**/				yPos += Y_RULE_ADJ;
/**/			}
/**/
/**/			ctx.restore();
/**/		}
/**/	}
/**/	else
/**/	{
/**/		DrawEditorButton(0, "Enter Editor");
/**/	}
/**/} 
/**/var X_RULE_ADJ = 25;
/**/var Y_RULE_ADJ = 15;
/**/
/**/// Returns the Y dist to move
/**/function DrawRule (rule, xPos, yPos) {
/**/	var spotAvailable = false;
/**/	if (rule.trigger) {
/**/
/**/		DrawRuleText("When: " + triggersText[rule.trigger], "#FFCCCC", xPos, yPos, rule, E_MODE_EDIT_RULE);
/**/		yPos += Y_RULE_ADJ;
/**/	}
/**/	else if (rule.condition)
/**/	{
/**/		DrawRuleText("If: " + conditionsText[rule.condition] + " " + JSON.stringify(rule.condValues), "#CCCCFF", xPos, yPos, rule, E_MODE_EDIT_RULE);
/**/		yPos += Y_RULE_ADJ;
/**/		spotAvailable = true
/**/	}
/**/	else if (rule.result)
/**/	{
/**/		DrawRuleText(resultsText[rule.result] + " " + JSON.stringify(rule.resValues), "#FFFFCC", xPos, yPos, rule, E_MODE_EDIT_RULE);
/**/		yPos += Y_RULE_ADJ;
/**/		spotAvailable = true
/**/	}
/**/
/**/	if (rule.eventBlock)
/**/	{
/**/		for (var i = 0; i < rule.eventBlock.length; i++)
/**/		{
/**/			var innerRule = rule.eventBlock[i];
/**/			yPos = DrawRule(innerRule, xPos + X_RULE_ADJ, yPos);
/**/		}
/**/		DrawRuleText("+ (add rule) ...", "#CCFFCC", xPos + X_RULE_ADJ, yPos, rule.eventBlock, E_MODE_CHOOSE_RULE);
/**/		yPos += Y_RULE_ADJ;
/**/	}
/**/	if (rule.trueBlock)
/**/	{
/**/		DrawRuleText("Then:", "#CCCCFF", xPos, yPos, undefined, E_MODE_NORMAL);
/**/		yPos += Y_RULE_ADJ;
/**/
/**/		for (var i = 0; i < rule.trueBlock.length; i++)
/**/		{
/**/			var innerRule = rule.trueBlock[i];
/**/			yPos = DrawRule(innerRule, xPos + X_RULE_ADJ, yPos);
/**/		}
/**/		DrawRuleText("+ (add rule) ...", "#CCFFCC", xPos + X_RULE_ADJ, yPos, rule.trueBlock, E_MODE_CHOOSE_RULE);
/**/		yPos += Y_RULE_ADJ;
/**/	}
/**/	if (rule.falseBlock)
/**/	{
/**/		DrawRuleText("Else:", "#CCCCFF", xPos, yPos, undefined, E_MODE_NORMAL);
/**/		yPos += Y_RULE_ADJ;
/**/		for (var i = 0; i < rule.falseBlock.length; i++)
/**/		{
/**/			var innerRule = rule.falseBlock[i];
/**/			yPos = DrawRule(innerRule, xPos + X_RULE_ADJ, yPos);
/**/		}
/**/		DrawRuleText("+ (add rule) ...", "#CCFFCC", xPos + X_RULE_ADJ, yPos, rule.falseBlock, E_MODE_CHOOSE_RULE);
/**/		yPos += Y_RULE_ADJ;
/**/	}
/**/	//if (spotAvailable)
/**/	//{
/**/	//	DrawRuleText("+ (add rule) ...", "#CCFFCC", xPos, yPos, rule);
/**/	//	yPos += Y_RULE_ADJ;
/**/	//}
/**/	return yPos;
/**/}
/**/
/**/
/**/function DrawEditorButton (btnNum, text) {
/**/	ctx.fillStyle = "#303030";
/**/	ctx.fillRect(CANVAS_WIDTH - 190, 10 + btnNum * 60, 170, 50);
/**/	ctx.fillStyle = "#FFFFFF";
/**/	ctx.fillText(text, CANVAS_WIDTH - 90 - text.length * 5, 40 + btnNum * 60);
/**/}
/**/
/**/function DrawAllMessages () {
/**/	ctx.save();
/**/	ctx.fillStyle = "#FFFFFF";
/**/	for (var i = messages.length - 1; i >= 0; i--) {
/**/		var message = messages[i];
/**/		var x = -100;
/**/		var y = -100;
/**/		var gotLocation = false;
/**/		if (message.targetType === MESG_TARGET_PLAYER)
/**/		{
/**/			x = GetScale(GetEntityZ(player)) * (GetEntityX(player) - xCam) + CANVAS_HALF_WIDTH;
/**/			y = GetScale(GetEntityZ(player)) * (GetEntityY(player) - yCam) + CANVAS_HALF_HEIGHT;
/**/			gotLocation = true;
/**/		}
/**/		else if (message.targetType === MESG_TARGET_OTHER_PLAYER)
/**/		{
/**/			if (MULTI_ON)
/**/			{
/**/				for (var np = 0; np < playerArray.length; np++)
/**/				{
/**/					var nPlayer = playerArray[np];
/**/					if (nPlayer.id === message.id)
/**/					{
/**/						x = GetScale(nPlayer.z) * (nPlayer.x - xCam) + CANVAS_HALF_WIDTH;
/**/						y = GetScale(nPlayer.z) * (nPlayer.y - yCam) + CANVAS_HALF_HEIGHT;
/**/						gotLocation = true;
/**/					}
/**/				}
/**/			}
/**/		}
/**/		else if (message.targetType === MESG_TARGET_ENTITY)
/**/		{
/**/			x = GetScale(message.target.z) * (message.target.x - xCam) + CANVAS_HALF_WIDTH;
/**/			y = GetScale(message.target.z) * (message.target.y - yCam) + CANVAS_HALF_HEIGHT;
/**/			gotLocation = true;
/**/		}
/**/
/**/		if (gotLocation)
/**/		{
/**/			DrawTextBox(message.text, x, y);
/**/		}
/**/
/**/		// Remove messages after some time
/**/		message.timer --;
/**/		if (message.timer <= 0)
/**/		{
/**/			messages.splice(i, 1);
/**/		}
/**/	}
/**/	if (writingMessage)
/**/	{
/**/		var x = GetScale(GetEntityZ(player)) * (GetEntityX(player) - xCam) + CANVAS_HALF_WIDTH;
/**/		var y = GetScale(GetEntityZ(player)) * (GetEntityY(player) - yCam + 1.1) + CANVAS_HALF_HEIGHT;
/**/		DrawTextBox("> " + messageInput, x, y);
/**/	}
/**/	ctx.restore();
/**/}
/**/
/**/function DrawTextBox (text, x, y) {
/**/	// ctx.fillText(text, x, y);
/**/	DrawTextRaw(text, "#FFFFFF", x, y);
/**/}
/**/
/**/// Draw a text box, given a string, color, and position
/**/// Does fade out stuff
/**/function DrawTextRaw (text, color, x, y) {
/**/	ctx.save();
/**/	ctx.fillStyle = "#000000";
/**/	ctx.strokeStyle = color;
/**/	var boxWidth = ctx.measureText(text).width + 6;
/**/	ctx.globalAlpha = 0.85;
/**/	ctx.fillRect(x - boxWidth / 2, y - 12, boxWidth, 16);
/**/	ctx.strokeRect(x - boxWidth / 2, y - 12, boxWidth, 16);
/**/	ctx.globalAlpha = 1;
/**/	ctx.fillStyle = color;
/**/	DrawText(text, x + 3 - boxWidth / 2, y);
/**/	ctx.restore();
/**/}
/**/
/**/function DrawRuleText (text, color, x, y, hoverPoint, hoverType) {
/**/	ctx.save();
/**/	ctx.strokeStyle = color;
/**/	ctx.fillStyle = "#000000";
/**/	var boxWidth = ctx.measureText(text).width + 6;
/**/
/**/	if (ruleHoverPossible && Between(x, mouseX, x + boxWidth) && Between(y, mouseY, y + 16))
/**/	{
/**/		ctx.fillStyle = "#505050";
/**/
/**/		ruleHoverSpot = hoverPoint;
/**/		ruleHoverMode = hoverType;
/**/	}
/**/
/**/	ctx.save();
/**/	ctx.globalAlpha *= 0.85;
/**/	ctx.fillRect(x, y, boxWidth, 16);
/**/	ctx.strokeRect(x, y, boxWidth, 16);
/**/	ctx.restore();
/**/
/**/	ctx.fillStyle = color;
/**/	DrawText(text, x + 3, y + 12);
/**/	ctx.restore();
/**/}
/**/
/**/// Draws text, after rounding to nearest x, y
/**/function DrawText (text, x, y) {
/**/	// Simple rounding technique
/**/	ctx.fillText(text, (0.5 + x) | 0, (0.5 + y) | 0);
/**/}
/**/
/**/
/**/function DrawAllObjects () {
/**/	if (drawObjects.length === 0)
/**/	{
/**/		//no objects to draw
/**/		return;
/**/	}
/**/	drawObjects.forEach(function (obj) {
/**/		SetDrawZ(obj);
/**/	});
/**/	drawObjects.sort(function (a, b) {
/**/		if (a.isEntity !== b.isEntity)
/**/		{
/**/			if (a.isEntity) return a.drawZ + 0.01 - b.drawZ;
/**/			else return a.drawZ - b.drawZ - 0.01;
/**/		}
/**/		if (a.drawZ - b.drawZ < 0.05)
/**/		{
/**/			var offsetA = (a.isEntity ? entities.indexOf(a) : (a.isArea ? areas.indexOf(a) : 0)) * 0.01;
/**/			var offsetB = (b.isEntity ? entities.indexOf(b) : (b.isArea ? areas.indexOf(b) : 0)) * 0.01;
/**/			return ((a.drawZ + offsetA) - (b.drawZ + offsetB));
/**/		}
/**/		return a.drawZ - b.drawZ;
/**/	});
/**/	var bottomZ = drawObjects[0].drawZ - 1;
/**/	var topZ = drawObjects[drawObjects.length - 1].drawZ;
/**/	var bottomI = 0;
/**/	for (var i = 0; i < drawObjects.length; i++)
/**/	{
/**/		if (drawObjects[i].type === "Area")
/**/		{
/**/			//Only areas can have a higher z than the last object
/**/			topZ = Math.max(topZ, drawObjects[i].drawZ + drawObjects[i].zSize);
/**/		}
/**/	}
/**/	for (var z = bottomZ; z <= topZ + 1; z++)
/**/	{
/**/		var i = bottomI;
/**/		var currentObject = drawObjects[i];
/**/
/**/		//Loop through objects, stopping when no more objects or next object is above currentZ
/**/		while (currentObject !== undefined && currentObject.drawZ - 1 <= z)
/**/		{
/**/			if (DObjInZ(currentObject, z))
/**/			{
/**/				// Draw the tops of cubes
/**/				DrawDObjZ(currentObject, z, false);
/**/			}
/**/			if (DObjInZ(currentObject, z + 1))
/**/			{
/**/				// Draw the sides of cubes
/**/				DrawDObjZ(currentObject, z + 1, true);
/**/			}
/**/
/**/			//move bottomI up when possible
/**/			if (i === bottomI)
/**/			{
/**/				if (currentObject.type === "Entity")
/**/				{
/**/					if (z > currentObject.drawZ)
/**/					{
/**/						bottomI ++;
/**/					}
/**/				}
/**/				else if (currentObject.type === "Area")
/**/				{
/**/					if (z > currentObject.drawZ + currentObject.zSize)
/**/					{
/**/						bottomI ++;
/**/					}
/**/				}
/**/			}
/**/			
/**/
/**/
/**/			i ++;
/**/			currentObject = drawObjects[i];
/**/		}
/**/	}
/**/}
/**/
/**/
/**///Draw Object in Z: returns true if the object should be drawn at the given z
/**/function DObjInZ (dObj, z) {
/**/	if (dObj.type === "Entity")
/**/	{
/**/		return Math.ceil(GetEntityZ(dObj)) === z;
/**/	}
/**/	else if (dObj.type === "Area")
/**/	{
/**/		return (dObj.z <= z && dObj.z + dObj.zSize > z);
/**/	}
/**/	else
/**/	{
/**/		return Math.ceil(dObj.z) === z;
/**/	}
/**/}
/**/
/**/// Entity - DrawEntity
/**/// Area - DrawAreaZSlice
/**/// Other - should be a Network Player
/**/
/**/// drawSideTiles - true: draw the side tiles, false/default: draw the top
/**/function DrawDObjZ (dObj, z, drawSideTiles) {
/**/	if (dObj.type === "Entity")
/**/	{
/**/		if (drawSideTiles)
/**/		{
/**/
/**/		}
/**/		else
/**/		{
/**/			DrawEntity(dObj);
/**/		}
/**/	}
/**/	else if (dObj.type === "Area")
/**/	{
/**/		if (drawSideTiles)
/**/		{
/**/			DrawAreaZSliceSideTiles(dObj, z);
/**/		}
/**/		else
/**/		{
/**/			DrawAreaZSlice(dObj, z);
/**/		}
/**/	}
/**/	else
/**/	{
/**/		// Otherwise: Network player
/**/		if (drawSideTiles)
/**/		{
/**/
/**/		}
/**/		else
/**/		{
/**/			DrawNPlayer(dObj);
/**/		}
/**/	}
/**/}
/**/
/**/function DrawAreaZSlice (area, z) {
/**/	var realZ = z;
/**/	var scale = GetScale(z + GetAreaZ(area) - area.z);
/**/	if (scale > 0.01)
/**/	{
/**/		for (var i = 0; i < area.xSize; i++)
/**/		{
/**/			var realX = i + GetAreaX(area);
/**/			var x = scale * (i + GetAreaX(area) - xCam) + CANVAS_HALF_WIDTH;
/**/			if (x > 0 - scale && x < CANVAS_WIDTH)
/**/			{
/**/				for (var j = 0; j < area.ySize; j++)
/**/				{
/**/					var realY = j + GetAreaY(area)
/**/					var y = scale * (j + GetAreaY(area) - yCam) + CANVAS_HALF_HEIGHT;
/**/					if (y > 0 - scale && y < CANVAS_HEIGHT)
/**/					{	
/**/						var tile = area.map[i][j][z - area.z];
/**/						if (tile > 0)
/**/						{
/**/							if (tile > 1)
/**/							{
/**/								DrawTileExtra(x, y, scale, tile, i + area.x, j + area.y, z, area.extraData[i][j][z - area.z]);
/**/							}
/**/							else
/**/							{
/**/								//SOLID tile
/**/								if (InCeiling(i + area.x, j + area.y, z))
/**/								{
/**/									DrawTileInCeiling(x, y, scale);
/**/								}
/**/								else
/**/								{
/**/									DrawTile(x, y, scale, realX, realY, realZ);
/**/								}
/**/							}
/**/							numSquares ++;
/**/						}
/**/					}
/**/				}
/**/			}
/**/		}
/**/		if (editorActive)
/**/		{
/**/			DrawAreaEdges(area, scale, z);
/**/		}
/**/	}
/**/}
/**/
/**/function DrawAreaZSliceSideTiles (area, z) {
/**/	var realZ = z;
/**/	var scale = GetScale(z + GetAreaZ(area) - area.z);
/**/	var scale2 = GetScale(-1 + z + GetAreaZ(area) - area.z);
/**/	if (scale > 0.01)
/**/	{
/**/		for (var i = 0; i < area.xSize; i++)
/**/		{
/**/			var realX = i + GetAreaX(area);
/**/			var x = scale * (realX - xCam) + CANVAS_HALF_WIDTH;
/**/			var x2 = scale2 * (realX - xCam) + CANVAS_HALF_WIDTH;
/**/			if (x2 > 0 - scale2 && x2 < CANVAS_WIDTH)
/**/			{
/**/				for (var j = 0; j < area.ySize; j++)
/**/				{
/**/					var realY = j + GetAreaY(area)
/**/					var y = scale * (realY - yCam) + CANVAS_HALF_HEIGHT;
/**/					var y2 = scale2 * (realY - yCam) + CANVAS_HALF_HEIGHT;
/**/					if (y2 > 0 - scale2 && y2 < CANVAS_HEIGHT)
/**/					{	
/**/						var tile = area.map[i][j][z - area.z];
/**/						if (tile > 0)
/**/						{
/**/							if (tile > 1)
/**/							{
/**/								// DrawTileExtra(x, y, scale, tile, i + area.x, j + area.y, z, area.extraData[i][j][z - area.z]);
/**/							}
/**/							else
/**/							{
/**/								//SOLID tile
/**/								if (InCeiling(i + area.x, j + area.y, z))
/**/								{
/**/									// DrawTileInCeiling(x, y, scale);
/**/								}
/**/								else
/**/								{
/**/									DrawTileSides(x, y, scale, x2, y2, scale2, realX, realY, realZ);
/**/								}
/**/							}
/**/							numSquares ++;
/**/						}
/**/					}
/**/				}
/**/			}
/**/		}
/**/		if (editorActive)
/**/		{
/**/			// DrawAreaEdges(area, scale, z);
/**/		}
/**/	}
/**/}
/**/
/**/function DrawTileExtra (x, y, scale, tile, i, j, k, extra) {
/**/	ctx.save();
/**/	var doDraw = true;
/**/	switch (tile)
/**/	{
/**/		default:
/**/			
/**/		break;
/**/		case EMPTY:
/**/			doDraw = false;
/**/		break;
/**/		case DISAPPEAR_BLOCK:
/**/			if (!IsNear(i, j, k, player.x, player.y, player.z, 1))
/**/			{
/**/				extra.opacity = Math.min(1, extra.opacity + 0.07);
/**/			}
/**/			else
/**/			{
/**/				extra.opacity = Math.max(0, extra.opacity - 0.07);
/**/			}
/**/			if (editorActive)
/**/			{
/**/				extra.opacity = 1;
/**/				ctx.fillStyle = "#501010"
/**/			}
/**/			if (extra.opacity !== 1)
/**/			{
/**/				ctx.globalAlpha = extra.opacity;
/**/			}
/**/			if (extra.opacity < 0.1)
/**/			{
/**/				doDraw = false;
/**/			}
/**/		break;
/**/		case APPEAR_BLOCK:
/**/			if (IsNear(i, j, k, player.x, player.y, player.z, 1))
/**/			{
/**/				extra.opacity = Math.min(1, extra.opacity + 0.07);
/**/			}
/**/			else
/**/			{
/**/				extra.opacity = Math.max(0, extra.opacity - 0.07);
/**/			}
/**/			if (editorActive)
/**/			{
/**/				extra.opacity = 1;
/**/				ctx.fillStyle = "#105010"
/**/			}
/**/			if (extra.opacity !== 1)
/**/			{
/**/				ctx.globalAlpha = extra.opacity;
/**/			}
/**/			if (extra.opacity < 0.1)
/**/			{
/**/				doDraw = false;
/**/			}
/**/		break;
/**/		case PATTERN_BLOCK:
/**/			if (extra.pattern === 0)
/**/			{
/**/				ctx.fillStyle = "#800000";
/**/			}
/**/			else
/**/			{
/**/				ctx.fillStyle = "#C0C000";
/**/			}
/**/		break;
/**/		case PATTERN_CLEAR_BLOCK:
/**/			ctx.fillStyle = "#000080";
/**/		break;
/**/		case PATTERN_ACTIVATE_BLOCK:
/**/			ctx.fillStyle = "#400080";
/**/		break;
/**/		case PATTERN_EFFECT_BLOCK:
/**/			extra.opacity = Math.min(0.75, extra.opacity + 0.02);
/**/			ctx.globalAlpha = extra.opacity;
/**/		break;
/**/		case PATTERN_HOLE_BLOCK:
/**/			extra.opacity = Math.max(0, extra.opacity - 0.07);
/**/			if (extra.opacity >= 0.1)
/**/			{
/**/				ctx.fillStyle = "#800000";
/**/				ctx.globalAlpha = extra.opacity;
/**/			}
/**/			else
/**/			{
/**/				doDraw = false;
/**/			}
/**/		break;
/**/		case SIMULATION_BLOCK:
/**/			ctx.fillStyle = "#C000C0";
/**/		break;
/**/		case FLUID_BLOCK:
/**/			ctx.fillStyle = "#0080C0";
/**/			ctx.strokeStyle = "#0080C0";
/**/			ctx.globalAlpha = extra.prevFill;
/**/		break;
/**/		case ORB_BLOCK:
/**/			// Draw tile but then draw circle on top
/**/			doDraw = false;
/**/			ctx.fillStyle = "#606060";
/**/			if (InCeiling(i, j, k))
/**/			{
/**/				DrawTileInCeiling(x, y, scale);
/**/			}
/**/			else
/**/			{
/**/				DrawTile(x, y, scale, i, j, k);
/**/			}
/**/			if (extra.orbHere)
/**/			{
/**/				ctx.fillStyle = "#C0C0C0";
/**/				ctx.beginPath();
/**/				ctx.arc(x + scale / 2, y + scale / 2, scale / 4, 0, 2 * Math.PI);
/**/				ctx.stroke();
/**/				ctx.fill();
/**/			}
/**/
/**/		break;
/**/	}
/**/	if (doDraw)
/**/	{
/**/		if (InCeiling(i, j, k))
/**/		{
/**/			DrawTileInCeiling(x, y, scale);
/**/		}
/**/		else
/**/		{
/**/			DrawTile(x, y, scale, i, j, k);
/**/		}
/**/	}
/**/	ctx.restore();
/**/}
/**/
/**///i, j, k: world x, y, z position
/**/function DrawTile (x, y, scale, realX, realY, realZ) {
/**/	// If realX isn't passed in, don't bother doing the check
/**/	if ((realX === undefined) || !IsSolid(realX, realY, realZ + 1))
/**/	{
/**/		ctx.fillRect(x, y, scale, scale);
/**/		ctx.strokeRect(x, y, scale, scale);
/**/	}
/**/}
/**/
/**/// Just draws one side of a tile for now
/**/// Need to draw all sides / not draw covered sides before drawing any tiles for that layer
/**/function DrawTileSides (x, y, scale, x2, y2, scale2, realX, realY, realZ) {
/**/	// top side
/**/	if (y > y2 && !IsSolid(realX, realY - 1, realZ))
/**/	{
/**/		ctx.beginPath();
/**/		ctx.moveTo(x, y);
/**/		ctx.lineTo(x2, y2);
/**/		ctx.lineTo(x2 + scale2, y2);
/**/		ctx.lineTo(x + scale, y);
/**/		ctx.closePath();
/**/		ctx.fill();
/**/		ctx.stroke();
/**/	}
/**/
/**/	// bottom side
/**/	if (y2 + scale2 > y + scale && !IsSolid(realX, realY + 1, realZ))
/**/	{
/**/		ctx.beginPath();
/**/		ctx.moveTo(x, y + scale);
/**/		ctx.lineTo(x2, y2 + scale2);
/**/		ctx.lineTo(x2 + scale2, y2 + scale2);
/**/		ctx.lineTo(x + scale, y + scale);
/**/		ctx.closePath();
/**/		ctx.fill();
/**/		ctx.stroke();
/**/	}
/**/
/**/	// left side
/**/	if (x > x2 && !IsSolid(realX - 1, realY, realZ))
/**/	{
/**/		ctx.beginPath();
/**/		ctx.moveTo(x, y);
/**/		ctx.lineTo(x2, y2);
/**/		ctx.lineTo(x2, y2 + scale2);
/**/		ctx.lineTo(x, y + scale);
/**/		ctx.closePath();
/**/		ctx.fill();
/**/		ctx.stroke();
/**/	}
/**/
/**/	// right side
/**/	if (x2 + scale2 > x + scale && !IsSolid(realX + 1, realY, realZ))
/**/	{
/**/		ctx.beginPath();
/**/		ctx.moveTo(x + scale, y);
/**/		ctx.lineTo(x2 + scale2, y2);
/**/		ctx.lineTo(x2 + scale2, y2 + scale2);
/**/		ctx.lineTo(x + scale, y + scale);
/**/		ctx.closePath();
/**/		ctx.fill();
/**/		ctx.stroke();
/**/	}
/**/}
/**/
/**/function DrawTileInCeiling (x, y, scale) {
/**/	ctx.save();
/**/
/**/	ctx.globalAlpha *= 0.3;
/**/	ctx.fillRect(x, y, scale, scale);
/**/	ctx.strokeRect(x, y, scale, scale);
/**/	ctx.restore();
/**/}
/**/
/**/function UnderCeilingCheck () {
/**/	var x = player.x;
/**/	var y = player.y;
/**/	var z = player.z;
/**/
/**/	while (!IsOpaque(x, y, z))
/**/	{
/**/		z ++;
/**/		if (GetScale(z) < 0)
/**/		{
/**/			return false;
/**/		}
/**/	}
/**/	return true;
/**/}
/**/
/**/function GetFirstTransparentTiles () {
/**/	for (var i = 0; i < 1 + 2 * CEILING_FADE_DIST; i++)
/**/	{
/**/		for (var j = 0; j < 1 + 2 * CEILING_FADE_DIST; j++)
/**/		{
/**/			var x = player.x + i - CEILING_FADE_DIST;
/**/			var y = player.y + j - CEILING_FADE_DIST;
/**/			var z = player.z;
/**/			
/**/			while (IsOpaque(x, y, z))
/**/			{
/**/				z ++;
/**/			}
/**/			firstTransparentTilesArray[i][j] = z;
/**/		}
/**/	}
/**/}
/**/
/**/function PrepareFirstTranspTileArray () {
/**/	firstTransparentTilesArray = [];
/**/	for (var i = 0; i < 1 + 2 * CEILING_FADE_DIST; i++)
/**/	{
/**/		firstTransparentTilesArray.push([]);
/**/		for (var j = 0; j < 1 + 2* CEILING_FADE_DIST; j++)
/**/		{
/**/			firstTransparentTilesArray[i].push(99);
/**/		}
/**/	}
/**/}
/**/
/**/
/**/
/**/function DrawEntity (entity) {
/**/	var scale = GetScale(GetEntityZ(entity));
/**/	var x = scale * (GetEntityX(entity) - xCam) + CANVAS_HALF_WIDTH;
/**/	var y = scale * (GetEntityY(entity) - yCam) + CANVAS_HALF_HEIGHT;
/**/	DrawCharacter(entity, scale, x, y);
/**/}
/**/
/**/function DrawNPlayer (nPlayer) {
/**/	var scale = GetScale(nPlayer.z);
/**/	var x = scale * (nPlayer.x - xCam) + CANVAS_HALF_WIDTH;
/**/	var y = scale * (nPlayer.y - yCam) + CANVAS_HALF_HEIGHT;
/**/	DrawCharacter(nPlayer, scale, x, y);
/**/}
/**/
/**/function DrawCharacter (character, scale, x, y) {
/**/	
/**/	if (scale < 0)
/**/	{
/**/		return;
/**/	}
/**/	if (x > 0 - scale && x < CANVAS_WIDTH && y > 0 - scale && y < CANVAS_HEIGHT)
/**/	{
/**/		ctx.save();
/**/		ctx.strokeStyle = "#80FFFF";
/**/		ctx.fillStyle = "#208080";
/**/		if (editorActive && character === player)
/**/		{
/**/			//Editor player: transparent, move with camera when middle clicking
/**/			ctx.globalAlpha = 0.5;
/**/			if (middleClick)
/**/			{
/**/				x = CANVAS_HALF_WIDTH - scale / 2;
/**/				y = CANVAS_HALF_HEIGHT - scale / 2;
/**/			}
/**/		}
/**/		if (character !== player)
/**/		{
/**/			ctx.strokeStyle = "#80FF80";
/**/			ctx.fillStyle = "#208020";
/**/		}
/**/		ctx.fillRect(x, y, scale, scale);
/**/		ctx.strokeRect(x, y, scale, scale);
/**/		ctx.restore();
/**/	}
/**/}
/**/
/**/function DrawAreaEdges (area, scale, z) {
/**/	var x0 = scale * (0 + GetAreaX(area) - xCam) + CANVAS_HALF_WIDTH;
/**/	var x1 = scale * (area.xSize + GetAreaX(area) - xCam) + CANVAS_HALF_WIDTH;
/**/	var y0 = scale * (0 + GetAreaY(area) - yCam) + CANVAS_HALF_HEIGHT;
/**/	var y1 = scale * (area.ySize + GetAreaY(area) - yCam) + CANVAS_HALF_HEIGHT;
/**/	ctx.save();
/**/	if (z === player.z - 1)
/**/	{
/**/		ctx.fillStyle = "#000000";
/**/		ctx.globalAlpha = 0.9;
/**/		ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
/**/	}
/**/	ctx.strokeStyle = areaColors[areas.indexOf(area)];
/**/	ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
/**/	if (z === player.z)
/**/	{
/**/		ctx.fillStyle = "#FFFFFF";
/**/		ctx.globalAlpha = 0.2;
/**/		ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
/**/	}
/**/	ctx.restore();
/**/}

// END OF OLD STUFF
}