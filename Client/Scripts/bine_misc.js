// bine_misc.js
// Various Miscellanious functions - shouldn't be based on specific kinds of bine game data
// Just maths and javascript stuff

// Show debug message on screen
function Debug (text) {
	debug_zone.textContent = text;
}

// Up to <dist> tiles away in all directions, except for z which is more forgiving by 2
function IsNear (x1, y1, z1, x2, y2, z2, dist) {
	if (Math.abs(x1 - x2) <= dist && Math.abs(y1 - y2) <= dist && Math.abs(z1 - z2) <= dist + 2) {
		return true;
	}
	return false;
}

// Up to <dist> tiles away in all directions, except for z which is more forgiving
// Allows for size values to be passed in as well
function IsNearWithSizes (x1, y1, z1, xSize1, ySize1, zSize1, x2, y2, z2, xSize2, ySize2, zSize2, dist) {
	if (x1 + xSize1 + dist - 1 >= x2 &&
		y1 + ySize1 + dist - 1 >= y2 &&
		z1 + zSize1 + dist - 1 + 2 >= z2 &&
		x2 + xSize2 + dist - 1 >= x1 &&
		y2 + ySize2 + dist - 1 >= y1 &&
		z2 + zSize2 + dist - 1 + 2 >= z1) {
		return true;
	}
	return false;
}

// Up to <dist> tiles away in X or Y directions
function IsNearXY (x1, y1, x2, y2, dist) {
	if (Math.abs(x1 - x2) <= dist && Math.abs(y1 - y2) <= dist) {
		return true;
	}
	return false;
}

function IsSameCoord (x1, y1, z1, x2, y2, z2) {
	if (x1 === x2 && y1 === y2 && z1 === z2) {
		return true;
	}
	return false;
}

function CoordsOverlapWithSizes (x1, y1, z1, xSize1, ySize1, zSize1, x2, y2, z2, xSize2, ySize2, zSize2) {
	if (x1 + xSize1 - 1 >= x2 &&
		y1 + ySize1 - 1 >= y2 &&
		z1 + zSize1 - 1 >= z2 &&
		x2 + xSize2 - 1 >= x1 &&
		y2 + ySize2 - 1 >= y1 &&
		z2 + zSize2 - 1 >= z1) {
		return true;
	}
	return false;
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
