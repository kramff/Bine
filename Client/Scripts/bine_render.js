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

var particleArr = [];
var particleStorage = [];

function MakeRainParticle (repeat) {
	MakeParticle("rain", undefined, undefined, R.cameraZ + 20);
	if (repeat > 0) {
		MakeRainParticle(repeat - 1);
	}
}

function MakeParticle (type, x, y, z, xSize, ySize, zSize, dur) {
	var particle;
	if (particleStorage.length > 0) {
		particle = particleStorage.pop();
	}
	else {
		particle = {};
	}
	// Type: required
	particle.type = type;

	// x y z: if not given, randomly near the camera location
	particle.x = x ?? R.cameraX + Math.random() * 20 - 10;
	particle.y = y ?? R.cameraY + Math.random() * 20 - 10;
	particle.z = z ?? R.cameraZ + Math.random() * 20 - 10;

	// x y z Size: if not given, assumed to be 1
	particle.xSize = xSize ?? 1;
	particle.ySize = ySize ?? 1;
	particle.zSize = zSize ?? 1;

	// dur (duration): if not given, assumed to be 100 frames
	particle.dur = dur ?? 100;

	// Push to array then sort by z value
	particleArr.push(particle);
	particleArr.sort(ParticleSortFunc);
}

function ParticleSortFunc (a, b) {
	return a.z - b.z;
}

function ParticleTick () {
	// Reverse for loop, so removing is ok
	for (var i = particleArr.length - 1; i >= 0; i--) {
		var particle = particleArr[i];
		// Set as "to be removed" if duration reaches 0
		particle.dur -= 1;
		var toBeRemoved = particle.dur <= 0;
		// Various behavior for different types
		switch (particle.type) {
			case "rain":
				// Rain: fall down and check if hit any solid tile
				particle.z -= 0.7;
				if (curLevel !== undefined) {
					if (curLevel.CheckLocationSolid(Math.floor(particle.x), Math.floor(particle.y), Math.floor(particle.z))) {
						// Hit solid tile: turn this particle into a splash particle
						particle.type = "splash";
						particle.dur = 10;
						toBeRemoved = false;
					}
				}
			break;
		}
		// To be removed: splice from particle array and put into storage
		// (This is to avoid garbage collection lag spikes)
		if (toBeRemoved) {
			particleStorage.push(particleArr.splice(i, 1)[0]);
		}
	}
}

function DrawParticle (particle) {
	var xPos = particle.x;
	var yPos = particle.y;
	var zPos = particle.z;
	// Get coordinates at top and bottom of tile for particle
	/*
	var scaleT = GetScale(zPos);
	var xT = GetScreenXHaveScale(xPos, yPos, zPos, scaleT);
	var yT = GetScreenYHaveScale(xPos, yPos, zPos, scaleT);
	var scaleB = GetScale(zPos - 1);
	var xB = GetScreenXHaveScale(xPos, yPos, zPos - 1, scaleB);
	var yB = GetScreenYHaveScale(xPos, yPos, zPos - 1, scaleB);
	*/
	var xT = GetScreenXNew(xPos, yPos, zPos);
	var yT = GetScreenYNew(xPos, yPos, zPos);
	var xB = GetScreenXNew(xPos, yPos, zPos - 1);
	var yB = GetScreenYNew(xPos, yPos, zPos - 1);
	// If too small or out of camera view, skip
	// if (scaleB < 0) {
	// 	return;
	// }
	// currently any xyz size bigger than 1 excludes it from being off the screen not drawn
	if ((xB < 0 || xB > R.CANVAS_WIDTH || yB < 0 || yB > R.CANVAS_HEIGHT) && !(particle.xSize > 1 || particle.ySize > 1 || particle.zSize > 1)) {
		return;
	}
	// Save ctx state and draw particle
	R.ctx.save();
	R.ctx.beginPath();
	switch (particle.type) {
		case "rain":
			R.ctx.strokeStyle = "#9090F0";
			R.ctx.beginPath();
			R.ctx.moveTo(xT, yT);
			R.ctx.lineTo(xB, yB);
			R.ctx.stroke();
		break;
		case "splash":
			R.ctx.strokeStyle = "#9090F0";
			var splashSize = (10 - particle.dur);
			// Actual rectangle
			R.ctx.strokeRect(xB - splashSize / 2, yB - splashSize / 2, splashSize, splashSize);
		break;
		case "block_shot":
			R.ctx.strokeStyle = "#30F060";
			R.ctx.fillStyle = "#60D060";
			R.ctx.globalAlpha = (particle.dur / 20);
			// R.ctx.rect(xT, yT, particle.xSize * scaleT, particle.ySize * scaleT);
			DrawQuad(xPos, yPos, zPos, particle.xSize, particle.ySize);
		break;
		case "block_shot_fail":
			R.ctx.strokeStyle = "#30F060";
			R.ctx.fillStyle = "#60D060";
			R.ctx.globalAlpha = (particle.dur / 20);
			// R.ctx.rect(xT, yT, particle.xSize * scaleT, particle.ySize * scaleT);
			DrawQuad(xPos, yPos, zPos, particle.xSize, particle.ySize, true, false);
		break;
		case "block_collect":
			R.ctx.strokeStyle = "#30F060";
			R.ctx.fillStyle = "#60D060";
			R.ctx.globalAlpha = (particle.dur / 20);
			// R.ctx.rect(xT, yT, particle.xSize * scaleT, particle.ySize * scaleT);
			DrawQuad(xPos, yPos, zPos, particle.xSize, particle.ySize);
		break;
		case "block_collect_fail":
			R.ctx.strokeStyle = "#30F060";
			R.ctx.fillStyle = "#60D060";
			R.ctx.globalAlpha = (particle.dur / 20);
			// R.ctx.rect(xT, yT, particle.xSize * scaleT, particle.ySize * scaleT);
			DrawQuad(xPos, yPos, zPos, particle.xSize, particle.ySize, true, false);
		break;
		case "block_disappear":
			R.ctx.strokeStyle = "#80FF80";
			R.ctx.fillStyle = "#208020";
			var size = (particle.dur / 10);
			// The apothem is half the width of the square
			var apothem = size / 2;
			var edgeToMini = 0.5 - apothem;
			// Sides of cube
			DrawQuadSides(xPos + edgeToMini, yPos + edgeToMini, zPos - edgeToMini, size, size);
			// Top of cube
			DrawQuad(xPos + edgeToMini, yPos + edgeToMini, zPos - edgeToMini, size, size);
		break;
	}
	// Restore ctx state
	R.ctx.restore();
}

function DrawSingleQuad (x, y, z) {
	DrawQuad(x, y, z, 1, 1);
}

