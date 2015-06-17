
<font color="white">
<br/>
<input type="range" name="Eye distance" min="0" max="500" id="s1"> Eye distance 
<br/>
<input type="range" name="Scale multiplier" min="0" max="10000" id="s2"> Scale multiplier
<br/>
<input type="range" name="Z multiplier" min="1" max="2000" id="s3"> Z multiplier
<br/>
<input type="range" name="Tile size" min="10" max="500" id="s4"> Tile size
<br/>
<input type="button" name="Log settings" id="btn1" value="Log settings">
</font>

var sliders = [];

function DrawAreaWithEdgeSquareLimits (area) {
	//Loop through Z first
	for (var k = 0; k < area.zSize; k++)
	{
		var scale = GetScale(k + area.z);
		if (scale > 0.01)
		{
			for (var i = 0; i < area.xSize; i++)
			{
				var x = scale * (i + area.x - xCam) + CANVAS_HALF_WIDTH;
				if (x > edgeSquareLimit.x && x < edgeSquareLimit.x + edgeSquareLimit.xSize - scale)
				{
					for (var j = 0; j < area.ySize; j++)
					{
						var y = scale * (j + area.y - yCam) + CANVAS_HALF_HEIGHT;
						if (y > edgeSquareLimit.y && y < edgeSquareLimit.y + edgeSquareLimit.ySize - scale)
						{	
							var tile = area.map[i][j][k];
							if (tile === 1)
							{
								DrawTile(x, y, scale);
								numSquares ++;
							}
						}
					}
				}
			}
			if (Math.ceil(GetEntityZ(player)) === k)
			{
				DrawEntity(player);
			}
		}
	}
}



function StartEdgeSquareLimitEffect () {
	edgeSquareLimit.active = true;
	edgeSquareLimit.x = CANVAS_HALF_WIDTH;
	edgeSquareLimit.y = CANVAS_HALF_HEIGHT;
	edgeSquareLimit.xSize = 0;
	edgeSquareLimit.ySize = 0;
}




function InitSliders () {
	sliders.push(document.getElementById("s1"));
	sliders.push(document.getElementById("s2"));
	sliders.push(document.getElementById("s3"));
	sliders.push(document.getElementById("s4"));

	sliders[0].value = EYE_DISTANCE * 10;
	sliders[1].value = SCALE_MULTIPLIER * 10;
	sliders[2].value = Z_MULTIPLIER * 100;
	sliders[3].value = TILE_SIZE * 10;

	sliders[0].oninput = function () {
		EYE_DISTANCE = this.value / 10;
	}
	sliders[1].oninput = function () {
		SCALE_MULTIPLIER = this.value / 10;
	}
	sliders[2].oninput = function () {
		Z_MULTIPLIER = this.value / 100;
	}
	sliders[3].oninput = function () {
		TILE_SIZE = this.value / 10;
	}

	var button = document.getElementById("btn1");
	button.onclick = LogSliderValues;


}

function LogSliderValues () {
	console.log("-----------------");
	console.log("EYE_DISTANCE: " + EYE_DISTANCE);
	console.log("SCALE_MULTIPLIER: " + SCALE_MULTIPLIER);
	console.log("Z_MULTIPLIER: " + Z_MULTIPLIER);
	console.log("TILE_SIZE: " + TILE_SIZE);
}