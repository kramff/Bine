// bine_misc.js
// Various Miscellanious functions

// Show debug message on screen
function Debug (text) {
	debug_zone.textContent = text;
}

//Up to <dist> tiles away in all directions, except for z which is more forgiving by 2
function IsNear (x1, y1, z1, x2, y2, z2, dist) {
	if (Math.abs(x1 - x2) <= dist && Math.abs(y1 - y2) <= dist && Math.abs(z1 - z2) <= dist + 2) {
		return true;
	}
	return false;
}

// Determine game coordinates from screen coordinates
function ScreenCoordToGameCoord (screenX, screenY, inputZ, cameraX, cameraY, cameraZ, renderSettings) {
	var scale = -(renderSettings.TILE_SIZE / (renderSettings.Z_MULTIPLIER * (inputZ - cameraZ) - renderSettings.EYE_DISTANCE)) * renderSettings.SCALE_MULTIPLIER;
	var gameX = Math.floor((screenX - renderSettings.CANVAS_HALF_WIDTH) / scale + cameraX);
	var gameY = Math.floor((screenY - renderSettings.CANVAS_HALF_HEIGHT) / scale + cameraY);
	var gameZ = inputZ;
	return {x: gameX, y: gameY, z: gameZ};
}

// Evaluate whether the given coordinate is inside the area
function PositionInBounds (area, i, j, k) {
	if (0 <= i && i < area.xSize) {
		if (0 <= j && j < area.ySize) {
			if (0 <= k && k < area.zSize) {
				return true;
			}
		}
	}
	return false;
}

// 
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

// Makes line point by point and returns list of points
// Determines which axis has moved the least relative distance and moving in that direction one step
function GetPointsInLine (x0, y0, z0, x1, y1, z1) {
	var curX = x0;
	var curY = y0;
	var curZ = z0;
	var dirX = GetDir(x0, x1);
	var dirY = GetDir(y0, y1);
	var dirZ = GetDir(z0, z1);
	var distX = Math.abs(x1 - x0);
	var distY = Math.abs(y1 - y0);
	var distZ = Math.abs(z1 - z0);

	var pointList = [];

	var breakLoopCounter = 0;
	while (true) {
		breakLoopCounter ++;
		if (breakLoopCounter > 1000) {
			console.log("Seems to be stuck in GetPointsInLine loop")
			return false;
		}

		// Add point to list
		pointList.push({x: curX, y: curY, z: curZ});

		// Break out of loop if destination reached
		if (curX === x1 && curY === y1 && curZ === z1) {
			break;
		}
		var relDistX = (distX !== 0) ? Math.abs(curX - x0) / distX : Infinity;
		var relDistY = (distX !== 0) ? Math.abs(curY - y0) / distY : Infinity;
		var relDistZ = (distX !== 0) ? Math.abs(curZ - z0) / distZ : Infinity;

		// Move along X if it is the lowest relative distance
		if (relDistX <= relDistY && relDistX <= relDistZ) {
			curX += dirX;
		}
		// Move along Y if it is the lowest relative distance
		else if (relDistY <= relDistZ) {
			curY += dirY;
		}
		// Move along Z if it is the lowest relative distance
		else {
			curZ += dirZ;
		}
	}
	return pointList
}

function GetDir (n0, n1) {
	return ((n1 > n0) ? 1 : ((n0 > n1) ? -1 : 0));
}
