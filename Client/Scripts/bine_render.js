// bine_render.js
// drawing things to the canvas

var jsonImageData = {};
var imageDataTree = {};

function LoadAllImages () {
	fetch("Client/JSON/image_data.json").then(function (response) {
		return response.json();
	}).then(function (responseData) {
		jsonImageData = responseData;
		RecursiveLoadImages(jsonImageData, imageDataTree, "");
	});
}

function RecursiveLoadImages (data, tree, nesting) {
	for (var key in data) {
		if (data.hasOwnProperty(key) && (typeof data[key] === "object")) {
			if (key === "files") {
				tree[key] = [];
				LoadImageFileArray(data[key], tree[key], nesting);
			}
			else {
				tree[key] = {};
				RecursiveLoadImages(data[key], tree[key], nesting + "/" + key);
			}
		}
	}
}

function LoadImageFileArray (fileArray, destinationArray, nesting) {
	for (var i = 0; i < fileArray.length; i++) {
		fileArray[i]
		GetImageData(nesting + "/" + fileArray[i], destinationArray, i);
	}
}

function GetImageData (fileLocation, destinationArray, destinationIndex) {
	var finalFileLocation = "Client/GameImage" + fileLocation;

	destinationArray[destinationIndex] = {
		finalFileLocation: finalFileLocation,
		imageData: undefined
	};

	// TODO: Make an IMAGE here and do correct stuff instead of audio stuff

	/*

	fetch(finalFileLocation).then(function (response) {
		return response.arrayBuffer();
	}).then(function (buffer) {
		return audioCtx.decodeAudioData(buffer);
	}).then(function (audioData) {
		destinationArray[destinationIndex].audioData = audioData;
	});

	*/
}

var rainModeOn = false;
var rainArr = [];
var rainStorage = [];

function MakeRainObj (repeat) {
	var rainObj;
	if (rainStorage.length > 0) {
		rainObj = rainStorage.pop();
		// console.log("old rain");
	} else {
		rainObj = {};
		console.log("new rain");
	}
	rainObj.x = Math.random() * 20 - 10;
	rainObj.y = Math.random() * 20 - 10;
	rainObj.z = 20;
	rainObj.falling = true;
	rainObj.splash = 0;
	rainArr.push(rainObj);
	
	if (repeat !== undefined && repeat > 1) {
		MakeRainObj(repeat - 1);
	}
	else
	{
		// Sort rain array
		rainArr.sort(RainSortFunc);
	}
}

function RainSortFunc (a, b) {
	return a.z - b.z;
}

function RainTick () {
	for (var i = rainArr.length - 1; i >= 0; i--) {
		var rain = rainArr[i];
		if (rain.falling) {
			rain.z -= 0.7;
		}
		else {
			rain.splash += 0.1;
		}
		if (rain.falling && curLevel !== undefined) {
			if (curLevel.CheckLocationSolid(Math.floor(rain.x), Math.floor(rain.y), Math.floor(rain.z))) {
				rain.falling = false;
			}
		}
		if (!rain.falling && rain.splash > 1.0) {
			rainStorage.push(rainArr.splice(i, 1));
		}
		if (rain.falling && rain.z < -200) {
			rainStorage.push(rainArr.splice(i, 1));
		}
	}
}

function DrawAllRain () {
	for (var i = rainArr.length - 1; i >= 0; i--) {
		var rain = rainArr[i];
		DrawOneRain(rain);
	}
}

