// bine_misc.js
// Various Miscellanious functions

// Show debug message on screen
function Debug (text) {
	debug_zone.textContent = text;
}

//Up to <dist> tiles away in all directions, except for z which is more forgiving by 2
function IsNear (x1, y1, z1, x2, y2, z2, dist) {
	if (Math.abs(x1 - x2) <= dist && Math.abs(y1 - y2) <= dist && Math.abs(z1 - z2) <= dist + 2)
	{
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
