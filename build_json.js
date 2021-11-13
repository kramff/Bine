// Run this to create the following files:
// Client/JSON/audio_data.json
// Client/JSON/image_data.json
// 

console.log("");
console.log("Running the Build Command to Set Up JSON Files\n");

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


// Audio data into JSON:
console.log("Setting up audio JSON...");
var audioLocation = "Client/Audio";
var audioData = RecursiveWalk(audioLocation);
console.log("Audio Data:");
console.log(JSON.stringify(audioData));
fs.writeFileSync("Client/JSON/audio_data.json", JSON.stringify(audioData));
console.log("");

// Image data into JSON
console.log("Setting up image JSON...");
var imageLocation = "Client/Graphics";
var imageData = RecursiveWalk(imageLocation);
console.log("Image Data:");
console.log(JSON.stringify(imageData));
fs.writeFileSync("Client/JSON/image_data.json", JSON.stringify(imageData));
console.log("");

console.log("Done making JSONs!\n");