function DrawQuad (x, y, z, xSize, ySize, doStroke, doFill) {
	// 1 > 2 1---2
	// ^   v |   |
	// 4 < 3 4---3
	var x1 = GetScreenXNew(x, y, z);
	if (x1 < -100 || x1 > R.CANVAS_WIDTH + 100) {
		return;
	}
	var x2 = GetScreenXNew(x + xSize, y, z);
	var x3 = GetScreenXNew(x + xSize, y + ySize, z);
	var x4 = GetScreenXNew(x, y + ySize, z);
	var y1 = GetScreenYNew(x, y, z);
	if (y1 < -100 || y1 > R.CANVAS_HEIGHT + 100) {
		return;
	}
	var y2 = GetScreenYNew(x + xSize, y, z);
	var y3 = GetScreenYNew(x + xSize, y + ySize, z);
	var y4 = GetScreenYNew(x, y + ySize, z);
	R.ctx.beginPath();
	R.ctx.moveTo(x1, y1);
	R.ctx.lineTo(x2, y2);
	R.ctx.lineTo(x3, y3);
	R.ctx.lineTo(x4, y4);
	R.ctx.lineTo(x1, y1);
	if (doFill === undefined || doFill) {
		R.ctx.fill();
	}
	if (doStroke === undefined || doStroke) {
		R.ctx.stroke();
	}
}

function DrawSingleQuadSides (x, y, z) {
	DrawQuadSides(x, y, z, 1, 1, 1);
}

