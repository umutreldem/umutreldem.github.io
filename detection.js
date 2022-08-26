let detectionHand = [];
let detectionFace = [];
let sendCounter = 0;
let modelsLoaded = false;

const videoElement = document.getElementById('video');
videoElement.style.display = 'none';

function gotHands(results) {
  detectionHand = results;
  //console.log(detectionHand);
}


function gotFace(results) {
    detectionFace = results;
    //console.log(detectionFace);
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 0,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(gotHands);

const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(gotFace);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    if (sendCounter == 1) { 
      modelsLoaded = true;
      if(soundEngine.audioLoad.every(value => value === true)) {
        videoElement.style.display = 'block';
      }
    }
    await hands.send({image: videoElement});
    await faceMesh.send({image: videoElement});
    if (sendCounter == 0) sendCounter++;
  },
  width: 640,
  height: 480
});

camera.start();
