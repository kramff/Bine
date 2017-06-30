// bine_sound.js
// Sound: Sound Effects, Music, etc.


var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();


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