function DrawQuadSides (x, y, z, xSize, ySize, zSize, sideStyle, mustDrawSides) {
	//         top
	//        1---2
	//       /|   |
	//      5 4---3 (6 is hidden) 
	// left |/   / right
	//      8---7
	//      bottom
	var x1 = GetScreenXNew(x, y, z);
	if (x1 < -100 || x1 > R.CANVAS_WIDTH + 100) {
		return;
	}
	var x2 = GetScreenXNew(x + xSize, y, z);
	var x3 = GetScreenXNew(x + xSize, y + ySize, z);
	var x4 = GetScreenXNew(x, y + ySize, z);
	var x5 = GetScreenXNew(x, y, z - zSize);
	var x6 = GetScreenXNew(x + xSize, y, z - zSize);
	var x7 = GetScreenXNew(x + xSize, y + ySize, z - zSize);
	var x8 = GetScreenXNew(x, y + ySize, z - zSize);
	var y1 = GetScreenYNew(x, y, z);
	if (y1 < -100 || y1 > R.CANVAS_HEIGHT + 100) {
		return;
	}
	var y2 = GetScreenYNew(x + xSize, y, z);
	var y3 = GetScreenYNew(x + xSize, y + ySize, z);
	var y4 = GetScreenYNew(x, y + ySize, z);
	var y5 = GetScreenYNew(x, y, z - zSize);
	var y6 = GetScreenYNew(x + xSize, y, z - zSize);
	var y7 = GetScreenYNew(x + xSize, y + ySize, z - zSize);
	var y8 = GetScreenYNew(x, y + ySize, z - zSize);
	// Top: 1-2-6-5
	if (y1 > y5 && (!IsOpaqueMulti(x, y - 1, z, xSize, 1, 1) || mustDrawSides)) {
		R.ctx.beginPath();
		R.ctx.moveTo(x1, y1);
		R.ctx.lineTo(x2, y2);
		R.ctx.lineTo(x6, y6);
		R.ctx.lineTo(x5, y5);
		R.ctx.lineTo(x1, y1);
		// if (sideStyle === "wall_grad") {
		// 	R.ctx.fillStyle = GetWallGradientVertical(y1, y5, z);
		// }
		R.ctx.fill();
		R.ctx.stroke();
	}
	// Bottom: 4-3-7-8
	if (y4 < y8 && (!IsOpaqueMulti(x, y + 1, z, xSize, 1, 1) || mustDrawSides)) {
		R.ctx.beginPath();
		R.ctx.moveTo(x4, y4);
		R.ctx.lineTo(x3, y3);
		R.ctx.lineTo(x7, y7);
		R.ctx.lineTo(x8, y8);
		R.ctx.lineTo(x4, y4);
		// if (sideStyle === "wall_grad") {
		// 	R.ctx.fillStyle = GetWallGradientVertical(y4, y8, z);
		// }
		R.ctx.fill();
		R.ctx.stroke();
	}
	// Left: 1-4-8-5
	if (x1 > x5 && (!IsOpaqueMulti(x - 1, y, z, xSize, 1, 1) || mustDrawSides)) {
		R.ctx.beginPath();
		R.ctx.moveTo(x1, y1);
		R.ctx.lineTo(x4, y4);
		R.ctx.lineTo(x8, y8);
		R.ctx.lineTo(x5, y5);
		R.ctx.lineTo(x1, y1);
		// if (sideStyle === "wall_grad") {
		// 	R.ctx.fillStyle = GetWallGradientHorizontal(x1, x5, z);
		// }
		R.ctx.fill();
		R.ctx.stroke();
	}
	// Right: 2-3-7-6
	if (x2 < x6 && (!IsOpaqueMulti(x + 1, y, z, xSize, 1, 1) || mustDrawSides)) {
		R.ctx.beginPath();
		R.ctx.moveTo(x2, y2);
		R.ctx.lineTo(x3, y3);
		R.ctx.lineTo(x7, y7);
		R.ctx.lineTo(x6, y6);
		R.ctx.lineTo(x2, y2);
		// if (sideStyle === "wall_grad") {
		// 	R.ctx.fillStyle = GetWallGradientHorizontal(x2, x6, z);
		// }
		R.ctx.fill();
		R.ctx.stroke();
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
	EYE_DISTANCE: 45, // To be removed
	CAMERA_DISTANCE: 20,
	SCALE_MULTIPLIER: 490, // To be removed
	Z_MULTIPLIER: 3.1, // To be removed
	TILE_SIZE: 5.4, // To be removed
	TILE_SIZE_NEW: 1000, // Rename this
	CAMERA_TILT: 0.45, // To be removed
	//Camera angles between 0 and Math.PI / 2?
	cameraXAngle: 0,
	cameraYAngle: Math.PI / 4,
	cameraZAngle: 0,
	EDIT_MODE: false,
	ceilingMode: false,
}

function ClearCanvas (canvas) {
	canvas.width = canvas.width;
}

var textsToDraw = [];

function RenderLevel (canvas, session, level, cameraX, cameraY, cameraZ, editMode) {
	// Set up render object
	if (R.canvas !== canvas) {
		R.canvas = canvas;
		R.ctx = R.canvas.getContext("2d");
	}
	R.session = session;
	R.level = level;
	R.cameraX = cameraX;
	R.cameraY = cameraY;
	R.cameraZ = cameraZ;
	R.CANVAS_WIDTH = canvas.width;
	R.CANVAS_HEIGHT = canvas.height;
	R.CANVAS_HALF_WIDTH = R.CANVAS_WIDTH / 2;
	R.CANVAS_HALF_HEIGHT = R.CANVAS_HEIGHT / 2;
	R.EDIT_MODE = editMode || false;

	if (cameraTilting) {
		if (!cameraTilting2) {
			R.cameraYAngle += 0.002;
			if (R.cameraYAngle >= Math.PI / 2) {
				cameraTilting2 = true;
			}
		}
		else {
			R.cameraYAngle -= 0.002;
			if (R.cameraYAngle < 0.05) {
				cameraTilting2 = false;
			}
		}
	}

	// Clear canvas
	R.canvas.width = R.canvas.width;

	// Set standard drawing values
	R.ctx.font = "16px sans-serif";
	R.ctx.strokeStyle = "#E0E8F6";
	R.ctx.fillStyle = "#303846";

	// Clear text
	textsToDraw = [];
	
	// Get level to draw and draw all objects in that level 
	var drawObjects = R.level.drawObjects;
	drawObjects.forEach(SetDrawZ);
	drawObjects.sort(DrawObjSortFunc);
	
	// Determine if ceiling mode is on or not
	R.ceilingMode = false;
	// starting from above cameraZ, count 16 tiles above. If any are blocked, use ceiling mode
	var ceilX = Math.floor(cameraX);
	var ceilY = Math.floor(cameraY);
	var ceilZ = Math.floor(cameraZ + 1);
	for (var i = 0; i < 16; i++) {
		if (level.CheckLocationSolid(ceilX, ceilY, ceilZ)) {
			R.ceilingMode = true;
		}
		ceilZ += 1;
	}

	var bottomZ = 1;
	var topZ = -1;
	var bottomI = 0;

	var particleDrawI = 0;

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
	// Outlines around areas when in edit mode
	if (R.EDIT_MODE && bottomZ > Math.round(R.cameraZ)) {
		DrawEditOutline(Math.round(R.cameraZ));
	}
	for (var z = bottomZ; z <= topZ + 1; z++) {
		var i = bottomI;
		var currentObject = drawObjects[i];
		// Loop through global particle effects and draw all up to the currentZ
		var particle = particleArr[particleDrawI];
		while (particle !== undefined && particle.z <= z) {
			// Draw the particle object
			DrawParticle(particle);
			// Move up to next particle object
			particleDrawI ++;
			particle = particleArr[particleDrawI];
		}
		// Loop through objects, stopping when no more objects or next object is above currentZ
		// Do two loops: one for the tops of objects, then another for the sides of the objects
		while (currentObject !== undefined && currentObject.drawZ - 1 <= z) {
			if (DObjInZ(currentObject, z)) {
				// Draw the tops of cubes
				DrawDObjZ(currentObject, z, false);
			}
			// Next object
			i ++;
			currentObject = drawObjects[i];
		}
		// Second loop for sides of objects
		i = bottomI;
		currentObject = drawObjects[i];
		while (currentObject !== undefined && currentObject.drawZ - 1 <= z) {
			if (DObjInZ(currentObject, z + 1)) {
				// Draw the sides of cubes
				DrawDObjZ(currentObject, z + 1, true);
			}
			//move bottomI up when possible
			if (i === bottomI) {
				// Both areas and entities have zSize
				if (z > currentObject.drawZ + currentObject.zSize - 1) {
					bottomI ++;
				}
			}
			// Next object
			i ++;
			currentObject = drawObjects[i];
		}
		// Draw outline where player could be placed if in edit mode
		if (R.EDIT_MODE && z === Math.round(R.cameraZ - 0.5)) {
			DrawEditOutline(R.cameraX - 0.5, R.cameraY - 0.5, R.cameraZ - 0.5);
		}
	}
	if (R.EDIT_MODE && (topZ < Math.round(R.cameraZ - 0.5) || bottomZ > Math.round(R.cameraZ - 0.5))) {
		DrawEditOutline(R.cameraX - 0.5, R.cameraY - 0.5, R.cameraZ - 0.5);
	}

	ParticleTick();

	// Loop through and draw text items
	R.ctx.save();
	for (var i = 0; i < textsToDraw.length; i++) {
		var splitText = textsToDraw[i].text.split("\n");
		R.ctx.fillStyle = "#FFFFFF";
		for (var j = 0; j < splitText.length; j++) {
			var textLine = splitText[j];
			R.ctx.fillText(textLine, textsToDraw[i].x, textsToDraw[i].y + 20 * j);
		}
	}
	R.ctx.restore();
}

function DrawEditOutline (x, y, z) {
	R.ctx.save();
	// var scale = GetScale(z);
	// var xScreen = GetScreenXHaveScale(x, y, z, scale);
	// var yScreen = GetScreenYHaveScale(x, y, z, scale);

	R.ctx.strokeStyle = "#40FF80";
	// R.ctx.strokeRect(R.CANVAS_HALF_WIDTH - size / 2, R.CANVAS_HALF_HEIGHT - size / 2, size, size);
	// R.ctx.strokeRect(xScreen, yScreen, scale, scale);
	DrawQuad(x, y, z, 1, 1, true, false);
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
	// return (850 / (14.5 - (z - R.cameraZ)));
}

function GetScreenX (x, y, z) {
	var scale = GetScale(z);
	return GetScreenXHaveScale(x, y, z, scale);
}

function GetScreenXHaveScale (x, y, z, scale) {
	return scale * (x - R.cameraX) + R.CANVAS_HALF_WIDTH;
}

function GetScreenY (x, y, z) {
	var scale = GetScale(z);
	return GetScreenYHaveScale(x, y, z, scale);
}

function GetScreenYHaveScale (x, y, z, scale) {
	return scale * (y - R.cameraY) + R.CANVAS_HALF_HEIGHT - ((z - R.cameraZ) * scale * R.CAMERA_TILT);
}

function GetScreenXNew (x, y, z) {
	var xRelativeDist = x - R.cameraX;
	var yRelativeDist = y - R.cameraY;
	var zRelativeDist = z - R.cameraZ;
	// var subjectDistance = Math.sqrt(((zRelativeDist - R.CAMERA_DISTANCE) * (1 - R.cameraXAngle) * (1 - R.cameraYAngle)) ** 2 + (R.cameraXAngle * (xRelativeDist - R.CAMERA_DISTANCE)) ** 2 + (R.cameraYAngle * (yRelativeDist - R.CAMERA_DISTANCE)) ** 2);
	var subjectDistance = Math.sqrt(((zRelativeDist - R.CAMERA_DISTANCE) * Math.cos(R.cameraXAngle) * Math.cos(R.cameraYAngle)) ** 2 + (Math.sin(R.cameraXAngle) * (xRelativeDist - R.CAMERA_DISTANCE)) ** 2 + (Math.sin(R.cameraYAngle) * (yRelativeDist - R.CAMERA_DISTANCE)) ** 2);
	// return R.CANVAS_HALF_WIDTH + R.TILE_SIZE_NEW * (((xRelativeDist * (1 - R.cameraXAngle)) - (zRelativeDist * R.cameraXAngle)) / subjectDistance);
	return R.CANVAS_HALF_WIDTH + R.TILE_SIZE_NEW * (((xRelativeDist * Math.cos(R.cameraXAngle)) - (zRelativeDist * Math.sin(R.cameraXAngle))) / subjectDistance);
}
// Very simple version
// return xRelativeDist * R.TILE_SIZE_NEW + R.CANVAS_HALF_WIDTH - zRelativeDist * R.TILE_SIZE_NEW / R.Z_MULTIPLIER;

function GetScreenYNew (x, y, z) {
	var xRelativeDist = x - R.cameraX;
	var yRelativeDist = y - R.cameraY;
	var zRelativeDist = z - R.cameraZ;
	// var subjectDistance = Math.sqrt(((zRelativeDist - R.CAMERA_DISTANCE) * (1 - R.cameraXAngle) * (1 - R.cameraYAngle)) ** 2 + (R.cameraXAngle * (xRelativeDist - R.CAMERA_DISTANCE)) ** 2 + (R.cameraYAngle * (yRelativeDist - R.CAMERA_DISTANCE)) ** 2);
	var subjectDistance = Math.sqrt(((zRelativeDist - R.CAMERA_DISTANCE) * Math.cos(R.cameraXAngle) * Math.cos(R.cameraYAngle)) ** 2 + (Math.sin(R.cameraXAngle) * (xRelativeDist - R.CAMERA_DISTANCE)) ** 2 + (Math.sin(R.cameraYAngle) * (yRelativeDist - R.CAMERA_DISTANCE)) ** 2);
	// return R.CANVAS_HALF_HEIGHT + R.TILE_SIZE_NEW * (((yRelativeDist * (1 - R.cameraYAngle)) - (zRelativeDist * R.cameraYAngle)) / subjectDistance);
	return R.CANVAS_HALF_HEIGHT + R.TILE_SIZE_NEW * (((yRelativeDist * Math.cos(R.cameraYAngle)) - (zRelativeDist * Math.sin(R.cameraYAngle))) / subjectDistance);
}
// Very simple version
// return yRelativeDist * R.TILE_SIZE_NEW + R.CANVAS_HALF_HEIGHT - zRelativeDist * R.TILE_SIZE_NEW / R.Z_MULTIPLIER;
 
function DObjInZ (dObj, z) {
	if (dObj.type === "Entity") {
		//return Math.ceil(dObj.GetZ()) === z;
		return (dObj.z <= z && dObj.z + dObj.zSize > z);
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
			DrawEntitySideTiles(dObj, z);
		}
		else {
			DrawEntity(dObj, z);
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
		// (Unused? Remove this part?)
		if (drawSideTiles) {
		}
		else {
			// DrawNPlayer(dObj);
			DrawEntity(dObj, z)
		}
	}
}

function DrawEntity (entity, z) {
	// If not visible: skip drawing
	if (entity.settings.visible === false) {
		return;
	}
	var xPos = entity.GetX();
	var yPos = entity.GetY();
	var zPos = entity.GetZ() + entity.zSize - 1;
	// var scale = GetScale(zPos);
	// var xScr = GetScreenXHaveScale(xPos, yPos, zPos, scale);
	// var yScr = GetScreenYHaveScale(xPos, yPos, zPos, scale);

	var xScr = GetScreenXNew(xPos, yPos, zPos);
	var yScr = GetScreenYNew(xPos, yPos, zPos);

	// Too small to see
	// if (scale < 0) {
	// 	return;
	// }

	// This function draws the top of the cube (or rectangular box)
	// Skip if this isn't the highest z level of this entity
	if (z < entity.z + entity.zSize - 1) {
		return;
	}

	//if (xScr + entity.xSize * scale > 0 && xScr < R.CANVAS_WIDTH && yScr + entity.ySize * scale > 0 && yScr < R.CANVAS_HEIGHT) {

	// 60 is arbitrary (?)
	// if (xScr + entity.xSize * 60 > 0 && xScr < R.CANVAS_WIDTH && yScr + entityRef.ySize * 60 > 0 && yScr < R.CANVAS_HEIGHT) {
	if (true) {
		R.ctx.save();
		var skipRegularDraw = false;

		// Entity is player
		if (entity === curPlayer) {
			// For now: cyan cube
			R.ctx.strokeStyle = "#60C0C0";
			R.ctx.fillStyle = "#208080";
			// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "wizard");
			// skipRegularDraw = true;
		}
		// Entity is being edited
		else if (entity === curEntity) {
			R.ctx.strokeStyle = "#B03080";
			R.ctx.fillStyle = "#802060";
		}
		else if (entity.templates !== undefined && Array.isArray(entity.templates) && entity.templates.length > 0) {
			// Entity has template
			// Currently - hard coded ways to draw these
			if (entity.templates.includes("laser")) {
				// R.ctx.strokeStyle = "#C07070";
				// R.ctx.fillStyle = "#B06060";
				// var laserColor = "#B06060";
				// if (entity.style !== undefined && typeof entity.style === "string") {
				// 	laserColor = entity.style;
				// }
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "laser", entity.xSize, entity.ySize, entity.zSize, laserColor);
				skipRegularDraw = true;
			}
			else if (entity.templates.includes("door")) {
				R.ctx.strokeStyle = "#9090D0";
				R.ctx.fillStyle = "#8080C0";
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "door");
				// skipRegularDraw = true;
			}
			else if (entity.templates.includes("teleporter")) {
				R.ctx.strokeStyle = "#D0D0D0";
				R.ctx.fillStyle = "#C0C0C0";
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "teleporter");
				// skipRegularDraw = true;
			}
			else if (entity.templates.includes("block")) {
				R.ctx.strokeStyle = "#80FF80";
				R.ctx.fillStyle = "#208020";
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "block");
				// skipRegularDraw = true;
			}
		}
		else if (entity.style !== undefined && typeof entity.style === "string") {
			// Entity has defined style, and it's just a string
			R.ctx.strokeStyle = "#CCCCCC";
			R.ctx.fillStyle = entity.style;
		}
		else {
			// No special draw -> yellow cube
			R.ctx.strokeStyle = "#D0D080";
			R.ctx.fillStyle = "#C0C070";
		}
		if (!skipRegularDraw) {
			// R.ctx.fillRect(xScr, yScr, scale * entity.xSize, scale * entity.ySize);
			// R.ctx.strokeRect(xScr, yScr, scale * entity.xSize, scale * entity.ySize);
			DrawQuad(xPos, yPos, zPos, entity.xSize, entity.ySize);
		}

		// Draw temporary text above entity
		if (entity.tempMessageTime > 0) {
			// R.ctx.fillStyle = "#FFFFFF";
			// R.ctx.fillText(entity.tempMessageString + " (" + entity.tempMessageTime + ")", xScr - 50, yScr - 100);
			textsToDraw.push({text: entity.tempMessageString, x: xScr - 50, y: yScr - 100});
		}

		R.ctx.restore();
	}
}

