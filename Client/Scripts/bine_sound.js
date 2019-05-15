// bine_sound.js
// Sound: Sound Effects, Music, etc.

// var audioSources = {
// 	footsteps: {
// 		concrete: {n: 10},
// 		wood: {n: 0},
// 		rug: {n: 0},
// 		sticks: {n: 5},
// 		leaves: {n: 0},
// 		sand: {n: 0},
// 		dirt: {n: 5},
// 		snow: {n: 0},
// 	},
// }

var jsonAudioData = {};
var audioDataTree = {};

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var autoMuted = true;

var manualMuted = false;

function tryResumeAudio () {
	if (autoMuted) {
		audioCtx.resume();
		console.log("Audio resumed from automatic pause");
		autoMuted = false;
	}
}

function LoadAllSound () {
	fetch("Client/JSON/audio_data.json").then(function (response) {
		return response.json();
	}).then(function (responseData) {
		jsonAudioData = responseData;
		RecursiveLoadAudio(jsonAudioData, audioDataTree, "");
	});
}

function RecursiveLoadAudio (data, tree, nesting) {
	for (var key in data) {
		if (data.hasOwnProperty(key) && (typeof data[key] === "object")) {
			if (key === "files") {
				tree[key] = [];
				LoadAudioFileArray(data[key], tree[key], nesting);
			}
			else {
				tree[key] = {};
				RecursiveLoadAudio(data[key], tree[key], nesting + "/" + key);
			}
		}
	}
}

function LoadAudioFileArray (fileArray, destinationArray, nesting) {
	for (var i = 0; i < fileArray.length; i++) {
		fileArray[i]
		GetAudioData(nesting + "/" + fileArray[i], destinationArray, i);
	}
}

function GetAudioData (fileLocation, destinationArray, destinationIndex) {
	var finalFileLocation = "Client/Audio" + fileLocation;

	destinationArray[destinationIndex] = {
		finalFileLocation: finalFileLocation,
		audioData: undefined
	};

	fetch(finalFileLocation).then(function (response) {
		return response.arrayBuffer();
	}).then(function (buffer) {
		return audioCtx.decodeAudioData(buffer);
	}).then(function (audioData) {
		destinationArray[destinationIndex].audioData = audioData;
	});
}

function PlayRandomFootstep () {

	if (manualMuted) {
		return;
	}

	var footstepFiles = audioDataTree.Effects.Footsteps.Concrete.files;

	var randomFootstep = footstepFiles[Math.floor(Math.random() * footstepFiles.length)];

	var bufferSource = audioCtx.createBufferSource();
	bufferSource.buffer = randomFootstep.audioData;

	bufferSource.connect(audioCtx.destination);
	bufferSource.start();
}

// var oscillator = undefined;
// var gainNode = undefined;
var processor = undefined

var sampleDelay = 100000;

class MyWorkletNode extends AudioWorkletNode {
  constructor(context) {
    super(audioCtx, 'my-worklet-processor');
  }
}



function SetupSound () {


	audioCtx.audioWorklet.addModule('Client/Scripts/Worklet/reverb.js').then(() => {
	  let node = new MyWorkletNode(audioCtx);
	});

	return;
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
			if (sampleDelay < 1000) {
				outputData[sample] = ((Math.random() * 2) - 1) * 0.2;
			}
			if (sampleDelay < 1) {
				sampleDelay = 100000;
			}
		}
	}
}

var soundMuted = false;

function DirectionalSound (soundType, sourceX, sourceY, sourceZ, levelRef) {

	if (soundMuted) {
		return;
	}

	var listenerX = 0;
	var listenerY = 0;
	var listenerZ = 0;
	if (curPlayer !== undefined) {
		listenerX = curPlayer.x;
		listenerY = curPlayer.y;
		listenerZ = curPlayer.z;
	}

	var soundAngle = Math.atan2(sourceY - listenerY, sourceX - listenerX);
	var closeEar = (soundAngle < 0.5 * Math.PI && soundAngle > -0.5 * Math.PI) ? "right" : "left";
	var farEar = (closeEar === "right") ? "left" : "right";

	if (sourceX === listenerX) {
		closeEar = "both";
		farEar = "none";
	}
	// console.log("soundAngle: " + Math.round(soundAngle * 100) / 100);

	var affectAngle = 0;
	if (farEar === "right") {
		// affectAngle = Math.abs(soundAngle) - (0.5 * Math.PI) 
		affectAngle = Math.abs(soundAngle) - (Math.PI / 2);
	}
	else if (farEar === "left") {
		// affectAngle = Math.PI - Math.abs(soundAngle);
		affectAngle = (Math.PI / 2) - Math.abs(soundAngle);
	}
	// console.log("AffectAngle: " + Math.round(affectAngle * 100) / 100);

	var distX = sourceX - listenerX;
	var distY = sourceY - listenerY;
	var distZ = sourceZ - listenerZ;
	var distance = Math.sqrt((distX * distX) + (distY * distY) + (distZ * distZ));

	// Setup adjustment values
	var overallGain = 1 / Math.sqrt(Math.max(1, distance));

	var leftEarGain = 0;
	var rightEarGain = 0;

	if (farEar !== "none") {
		var farEarGain = overallGain * Math.abs(Math.cos(affectAngle));
		if (farEar === "right") {
			leftEarGain = overallGain;
			rightEarGain = farEarGain;
		}
		else {
			leftEarGain = farEarGain;
			rightEarGain = overallGain;
		}
	}
	else {
		leftEarGain = overallGain;
		rightEarGain = overallGain;
	}


	// Non-directional footstep -----
	var footstepFiles = audioDataTree.Effects.Footsteps.Concrete.files;

	var randomFootstep = footstepFiles[Math.floor(Math.random() * footstepFiles.length)];

	var bufferSource = audioCtx.createBufferSource();
	bufferSource.buffer = randomFootstep.audioData;

	// var pannerNode = audioCtx.createPanner();

	// bufferSource.connect(pannerNode);
	// pannerNode.connect(audioCtx.destination);

	// pannerNode.setPosition(sourceX, sourceY, sourceZ);

	// var splitter = new ChannelSplitterNode(audioCtx, {numberOfOutputs: 2})
	// var splitter = audioCtx.createChannelSplitter(2);
	

	// bufferSource.connect(splitter);

	var gainNodeLeft = audioCtx.createGain();
	gainNodeLeft.gain.value = leftEarGain;
	var gainNodeRight = audioCtx.createGain();
	gainNodeRight.gain.value = rightEarGain;

	bufferSource.connect(gainNodeLeft);
	bufferSource.connect(gainNodeRight);

	// console.log("Left: " + (Math.round(leftEarGain * 100) / 100) + ", Right: " + (Math.round(rightEarGain * 100) / 100));

	var merger = new ChannelMergerNode(audioCtx, {numberOfInputs: 2})

	gainNodeLeft.connect(merger, 0, 0);
	gainNodeRight.connect(merger, 0, 1);

	merger.connect(audioCtx.destination);

	// bufferSource.connect(audioCtx.destination);
	bufferSource.start();
	// -----


}