function DrawOneRain (rain) {
	var scale0 = GetScale(rain.z);
	var scale1 = GetScale(rain.z + 1);
	var x0 = scale0 * (rain.x - R.cameraX) + R.CANVAS_HALF_WIDTH;
	var x1 = scale1 * (rain.x - R.cameraX) + R.CANVAS_HALF_WIDTH;
	var y0 = scale0 * (rain.y - R.cameraY) + R.CANVAS_HALF_HEIGHT;
	var y1 = scale1 * (rain.y - R.cameraY) + R.CANVAS_HALF_HEIGHT;

	if (scale0 < 0) {
		return;
	}
	if (x0 > 0 - scale0 && x0 < R.CANVAS_WIDTH && y0 > 0 - scale0 && y0 < R.CANVAS_HEIGHT) {
		R.ctx.save();

		R.ctx.strokeStyle = "#9090F0";
		if (rain.falling) {
			R.ctx.beginPath();
			R.ctx.moveTo(x0, y0);
			R.ctx.lineTo(x1, y1);
			R.ctx.stroke();
		}
		else
		{
			var splashSize = scale0 / 10 * rain.splash;
			R.ctx.strokeRect(x0 - splashSize / 2, y0 - splashSize / 2, splashSize, splashSize);
		}

		R.ctx.restore();
	}
}

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
	if (R.canvas !== canvas) {
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


	if (drawObjects.length > 0) {
		bottomZ = drawObjects[0].drawZ - 1;
		topZ = drawObjects[drawObjects.length - 1].drawZ;
	}
	for (var i = 0; i < drawObjects.length; i++) {
		if (drawObjects[i].type === "Area") {
			//Only areas can have a higher z than the last object
			topZ = Math.max(topZ, drawObjects[i].drawZ + drawObjects[i].zSize);
		}
	}
	// Limit bottomZ to 100 below the player, limit topZ to 100 above the player
	bottomZ = Math.max(bottomZ, Math.round(cameraZ) - 100);
	topZ = Math.min(topZ, Math.round(cameraZ) + 100);

	if (R.EDIT_MODE && bottomZ > Math.round(R.cameraZ)) {
		DrawEditOutline(Math.round(R.cameraZ));
	}
	var rainDrawI = 0;
	for (var z = bottomZ; z <= topZ + 1; z++) {
		var i = bottomI;
		var currentObject = drawObjects[i];

		//Loop through objects, stopping when no more objects or next object is above currentZ
		while (currentObject !== undefined && currentObject.drawZ - 1 <= z) {
			if (DObjInZ(currentObject, z)) {
				// Draw the tops of cubes
				DrawDObjZ(currentObject, z, false);
			}
			if (DObjInZ(currentObject, z + 1)) {
				// Draw the sides of cubes
				DrawDObjZ(currentObject, z + 1, true);
			}

			//move bottomI up when possible
			if (i === bottomI) {
				if (currentObject.type === "Entity") {
					if (z > currentObject.drawZ) {
						bottomI ++;
					}
				}
				else if (currentObject.type === "Area") {
					if (z > currentObject.drawZ + currentObject.zSize) {
						bottomI ++;
					}
				}
			}

			i ++;
			currentObject = drawObjects[i];
		}
		// Loop through rain (later, global particle effects) and draw all up to the currentZ
		var rainDrawObj = rainArr[rainDrawI];
		while (rainDrawObj !== undefined && rainDrawObj.z <= z) {
			// Draw the rain object
			DrawOneRain(rainDrawObj);
			// Move up to next rain object
			rainDrawI ++;
			rainDrawObj = rainArr[rainDrawI];
		}
		// Draw outline where player could be placed if in edit mode
		if (R.EDIT_MODE && z === Math.round(R.cameraZ)) {
			DrawEditOutline(z);
		}
	}
	if (R.EDIT_MODE && topZ < Math.round(R.cameraZ)) {
		DrawEditOutline(Math.round(R.cameraZ));
	}

	RainTick();
	// DrawAllRain();
	if (rainModeOn) {
		MakeRainObj();
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
	if (a.isEntity !== b.isEntity) {
		if (a.isEntity) return a.drawZ + 0.01 - b.drawZ;
		else return a.drawZ - b.drawZ - 0.01;
	}
	if (a.drawZ - b.drawZ < 0.05) {
		var offsetA = (a.isEntity ? entities.indexOf(a) : (a.isArea ? areas.indexOf(a) : 0)) * 0.01;
		var offsetB = (b.isEntity ? entities.indexOf(b) : (b.isArea ? areas.indexOf(b) : 0)) * 0.01;
		return ((a.drawZ + offsetA) - (b.drawZ + offsetB));
	}
	return a.drawZ - b.drawZ;
}

function SetDrawZ (dObj) {
	if (dObj.type === "Entity") {
		dObj.drawZ = Math.ceil(dObj.GetZ());
	}
	else if (dObj.type === "Area") {
		dObj.drawZ = dObj.z;
	}
	else {
		dObj.drawZ = Math.ceil(dObj.z);
	}
}



function GetScale (z) {
	return -(R.TILE_SIZE / ( R.Z_MULTIPLIER * (z - R.cameraZ) - R.EYE_DISTANCE)) * R.SCALE_MULTIPLIER;
}

function DObjInZ (dObj, z) {
	if (dObj.type === "Entity") {
		return Math.ceil(dObj.GetZ()) === z;
	}
	else if (dObj.type === "Area") {
		return (dObj.z <= z && dObj.z + dObj.zSize > z);
	}
	else {
		return Math.ceil(dObj.z) === z;
	}
}

// Entity - DrawEntity
// Area - DrawAreaZSlice
// Other - should be (?) a Network Player (?)
// drawSideTiles - true: draw the side tiles, false/default: draw the top
function DrawDObjZ (dObj, z, drawSideTiles) {
	if (dObj.type === "Entity") {
		if (drawSideTiles) {
		}
		else {
			DrawEntity(dObj);
		}
	}
	else if (dObj.type === "Area") {
		if (drawSideTiles) {
			DrawAreaZSliceSideTiles(dObj, z);
		}
		else {
			DrawAreaZSlice(dObj, z);
		}
	}
	else {
		// Otherwise: Network player
		if (drawSideTiles) {
		}
		else {
			// DrawNPlayer(dObj);
			DrawEntity(dObj)
		}
	}
}

function DrawEntity (entity) {
	var scale = GetScale(entity.GetZ());
	var x = scale * (entity.GetX() - R.cameraX) + R.CANVAS_HALF_WIDTH;
	var y = scale * (entity.GetY() - R.cameraY) + R.CANVAS_HALF_HEIGHT;

	if (scale < 0) {
		return;
	}
	if (x > 0 - scale && x < R.CANVAS_WIDTH && y > 0 - scale && y < R.CANVAS_HEIGHT) {
		R.ctx.save();
		// if (editorActive && character === player)
		// if (false)
		// {
		// 	//Editor player: transparent, move with camera when middle clicking
		// 	R.ctx.globalAlpha = 0.5;
		// 	if (middleClick) {
		// 		x = R.CANVAS_HALF_WIDTH - scale / 2;
		// 		y = R.CANVAS_HALF_HEIGHT - scale / 2;
		// 	}
		// }

		// Entity is player
		if (entity === curPlayer) {
			R.ctx.strokeStyle = "#60C0C0";
			R.ctx.fillStyle = "#208080";
		}
		// Entity is being edited
		else if (entity === curEntity) {
			R.ctx.strokeStyle = "#B03080";
			R.ctx.fillStyle = "#802060";
		}
		else {
			R.ctx.strokeStyle = "#80FF80";
			R.ctx.fillStyle = "#208020";
		}
		R.ctx.fillRect(x, y, scale, scale);
		R.ctx.strokeRect(x, y, scale, scale);

		// Draw temporary text above entity
		if (entity.tempMessageTime > 0) {
			R.ctx.fillStyle = "#FFFFFF";
			R.ctx.fillText(entity.tempMessageString + " (" + entity.tempMessageTime + ")", x - 50, y - 100);
		}

		R.ctx.restore();

	}
}


function DrawAreaZSlice (area, z) {
	var realZ = z;
	var scale = GetScale(z + area.GetZ() - area.z);
	if (scale > 0.01) {
		for (var i = 0; i < area.xSize; i++) {
			var realX = i + area.GetX();
			var x = scale * (i + area.GetX() - R.cameraX) + R.CANVAS_HALF_WIDTH;
			if (x > 0 - scale && x < R.CANVAS_WIDTH) {
				for (var j = 0; j < area.ySize; j++) {
					var realY = j + area.GetY();
					var y = scale * (j + area.GetY() - R.cameraY) + R.CANVAS_HALF_HEIGHT;
					if (y > 0 - scale && y < R.CANVAS_HEIGHT) {	
						var tile = area.map[i][j][z - area.z];
						if (tile > 0) {
							if (tile > 1) {
								DrawTileExtra(x, y, scale, tile, i + area.x, j + area.y, z, area.extraData[i][j][z - area.z]);
							}
							else {
								//SOLID tile
								if (InCeiling(i + area.x, j + area.y, z)) {
									DrawTileInCeiling(x, y, scale);
								}
								else {
									DrawTile(x, y, scale, realX, realY, realZ);
								}
							}
							// numSquares ++;
						}
					}
				}
			}
		}
		if (editorActive) {
			DrawAreaEdges(area, scale, z);

		}
	}
}
function DrawAreaZSliceSideTiles (area, z) {
	var realZ = z;
	var scale = GetScale(z + area.GetZ() - area.z);
	var scale2 = GetScale(-1 + z + area.GetZ() - area.z);
	if (scale > 0.01) {
		for (var i = 0; i < area.xSize; i++) {
			var realX = i + area.GetX();
			var x = scale * (realX - R.cameraX) + R.CANVAS_HALF_WIDTH;
			var x2 = scale2 * (realX - R.cameraX) + R.CANVAS_HALF_WIDTH;
			if (x2 > 0 - scale2 && x2 < R.CANVAS_WIDTH) {
				for (var j = 0; j < area.ySize; j++) {
					var realY = j + area.GetY()
					var y = scale * (realY - R.cameraY) + R.CANVAS_HALF_HEIGHT;
					var y2 = scale2 * (realY - R.cameraY) + R.CANVAS_HALF_HEIGHT;
					if (y2 > 0 - scale2 && y2 < R.CANVAS_HEIGHT) {	
						var tile = area.map[i][j][z - area.z];
						if (tile > 0) {
							if (tile > 1) {
								// DrawTileExtra(x, y, scale, tile, i + area.x, j + area.y, z, area.extraData[i][j][z - area.z]);
							}
							else {
								//SOLID tile
								if (InCeiling(i + area.x, j + area.y, z)) {
									// DrawTileInCeiling(x, y, scale);
								}
								else {
									DrawTileSides(x, y, scale, x2, y2, scale2, realX, realY, realZ);
								}
							}
							// numSquares ++;
						}
					}
				}
			}
		}
		if (editorActive) {
			// DrawAreaEdges(area, scale, z);
		}
	}
}
function DrawTileExtra (x, y, scale, tile, i, j, k, extra) {
	R.ctx.save();
	var doDraw = true;
	switch (tile) {
		default:
			
		break;
		case EMPTY:
			doDraw = false;
		break;
		case DISAPPEAR_BLOCK:
			// if (!IsNear(i, j, k, player.x, player.y, player.z, 1))
			if (Math.random() > 0.5) {
				extra.opacity = Math.min(1, extra.opacity + 0.07);
			}
			else {
				extra.opacity = Math.max(0, extra.opacity - 0.07);
			}
			if (editorActive) {
				extra.opacity = 1;
				R.ctx.fillStyle = "#501010"
			}
			if (extra.opacity !== 1) {
				R.ctx.globalAlpha = extra.opacity;
			}
			if (extra.opacity < 0.1) {
				doDraw = false;
			}
		break;
		case APPEAR_BLOCK:
			// if (IsNear(i, j, k, player.x, player.y, player.z, 1))
			if (Math.random() > 0.5) {
				extra.opacity = Math.min(1, extra.opacity + 0.07);
			}
			else {
				extra.opacity = Math.max(0, extra.opacity - 0.07);
			}
			if (editorActive) {
				extra.opacity = 1;
				R.ctx.fillStyle = "#105010"
			}
			if (extra.opacity !== 1) {
				R.ctx.globalAlpha = extra.opacity;
			}
			if (extra.opacity < 0.1) {
				doDraw = false;
			}
		break;
		case PATTERN_BLOCK:
			if (extra.pattern === 0) {
				R.ctx.fillStyle = "#800000";
			}
			else {
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
			if (extra.opacity >= 0.1) {
				R.ctx.fillStyle = "#800000";
				R.ctx.globalAlpha = extra.opacity;
			}
			else {
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
			if (InCeiling(i, j, k)) {
				DrawTileInCeiling(x, y, scale);
			}
			else {
				DrawTile(x, y, scale, i, j, k);
			}
			if (extra.orbHere) {
				R.ctx.fillStyle = "#C0C0C0";
				R.ctx.beginPath();
				R.ctx.arc(x + scale / 2, y + scale / 2, scale / 4, 0, 2 * Math.PI);
				R.ctx.stroke();
				R.ctx.fill();
			}
		break;
	}
	if (doDraw) {
		if (InCeiling(i, j, k)) {
			DrawTileInCeiling(x, y, scale);
		}
		else {
			DrawTile(x, y, scale, i, j, k);
		}
	}
	R.ctx.restore();
}
//i, j, k: world x, y, z position
function DrawTile (x, y, scale, realX, realY, realZ) {
	// If realX isn't passed in, don't bother doing the check
	if ((realX === undefined) || !IsSolid(realX, realY, realZ + 1)) {
		R.ctx.fillRect(x, y, scale, scale);
		R.ctx.strokeRect(x, y, scale, scale);
	}
}
// Just draws one side of a tile for now
// Need to draw all sides / not draw covered sides before drawing any tiles for that layer
function DrawTileSides (x, y, scale, x2, y2, scale2, realX, realY, realZ) {
	// top side
	if (y > y2 && !IsSolid(realX, realY - 1, realZ)) {
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
	if (y2 + scale2 > y + scale && !IsSolid(realX, realY + 1, realZ)) {
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
	if (x > x2 && !IsSolid(realX - 1, realY, realZ)) {
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
	if (x2 + scale2 > x + scale && !IsSolid(realX + 1, realY, realZ)) {
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
	if (R.EDIT_MODE && z === Math.floor(R.cameraZ) - 1) {
		R.ctx.fillStyle = "#000000";
		R.ctx.globalAlpha = 0.7;
		R.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
	}
	// R.ctx.strokeStyle = areaColors[areas.indexOf(area)];
	// Only in editior
	if (area === curArea) {
		R.ctx.strokeStyle = "#00FFFF";
		R.ctx.lineWidth = 2;
	}
	else {
		R.ctx.strokeStyle = "#FFFFFF";
	}
	R.ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

	// Light cover over tiles at the current edit level
	if (R.EDIT_MODE && z === Math.floor(R.cameraZ)) {
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
	if (!underCeiling) {
		return false;
	}
	//Check if z is above player
	if (z <= player.z) {
		return false;
	}
	//Check if x, y are within 3x3 square around player
	if (x > player.x + CEILING_FADE_DIST || x < player.x - CEILING_FADE_DIST || y > player.y + CEILING_FADE_DIST || y < player.y - CEILING_FADE_DIST) {
		return false;
	}
	//Check if tile is above an empty tile above the player
	if (firstTransparentTilesArray[x - player.x + CEILING_FADE_DIST][y - player.y + CEILING_FADE_DIST] > z) {
		return false;
	}
	return true;
}*/

function IsSolid () {
	return false;
}
/*function IsSolid (x, y, z) {
	for (var i = 0; i < areas.length; i++) {
		var area = areas[i];
		if (x >= area.x && x < area.x + area.xSize &&
			y >= area.y && y < area.y + area.ySize &&
			z >= area.z && z < area.z + area.zSize) {
			//Within area's bounds
			var tile = area.map[x - area.x][y - area.y][z - area.z];
			if (TileIsSolid(tile)) {
				return true;
			}
		}
		if (area.xMov !== 0 || area.yMov !== 0 || area.zMov !== 0) {
			//Area is moving: check new bounds
			if (x >= area.x + area.xMov && x < area.x + area.xMov + area.xSize &&
				y >= area.y + area.yMov && y < area.y + area.yMov + area.ySize &&
				z >= area.z + area.zMov && z < area.z + area.zMov + area.zSize) {
				var tile = area.map[x - area.x - area.xMov][y - area.y - area.yMov][z - area.z - area.zMov];
				if (TileIsSolid(tile)) {
					return true;
				}
			}
		}
	}
	return false;
}*/


