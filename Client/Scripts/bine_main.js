// bine_main.js
// main code - loads and runs other scripts


// Load additional files
// Path changes if using local or web version
var isoSources = ["Testo", "bine_session"];
var isoScripts = [];
// var isoStates = [];
var numLoadedScripts = 0;
function LoadIsoScripts () {
	for (var i = 0; i < isoSources.length; i++)
	{
		var source = isoSources[i];
		var script = document.createElement("script");
		isoScripts.push(script)
		// isoStates.push(false);
		if (location.href === "http://kramff.github.io/")
		{
			script.setAttribute("src", "./Isomorphic/" + source + ".js");
		}
		else
		{
			script.setAttribute("src", "../Isomorphic/" + source + ".js");
		}
		document.getElementsByTagName('body')[0].appendChild(script);
		var loadFunc = (function (stateNum) {
			return function () {
				// isoStates[stateNum] = true;
				numLoadedScripts ++;
				if (numLoadedScripts >= isoSources.length)
				{
					console.log("all iso scripts loaded");
					// console.log(new Testo().foo(20) + ": should be 23");
					GameInit();
				}
			}
		})(i);
		script.onreadystatechange = loadFunc;
		script.onload = loadFunc;
	}
}

var mainCanvas = undefined;
var gameReady = false;

var inSession = false;
var curSession = undefined;

var inLevel = false;
var curLevel = undefined;

var editorActive = true;

function Init () {
	LoadIsoScripts();
	SocketInit();
	ShowMenu("main_menu");
	SetupButtons();
	gameReady = true;
	mainCanvas = document.getElementById("canvas");

	window.onresize = ResizeFunction;
	ResizeFunction();

	// Old Shit
	//window.requestAnimationFrame(Update);
	
	// PrepareFirstTranspTileArray();
	// areaColors = GenerateColorPalette(100);


	// ResizeCanvas();
	// StartMapEditor();

	// player = CreateEntity(16, 5, -4);
	// InitGame();
	
	// ImportLevel('{"areas":[{"x":0,"y":0,"z":0,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]]],"rules":0}],"entities":[],"player":{"x":2,"y":2,"z":1}}');
	// ShowMenu("main_menu");
	// SetupButtons();
	// gameReady = true;


	// FillSessionBox([{id: "123", name: "Test Session", mode: "play", worldName: "test world", playerCount: 10}])
}

function ResizeFunction () {
	mainCanvas.width = window.innerWidth;
	mainCanvas.height = window.innerHeight;
}

// This is run once all iso scripts are loaded
function GameInit () {


	// New Shit

	// var tempSession = new Session("my session", {levelDatas: [], tileData: [], worldRules: []});

	// var playerEntity = tempSession.CreatePlayerEntity();

	// console.log(playerEntity);

	window.requestAnimationFrame(MainUpdate);
}

var frameCounter = 0;
function MainUpdate () {
	window.requestAnimationFrame(MainUpdate);

	frameCounter ++;

	if (inSession & curSession !== undefined && inLevel && curLevel !== undefined)
	{
		// Render frame
		RenderLevel(mainCanvas, curSession, curLevel, 3, 3, 3 + Math.sin(frameCounter / 100));
	}
	else
	{
		// Animation for when not in a game
		ClearCanvas(mainCanvas);
	}
}