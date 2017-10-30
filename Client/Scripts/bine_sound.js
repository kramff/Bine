// bine_sound.js
// Sound: Sound Effects, Music, etc.

var audioSources = {
	footsteps: {
		concrete: {n: 10},
		wood: {n: 0},
		rug: {n: 0},
		sticks: {n: 5},
		leaves: {n: 0},
		sand: {n: 0},
		dirt: {n: 5},
		snow: {n: 0},
	},
}

var audioData = {};

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();

function LoadAllSound () {
	audioCtx.decodeAudioData("test").then(UseDecodedAudio);
}
function UseDecodedAudio (decodedData) {
}

// var oscillator = undefined;
// var gainNode = undefined;
var processor = undefined

var sampleDelay = 100000;

function SetupSound () {
	// oscillator = audioCtx.createOscillator();
	// oscillator.type = "square";
	// oscillator.connect(gainNode);
	// oscillator.start(0);

	processor = audioCtx.createScriptProcessor(4096, 0, 1);
	
	gainNode = audioCtx.createGain();
	gainNode.gain.value = 0.1;

	processor.connect(gainNode);

	// gainNode.connect(audioCtx.destination);

	processor.onaudioprocess = function (audioProcessingEvent) {
		var outputData = audioProcessingEvent.outputBuffer.getChannelData(0);
		for (var sample = 0; sample < outputData.length; sample++) {
			sampleDelay --;
			if (sampleDelay < 1000)
			{
				outputData[sample] = ((Math.random() * 2) - 1) * 0.2;
			}
			if (sampleDelay < 1)
			{
				sampleDelay = 100000;
			}
		}
	}
}
