// bine_misc.js
// Various Miscellanious functions

//Up to <dist> tiles away in all directions, except for z which is more forgiving by 2
function IsNear (x1, y1, z1, x2, y2, z2, dist) {
	if (Math.abs(x1 - x2) <= dist && Math.abs(y1 - y2) <= dist && Math.abs(z1 - z2) <= dist + 2)
	{
		return true;
	}
	return false;
}