function DrawEntitySideTiles (entity, z) {
	// If not visible: skip drawing
	if (entity.settings.visible === false) {
		return;
	}
	var xPos = entity.GetX();
	var yPos = entity.GetY();
	var zPos = entity.GetZ() - entity.z + z;
	//var scale = GetScale(zPos);
	//var scale2 = GetScale(zPos - 1);
	//var x = GetScreenXHaveScale(xPos, yPos, zPos, scale);
	//var x2 = GetScreenXHaveScale(xPos, yPos, zPos - 1, scale2);
	//var y = GetScreenYHaveScale(xPos, yPos, zPos, scale);
	//var y2 = GetScreenYHaveScale(xPos, yPos, zPos - 1, scale2);
	//var xScr = GetScreenXHaveScale(xPos, yPos, zPos, scale);
	//var yScr = GetScreenYHaveScale(xPos, yPos, zPos, scale);
	// if (scale < 0) {
	// 	return;
	// }

	// var xScr = GetScreenXNew(xPos, yPos, zPos);
	// var yScr = GetScreenYNew(xPos, yPos, zPos);

	// if (x2 > 0 - scale && x2 < R.CANVAS_WIDTH && y2 > 0 - scale && y2 < R.CANVAS_HEIGHT) {
	if (true) {
		R.ctx.save();
		var skipRegularDraw = false;

		// Entity is player
		if (entity === curPlayer) {
			R.ctx.strokeStyle = "#60C0C0";
			R.ctx.fillStyle = "#208080";
			// skipRegularDraw = true;
		}
		// Entity is being edited
		else if (entity === curEntity) {
			R.ctx.strokeStyle = "#B03080";
			R.ctx.fillStyle = "#802060";
		}
		else if (entity.templates !== undefined && Array.isArray(entity.templates) && entity.templates.length > 0) {
			// Entity has template
			// Currently - hard coded ways to draw these
			if (entity.templates.includes("laser")) {
				// R.ctx.strokeStyle = "#C07070";
				// R.ctx.fillStyle = "#B06060";
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "laser");
				var laserColor = "#B06060";
				if (entity.style !== undefined && typeof entity.style === "string") {
					laserColor = entity.style;
				}
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "laser", entity.xSize, entity.ySize, entity.zSize, laserColor);
				DrawComplicatedEntity(xPos, yPos, zPos, "laser", entity.xSize, entity.ySize, entity.zSize, laserColor);
				skipRegularDraw = true;
			}
			else if (entity.templates.includes("door")) {
				R.ctx.strokeStyle = "#9090D0";
				R.ctx.fillStyle = "#8080C0";
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "door");
				// skipRegularDraw = true;
			}
			else if (entity.templates.includes("teleporter")) {
				R.ctx.strokeStyle = "#D0D0D0";
				R.ctx.fillStyle = "#C0C0C0";
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "teleporter");
				// skipRegularDraw = true;
			}
			else if (entity.templates.includes("block")) {
				R.ctx.strokeStyle = "#80FF80";
				R.ctx.fillStyle = "#208020";
				// DrawComplicatedEntity(xPos, yPos, zPos, scale, xScr, yScr, "block");
				// skipRegularDraw = true;
			}
		}
		else if (entity.style !== undefined && typeof entity.style === "string") {
			// Entity has defined color
			R.ctx.strokeStyle = "#CCCCCC";
			R.ctx.fillStyle = entity.style;
		}
		else {
			// No special draw -> yellow cube
			R.ctx.strokeStyle = "#D0D080";
			R.ctx.fillStyle = "#C0C070";
		}
		if (!skipRegularDraw) {
			var mustDrawSides = entity.xMov !== 0 || entity.yMov !== 0 || entity.zMov !== 0;
			DrawQuadSides(xPos, yPos, zPos, entity.xSize, entity.ySize, entity.zSize, undefined, mustDrawSides);
		}
		R.ctx.restore();
	}
}


