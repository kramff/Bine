//Server for Bine
//Copyright Mark Foster 2015

var io = require("socket.io")(8080);
var fs = require("fs");

io.on("connection", function(socket) {
	socket.emit("test", {wow: "such data"});
	console.log("a connection");
});


/*
fs.writeFile("test1.bine", "data data wow wow 2", function (err) {
	if (err)
	{
		console.log("failed to write level data");
	}
});

*/
