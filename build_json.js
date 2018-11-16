// Run this to create the following files:
// Client/JSON/audio_data.json
// 

console.log("Build Command to Set Up JSON Files");

var fs = require("fs");

function RecursiveWalk (dir) {
	var data = {};
	var list = fs.readdirSync(dir);
	list.forEach(function(file) {
		fullFile = dir + '/' + file;
		var stat = fs.statSync(fullFile);
		if (stat && stat.isDirectory())
		{
			var results = RecursiveWalk(fullFile);
			data[file] = (results);
		}
		else
		{
			if (data.files === undefined)
			{
				data.files = [];
			}
			data.files.push(file);
		}
	});
	return data;
}

console.log("Setting up audio JSON...");

var audioLocation = "Client/Audio";
var audioData = RecursiveWalk(audioLocation);
console.log(audioData);
fs.writeFileSync("Client/JSON/audio_data.json", JSON.stringify(audioData));

