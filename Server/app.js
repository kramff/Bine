// Server for Bine
// Copyright Mark Foster 2015

console.log("starting server \\(^.^)/");

var http = require("http");
var socketio = require("socket.io");

var levels = require("./levels.js");

var listener = function (req, res) {
	res.end("wowowow u are leet haxor");
}
var server = http.createServer(listener)
server.listen(process.env.PORT || 5000);

var io = socketio(server);

var motd = "DOWNLOAD MORE RAM";

var serverLevels = ["ye_olde_playground"];

var levelData = [{name: "ye_olde_playground", data: '{"areas":[{"x":16,"y":5,"z":-4,"xSize":10,"ySize":10,"zSize":10,"map":[[[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,0,1,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,0,1,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]],[[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,1,0,0,0,0,0,0,0]]],"rule":0},{"x":26,"y":7,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[3,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[3,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[3,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0]]],"rule":0},{"x":31,"y":9,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,2,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,2,2,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],[[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]]],"rule":0},{"x":26,"y":12,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]]],"rule":0},{"x":31,"y":14,"z":-4,"xSize":5,"ySize":5,"zSize":5,"map":[[[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0]],[[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0],[1,1,1,0,0]]],"rule":0}],"player":{"x":33,"y":16,"z":-3}}'}];





// level stuff from client

var areas = [];

function ClearLevel () {
	areas = [];
}

function Area (x, y, z, xSize, ySize, zSize, useImport, map, rule) {
	this.x = x;
	this.y = y;
	this.z = z;
	
	this.xSize = xSize;
	this.ySize = ySize;
	this.zSize = zSize;

	this.xMov = 0;
	this.yMov = 0;
	this.zMov = 0;
	this.moveDelay = 0;
	this.delayTime = 10;

	this.rule = rule;
	this.simulate = false;

	this.name = "Area " + (areas.length + 1);

	this.status = 0;
	this.extraData = []; //[x][y][z] - object with any values
	this.map = []; //[x][y][z] - type (number)
	if (useImport)
	{
		this.map = map;
	}
	for (var i = 0; i < xSize; i++)
	{
		if (!useImport)
		{
			this.map.push([]);
		}
		this.extraData.push([]);
		for (var j = 0; j < ySize; j++)
		{
			if (!useImport)
			{
				this.map[i].push([]);
			}
			this.extraData[i].push([]);
			for (var k = 0; k < zSize; k++)
			{
				var tile = EMPTY;
				if (!useImport)
				{
					
				}
				else // (useImport === true)
				{
					tile = this.map[i][j][k];
				}
				var extra;
				switch (tile)
				{
					default:
						extra = {};
					break
					case APPEAR_BLOCK:
						extra = {opacity: 0};
					break;
					case DISAPPEAR_BLOCK:
						extra = {opacity: 1};
					break;
					case PATTERN_BLOCK:
						extra = {pattern: 0};
					break;
					case SIMULATION_BLOCK:
						extra = {prevSim: 0, newSim: 0};
						area.simulate = true;
					break;
					case FLUID_BLOCK:
						extra = {prevFill: 0.1, newFill: 0.1, prevflow: [0, 0, 0, 0, 0, 0], newFlow: [0, 0, 0, 0, 0, 0]};
						area.simulate = true;
					break;
				}
				this.extraData[i][j].push(extra);
				if (!useImport)
				{
					this.map[i][j].push(tile);
				}
			}
		}
	}
}

// SetStartLocation


function ImportLevel (levelData) {
	//import a levelData string into the current level
	var importedData = JSON.parse(levelData);
	if (importedData === null)
	{
		console.log("null levelData");
		return;
	}
	ClearLevel();

	for (var i = 0; i < importedData.areas.length; i++)
	{
		areaData = importedData.areas[i];
		var newArea = new Area(areaData.x, areaData.y, areaData.z, areaData.xSize, areaData.ySize, areaData.zSize, true, areaData.map);
		areas.push(newArea);
		drawObjects.push(newArea);
	}
	//player = new Entity(importedData.player.x, importedData.player.y, importedData.player.z);
	//entities.push(player);
}






var playerArray = [];
var playerNum = 0;