function DrawAreaZSlice (area, z) {
	var xPos = area.GetX();
	var yPos = area.GetY();
	// if (scale > 0.01) {
	if (true) {
		for (var i = 0; i < area.xSize; i++) {
			var x = i + xPos;
				for (var j = 0; j < area.ySize; j++) {
					var y = j + yPos;
					//if ((y > 0 - scale && y < R.CANVAS_HEIGHT) && (x > 0 - scale && x < R.CANVAS_WIDTH)) {	
					if (true) {
						var tile = area.map[i][j][z - area.z];
						if (tile > 0) {
							if (tile > 1) {
								DrawTileExtra(x, y, z, tile, area.extraData[i][j][z - area.z]);
							}
							else {
								//SOLID tile
								if (R.ceilingMode && InCeiling(i + area.x, j + area.y, z)) {
									DrawTileInCeiling(x, y, z);
								}
								else {
									DrawTile(x, y, z);
								}
							}
						}
					}
				}
			//}
		}
		if (editorActive) {
			DrawAreaEdges(area, xPos, yPos, z);
		}
	}
}

function DrawAreaZSliceSideTiles (area, z) {
	var xPos = area.GetX();
	var yPos = area.GetY();
	// if (scale > 0.01) {
	if (true) {
		for (var i = 0; i < area.xSize; i++) {
			var x = i + xPos;
			for (var j = 0; j < area.ySize; j++) {
				var y = j + area.GetY()
				// if ((y2 > 0 - scale2 && y2 < R.CANVAS_HEIGHT) && (x2 > 0 - scale2 && x2 < R.CANVAS_WIDTH)) {	
				if (true) {
					var tile = area.map[i][j][z - area.z];
					if (tile > 0) {
						if (tile > 1) {
							// DrawTileExtra(x, y, scale, tile, i + area.x, j + area.y, z, area.extraData[i][j][z - area.z]);
						}
						else {
							//SOLID tile
							if (R.ceilingMode && InCeiling(i + area.x, j + area.y, z)) {
								// DrawTileInCeiling(x, y, scale);
							}
							else {
								// DrawQuadSides(x, y, z, 1, 1, 1, "wall_grad");
								DrawSingleQuadSides(x, y, z);
							}
						}
					}
				}
			}
		}
	}
}
// function DrawTileExtra (x, y, scale, tile, i, j, k, extra) {
function DrawTileExtra (x, y, z, tile, extra) {
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
			// // Draw tile but then draw circle on top
			// doDraw = false;
			// R.ctx.fillStyle = "#606060";
			// if (R.ceilingMode && InCeiling(i, j, k)) {
			// 	DrawTileInCeiling(x, y, scale);
			// }
			// else {
			// 	DrawTile(x, y, scale, i, j, k);
			// }
			// if (extra.orbHere) {
			// 	R.ctx.fillStyle = "#C0C0C0";
			// 	R.ctx.beginPath();
			// 	R.ctx.arc(x + scale / 2, y + scale / 2, scale / 4, 0, 2 * Math.PI);
			// 	R.ctx.stroke();
			// 	R.ctx.fill();
			// }
		break;
	}
	if (doDraw) {
		if (R.ceilingMode && InCeiling(i, j, k)) {
			DrawTileInCeiling(x, y, scale);
		}
		else {
			// DrawTile(x, y, scale, i, j, k);
			DrawTile(x, y, z);
			// R.ctx.fill();
			// R.ctx.stroke();
		}
	}
	R.ctx.restore();
}
//i, j, k: world x, y, z position
// function DrawTile (x, y, scale, realX, realY, realZ) {
// 	// If realX isn't passed in, don't bother doing the check
// 	if ((realX === undefined) || !IsOpaque(realX, realY, realZ + 1)) {
// 		R.ctx.fillRect(x, y, scale, scale);
// 		R.ctx.strokeRect(x, y, scale, scale);
// 	}
// }
function DrawTile (x, y, z) {
	if (!IsOpaque(x, y, z + 1)) {
		DrawSingleQuad(x, y, z);
		// R.ctx.fill();
		// R.ctx.stroke();
	}
}
//i, j, k: world x, y, z position
// function DrawTileInCeiling (x, y, scale, realX, realY, realZ) {
// 	// If realX isn't passed in, don't bother doing the check
// 	if ((realX === undefined) || !IsOpaque(realX, realY, realZ + 1)) {
// 		R.ctx.save();
// 		R.ctx.globalAlpha = 0.5;
// 		R.ctx.fillRect(x, y, scale, scale);
// 		R.ctx.strokeRect(x, y, scale, scale);
// 		R.ctx.restore();
// 	}
// }
function DrawTileInCeiling (x, y, z) {
	if (!IsOpaque(x, y, z + 1)) {
		R.ctx.save();
		R.ctx.globalAlpha = 0.5;
		DrawSingleQuad(x, y, z);
		R.ctx.restore();
	}
}

