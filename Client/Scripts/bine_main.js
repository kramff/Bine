// bine_main.js
// main code - loads and runs other scripts


var gameReady = false;
function Init () {
	SocketInit();
	window.requestAnimationFrame(Update);
	
	PrepareFirstTranspTileArray();
	areaColors = GenerateColorPalette(100);


	ResizeCanvas();
	// StartMapEditor();

	player = CreateEntity(16, 5, -4);
	InitGame();
	
	ImportLevel('{"areas":[{"x":0,"y":0,"z":0,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]]],"rules":0}],"entities":[],"player":{"x":2,"y":2,"z":1}}');
	ShowMenu("main_menu");
	SetupButtons();
	gameReady = true;
}