function UpdatePlayer (player) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id == player.id)
		{
			playerArray[i] = player;
			return;
		}
	}
	playerArray.push(player);
}
function RemovePlayer (player) {
	for (var i = 0; i < playerArray.length; i++)
	{
		if (playerArray[i].id == player.id)
		{
			playerArray.splice(i, 1);
			return;
		}
	}
}

io.on("connection", function(socket) {
	console.log("User connected with id: " + socket.id);

	socket.on("disconnect", function () {
		socket.broadcast.emit("disconnection", {"id": socket.id});
		RemovePlayer({"id": socket.id});
	});

	// For each connection:
	// - Send the message of the day
	// - Send serverLevels (the list of levels available and how many players are in each level)
	// - (For now) Send an initial upate for each current player
	socket.emit("motd", motd);
	socket.emit("serverLevels", serverLevels);
	for (var i = 0; i < playerArray.length; i++)
	{
		socket.emit("playerMove", playerArray[i]);
	}

	//Temporary main level
	socket.emit("chosenLevel", levelData[0]);

	// When requested:
	// - Send list of players active on a level
	// - Send requested level data
	// - Send a preview of a level (?)
	socket.on("getLevelPlayers", function (data) {
		// data - name of level to get current players of
	});
	socket.on("getLevelData", function (data) {
		// data - name of level to send
	});
	socket.on("getLevelPreview", function (data) {
		// data - name of level to send preivew
	});

	// Automatically when input recieved from players 
	// - Send player events (movement, etc)
	// - Send level events (areas move, NPC's do actions)
	// - Send new messages from other players
	// - Send level updates (tile/other edits)

	// Input from players
	// - Switching level (Joining multiplayer level, making local level multiplayer, creating a local-only instance of a level, etc...)
	// - Gameplay (movement, etc) -> send to players in same area
	// - Messages (chat) -> send to players
	// - Level events (player triggered a switch, etc) -> send to players
	// - Editor stuff (player edits a tile/edits other stuff) -> send to players

	socket.on("switchLevel", function (data) {
		// data - name of level to switch to, or "local" if leaving multiplayer

		// Join the socket.io room for that level (?)
	});
	socket.on("playerMove", function (data) {
		// data - new position of player
		data.id = socket.id;
		socket.broadcast.emit("playerMove", data);
		UpdatePlayer(data);
	});
	socket.on("message", function (data) {
		// data - chat message sent by player
		data.id = socket.id;
		socket.broadcast.emit("message", data);
	});
	socket.on("levelEvent", function (data) {
		// data - data of the level event
		// {type, area, etc...}
		socket.broadcast.emit("levelEvent", data);
	});
	socket.on("edit", function (data) {
		// data - data of the edit information
		// {type, area, x, y, z}
		socket.broadcast.emit("edit", data);
	});
	socket.on("tileChange", function (data) {
		socket.broadcast.emit("tileChange", data);
	});
	socket.on("createArea", function (data) {
		socket.broadcast.emit("createArea", data);
	});
	socket.on("removeArea", function (data) {
		socket.broadcast.emit("removeArea", data);
	});


});


/*
fs.writeFile("test1.bine", "data data wow wow 2", function (err) {
	if (err)
	{
		console.log("failed to write level data");
	}
});

*/
// ░░░░░░░░░░░░▄▐ 
// ░░░░░░▄▄▄░░▄██▄ 
// ░░░░░▐▀█▀▌░░░░▀█▄ 
// ░░░░░▐█▄█▌░░░░░░▀█▄ 
// ░░░░░░▀▄▀░░░▄▄▄▄▄▀▀ 
// ░░░░▄▄▄██▀▀▀▀ 
// ░░░█▀▄▄▄█░▀▀ 
// ░░░▌░▄▄▄▐▌▀▀▀ 
// ▄░▐░░░▄▄░█░▀▀ U HAVE BEEN SPOOKED BY THE 
// ▀█▌░░░▄░▀█▀░▀ 
// ░░░░░░░▄▄▐▌▄▄ 
// ░░░░░░░▀███▀█░▄ 
// ░░░░░░▐▌▀▄▀▄▀▐▄ SPOOKY SKILENTON 
// ░░░░░░▐▀░░░░░░▐▌ 
// ░░░░░░█░░░░░░░░█ 
// ░░░░░▐▌░░░░░░░░░█ 
// ░░░░░█░░░░░░░░░░▐▌