var wallColors = [
	"#586068",
	"#515961",
	"#4b535b",
	"#444c54",
	"#3e464e",
	"#373f47",
	"#313941",
	"#2a323a",
	"#242c34",
	"#1d252d",
	"#171f27",
	"#101820",
];

// For setting up gradients for walls
function GetWallGradientColor (z) {
	var newZ = 10 - z;
	newZ = Math.min(wallColors.length - 1, Math.max(0, newZ));
	return wallColors[newZ];
}

// Top and bottom sides of walls use this one
var gradVertMem = {};
function GetWallGradientVertical (y, y2, z) {
	y = Math.round(y);
	y2 = Math.round(y2);
	z = Math.round(z);
	var memString = y + "," + y2 + "," + z;
	if (gradVertMem[memString] !== undefined) {
		return gradVertMem[memString];
	}
	else {
		var topColor = GetWallGradientColor(z);
		var bottomColor = GetWallGradientColor(z - 1);
		var gradient = R.ctx.createLinearGradient(0, y, 0, y2);
		gradient.addColorStop(0, topColor);
		gradient.addColorStop(1, bottomColor);
		gradVertMem[memString] = gradient;
		return gradient;
	}
}

// Left and right sides of walls use this one
var gradHorizMem = {};
function GetWallGradientHorizontal (x, x2, z) {
	x = Math.round(x);
	x2 = Math.round(x2);
	z = Math.round(z);
	var memString = x + "," + x2 + "," + z;
	if (gradVertMem[memString] !== undefined) {
		return gradVertMem[memString];
	}
	else {
		var topColor = GetWallGradientColor(z);
		var bottomColor = GetWallGradientColor(z - 1);
		var gradient = R.ctx.createLinearGradient(x, 0, x2, 0);
		gradient.addColorStop(0, topColor);
		gradient.addColorStop(1, bottomColor);
		gradVertMem[memString] = gradient;
		return gradient;
	}
}

// Draw the top, bottom, left, and right sides of a cube
// Either for tile in area or for cube style entity
// function DrawCubeSides (x, y, scale, x2, y2, scale2, realX, realY, realZ, xSize, ySize, zSize, sideStyle, mustDrawSides) {
// 	R.ctx.save();
// 	// top side
// 	if (y > y2 && (!IsOpaqueMulti(realX, realY - 1, realZ, xSize, 1, 1) || mustDrawSides)) {
// 		R.ctx.beginPath();
// 		R.ctx.moveTo(x, y);
// 		R.ctx.lineTo(x2, y2);
// 		R.ctx.lineTo(x2 + scale2 * xSize, y2);
// 		R.ctx.lineTo(x + scale * xSize, y);
// 		R.ctx.closePath();
// 		if (sideStyle === "wall_grad") {
// 			R.ctx.fillStyle = GetWallGradientVertical(y, y2, realZ);
// 		}
// 		R.ctx.fill();
// 		R.ctx.stroke();
// 	}
// 	// bottom side
// 	if (y2 + scale2 > y + scale && (!IsOpaqueMulti(realX, realY + ySize, realZ, xSize, 1, 1) || mustDrawSides)) {
// 		R.ctx.beginPath();
// 		R.ctx.moveTo(x, y + scale * ySize);
// 		R.ctx.lineTo(x2, y2 + scale2 * ySize);
// 		R.ctx.lineTo(x2 + scale2 * xSize, y2 + scale2 * ySize);
// 		R.ctx.lineTo(x + scale * xSize, y + scale * ySize);
// 		R.ctx.closePath();
// 		if (sideStyle === "wall_grad") {
// 			R.ctx.fillStyle = GetWallGradientVertical(y + scale, y2 + scale2, realZ);
// 		}
// 		R.ctx.fill();
// 		R.ctx.stroke();
// 	}
// 	// left side
// 	if (x > x2 && (!IsOpaqueMulti(realX - 1, realY, realZ, 1, ySize, 1) || mustDrawSides)) {
// 		R.ctx.beginPath();
// 		R.ctx.moveTo(x, y);
// 		R.ctx.lineTo(x2, y2);
// 		R.ctx.lineTo(x2, y2 + scale2 * ySize);
// 		R.ctx.lineTo(x, y + scale * ySize);
// 		R.ctx.closePath();
// 		if (sideStyle === "wall_grad") {
// 			R.ctx.fillStyle = GetWallGradientHorizontal(x, x2, realZ);
// 		}
// 		R.ctx.fill();
// 		R.ctx.stroke();
// 	}
// 	// right side
// 	if (x2 + scale2 > x + scale && (!IsOpaqueMulti(realX +xSize, realY, realZ, 1, ySize, 1) || mustDrawSides)) {
// 		R.ctx.beginPath();
// 		R.ctx.moveTo(x + scale * xSize, y);
// 		R.ctx.lineTo(x2 + scale2 * xSize, y2);
// 		R.ctx.lineTo(x2 + scale2 * xSize, y2 + scale2 * ySize);
// 		R.ctx.lineTo(x + scale * xSize, y + scale * ySize);
// 		R.ctx.closePath();
// 		if (sideStyle === "wall_grad") {
// 			R.ctx.fillStyle = GetWallGradientHorizontal(x + scale, x2 + scale2, realZ);
// 		}
// 		R.ctx.fill();
// 		R.ctx.stroke();
// 	}
// 	R.ctx.restore();
// }

function DrawAreaEdges (area, x, y, z) {
	var areaXSize = area.xSize;
	var areaYSize = area.ySize;
	R.ctx.save();
	
	var doFill = false;
	// Dark cover over tiles below the edit level
	if (R.EDIT_MODE && z === Math.floor(R.cameraZ) - 1) {
		R.ctx.fillStyle = "#000000";
		R.ctx.globalAlpha = 0.7;
		doFill = true;
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

	// R.ctx.stroke();

	// Light cover over tiles at the current edit level
	if (R.EDIT_MODE && z === Math.floor(R.cameraZ)) {
		R.ctx.fillStyle = "#FFFFFF";
		R.ctx.globalAlpha = 0.15;
		doFill = true;
	}
	DrawQuad(x, y, z, area.xSize, area.ySize, true, doFill);
	R.ctx.restore();
}

function InCeiling (x, y, z) {
	if (R.cameraZ < z) {
		if (IsNearXY(Math.floor(R.cameraX), Math.floor(R.cameraY), x, y, 2)) {
			return true;
		}
	}
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

// Check if a single tile is opaque
function IsOpaque (x, y, z) {
	return curLevel.CheckLocationSolid(Math.round(x), Math.round(y), Math.round(z), true);
}

// Check if multiple tiles are opaque
// Return true if all of the tiles are opaque
function IsOpaqueMulti (x, y, z, xSize, ySize, zSize) {
	
	for (var xi = 0; xi < xSize; xi++) {
		for (var yi = 0; yi < ySize; yi++) {
			for (var zi = 0; zi < zSize; zi++) {
				var tileIsOpaque = curLevel.CheckLocationSolid(Math.round(x + xi), Math.round(y + yi), Math.round(z + zi), true);
				if (!tileIsOpaque) {
					return false;
				}
			}
		}
	}
	return true;
}

/*function IsOpaque (x, y, z) {
	for (var i = 0; i < areas.length; i++) {
		var area = areas[i];
		if (x >= area.x && x < area.x + area.xSize &&
			y >= area.y && y < area.y + area.ySize &&
			z >= area.z && z < area.z + area.zSize) {
			//Within area's bounds
			var tile = area.map[x - area.x][y - area.y][z - area.z];
			if (TileIsOpaque(tile)) {
				return true;
			}
		}
		if (area.xMov !== 0 || area.yMov !== 0 || area.zMov !== 0) {
			//Area is moving: check new bounds
			if (x >= area.x + area.xMov && x < area.x + area.xMov + area.xSize &&
				y >= area.y + area.yMov && y < area.y + area.yMov + area.ySize &&
				z >= area.z + area.zMov && z < area.z + area.zMov + area.zSize) {
				var tile = area.map[x - area.x - area.xMov][y - area.y - area.yMov][z - area.z - area.zMov];
				if (TileIsOpaque(tile)) {
					return true;
				}
			}
		}
	}
	return false;
}*/

// function DrawComplicatedEntity (xPos, yPos, zPos, scaleTop, xScrTop, yScrTop, kind, xSize, ySize, zSize, color) {
function DrawComplicatedEntity (xPos, yPos, zPos, kind, xSize, ySize, zSize, color) {
	return;
	// Prep
	// Scale values from top to bottom of block
	// var scale00 = scaleTop;
	// var scale01 = GetScale(zPos - 0.1);
	// var scale02 = GetScale(zPos - 0.2);
	// var scale03 = GetScale(zPos - 0.3);
	// var scale04 = GetScale(zPos - 0.4);
	// var scale05 = GetScale(zPos - 0.5);
	// var scale06 = GetScale(zPos - 0.6);
	// var scale07 = GetScale(zPos - 0.7);
	// var scale08 = GetScale(zPos - 0.8);
	// var scale09 = GetScale(zPos - 0.9);
	// var scale10 = GetScale(zPos - 1.0);
	// x positions from top to bottom of block
	// var xScr00 = xScrTop;
	// var xScr01 = GetScreenXHaveScale(xPos, yPos, zPos - 0.1, scale01);
	// var xScr02 = GetScreenXHaveScale(xPos, yPos, zPos - 0.2, scale02);
	// var xScr03 = GetScreenXHaveScale(xPos, yPos, zPos - 0.3, scale03);
	// var xScr04 = GetScreenXHaveScale(xPos, yPos, zPos - 0.4, scale04);
	// var xScr05 = GetScreenXHaveScale(xPos, yPos, zPos - 0.5, scale05);
	// var xScr06 = GetScreenXHaveScale(xPos, yPos, zPos - 0.6, scale06);
	// var xScr07 = GetScreenXHaveScale(xPos, yPos, zPos - 0.7, scale07);
	// var xScr08 = GetScreenXHaveScale(xPos, yPos, zPos - 0.8, scale08);
	// var xScr09 = GetScreenXHaveScale(xPos, yPos, zPos - 0.9, scale09);
	// var xScr10 = GetScreenXHaveScale(xPos, yPos, zPos - 1.0, scale10);
	// y positions from top to bottom of block
	// var yScr00 = yScrTop;
	// var yScr01 = GetScreenYHaveScale(xPos, yPos, zPos - 0.1, scale01);
	// var yScr02 = GetScreenYHaveScale(xPos, yPos, zPos - 0.2, scale02);
	// var yScr03 = GetScreenYHaveScale(xPos, yPos, zPos - 0.3, scale03);
	// var yScr04 = GetScreenYHaveScale(xPos, yPos, zPos - 0.4, scale04);
	// var yScr05 = GetScreenYHaveScale(xPos, yPos, zPos - 0.5, scale05);
	// var yScr06 = GetScreenYHaveScale(xPos, yPos, zPos - 0.6, scale06);
	// var yScr07 = GetScreenYHaveScale(xPos, yPos, zPos - 0.7, scale07);
	// var yScr08 = GetScreenYHaveScale(xPos, yPos, zPos - 0.8, scale08);
	// var yScr09 = GetScreenYHaveScale(xPos, yPos, zPos - 0.9, scale09);
	// var yScr10 = GetScreenYHaveScale(xPos, yPos, zPos - 1.0, scale10);
	R.ctx.save();
	if (kind === "laser") {
		// Straight line with 3D rotating spiral of dots
		// Set colors
		R.ctx.fillStyle = color;
		R.ctx.strokeStyle = color;
		var xCurrent = xPos;
		var yCurrent = yPos;
		var zCurrent = zPos;
		var xChange = (xSize > 1 ? 1 : 0);
		var yChange = (ySize > 1 ? 1 : 0);
		// Case for 1x1 laser: just make it horizontal
		if (xChange === 0 && yChange === 0) {
			xChange = 1;
		}
		var xEnd = xPos + xSize - 1;
		var yEnd = yPos + ySize - 1;
		while (xCurrent <= xEnd && yCurrent <= yEnd) {
			// Check opaqueness of tile
			if (!IsOpaque(xCurrent, yCurrent,  zCurrent)) {
				// Draw line and dots
				R.ctx.beginPath();
				if (xChange === 1) {
					// Determine x distance from start
					var xDif = xCurrent - xPos;
					// Horizontal line
					R.ctx.moveTo(xScr05 + xDif * scale05, yScr05 + scale05 * 0.5);
					R.ctx.lineTo(xScr05 + (xDif + 1) * scale05, yScr05 + scale05 * 0.5);
					R.ctx.lineWidth = 3;
					R.ctx.stroke();
					// Draw spiral of dots
					// TODO: draw half of these dots below the line
					for (var i = 0; i < 6; i++) {
						R.ctx.beginPath();
						// R.ctx.rect(xScr05 + xDif * scale05 + (i / 8), yScr05 + (0.5 + Math.sin(i / (8 * Math.PI)) * 0.5) * scale05, 5, 5);
						//R.ctx.rect(xScr05 + scale05 * (xDif + Math.sin(frameCounter / 200)), yScr05 + scale05 * Math.sin(frameCounter / 200), 2, 2);
						R.ctx.rect(xScr05 + scale05 * (xDif + 0.5 + Math.cos(i + frameCounter / 10) * 0.5), yScr05 + scale05 * (0.5 + Math.sin(i + frameCounter / 10) * 0.5), 2, 2);
						R.ctx.fill();
					}
				}
				else {
					// Determine y distance from start
					var yDif = yCurrent - yPos;
					//Vertical line
					R.ctx.moveTo(xScr05 + scale05 * 0.5, yScr05 + yDif * scale05);
					R.ctx.lineTo(xScr05 + scale05 * 0.5, yScr05 + (yDif + 1) * scale05);
					R.ctx.lineWidth = 3;
					R.ctx.stroke();
					// Draw spiral of dots
					// TODO: draw half of these dots below the line
					for (var i = 0; i < 6; i++) {
						R.ctx.beginPath();
						// R.ctx.rect(xScr05 + (0.5 + Math.sin(i / (8 * Math.PI)) * 0.5) * scale05, yScr05 + yDif * scale05 + (i / 8), 5, 5);
						R.ctx.rect(xScr05 + scale05 * (0.5 + Math.cos(i + frameCounter / 10) * 0.5), yScr05 + scale05 * (yDif + 0.5 + Math.sin(i + frameCounter / 10) * 0.5), 2, 2);
						R.ctx.fill();
					}
				}
			}
			// Move to next tile
			xCurrent += xChange;
			yCurrent += yChange;
		}
	}
	else if (kind === "door") {

	}
	else if (kind === "teleporter") {

	}
	// Wizard
	else if (kind === "wizard") {
		// Draw feet/shoes
		R.ctx.beginPath();
		R.ctx.fillStyle = "#8D501C";
		R.ctx.strokeStyle = "#5C3412";
		R.ctx.arc(xScr10 + scale10 * 0.45, yScr10 + scale10 * 0.5, scale10 * 0.05, Math.PI * 2, false);
		R.ctx.fill();
		R.ctx.stroke();
		R.ctx.beginPath();
		R.ctx.arc(xScr10 + scale10 * 0.55, yScr10 + scale10 * 0.5, scale10 * 0.05, Math.PI * 2, false);
		R.ctx.fill();
		R.ctx.stroke();
		// Draw legs
		// Draw arms
		// Draw sleeves
		// Draw shirt
		R.ctx.beginPath();
		R.ctx.fillStyle = "#1080F0";
		R.ctx.strokeStyle = "#0070E0";
		// R.ctx.rect(xScr04 + scale04 * 0.4, yScr04 + scale04 * 0.5, scale04 * 0.2, scale04 * 0.4);
		R.ctx.moveTo(xScr05 + scale05 * 0.42, yScr05 + scale05 * 0.5);
		R.ctx.lineTo(xScr05 + scale05 * 0.58, yScr05 + scale05 * 0.5);
		R.ctx.lineTo(xScr09 + scale09 * 0.58, yScr09 + scale09 * 0.5);
		R.ctx.lineTo(xScr09 + scale09 * 0.42, yScr09 + scale09 * 0.5);
		R.ctx.closePath()
		R.ctx.fill();
		R.ctx.stroke();
		// Draw head
		R.ctx.beginPath();
		R.ctx.fillStyle = "#B18456";
		R.ctx.strokeStyle = "#956738";
		R.ctx.arc(xScr03 + scale03 * 0.5, yScr03 + scale03 * 0.5, scale03 * 0.1, Math.PI * 2, false);
		R.ctx.fill();
		R.ctx.stroke();
		// Draw hat rim
		R.ctx.fillStyle = "#1080F0";
		R.ctx.strokeStyle = "#0070E0";
		R.ctx.beginPath();
		// R.ctx.ellipse(xScrTop + scaleTop / 2, yScrTop + scaleTop / 2, scaleTop / 2, scaleTop * R.CAMERA_TILT / 2, 0, 0, Math.PI * 2);
		R.ctx.ellipse(xScr02 + scale02 * 0.5, yScr02 + scale02 * 0.5, scale02 * 0.15, scale02 * 0.15 * R.CAMERA_TILT, 0, 0, Math.PI * 2);
		R.ctx.fill();
		R.ctx.stroke();
		// Draw hat cone
		R.ctx.fillStyle = "#1080F0";
		R.ctx.strokeStyle = "#0070E0";
		R.ctx.beginPath();
		R.ctx.moveTo(xScr02 + scale02 * 0.45, yScr02 + scale02 * 0.5);
		R.ctx.lineTo(xScr00 + scale00 * 0.5, yScr00 + scale00 * 0.5);
		R.ctx.lineTo(xScr02 + scale02 * 0.55, yScr02 + scale02 * 0.5);
		R.ctx.fill();
		R.ctx.stroke();
	}
	else {
		console.log("Don't have a drawing approch for " + kind + " yet!")
	}
	// Done
	R.ctx.restore();
}

