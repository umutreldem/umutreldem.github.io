/*
TODO:

  *DONE*-Head position/velocity detection (Check the nose vector)
  *DONE*-Add panning for the individual samples in the finger/eye/nose Tone.Players
  *DONE*-Add Stage 1
  *DONE*-Load all the audio files using a loop in the soundEngine
  
  *DONE*-Add toggle between stages
  *DONE*-Add callback for the audio load before loading the main sketch
  *DONE*-Load all the images using a loop in preload()

  *DONE*-Add unique sounds for different scrapes

  *DONE*-STAGE 3:Display visuals only when sound is triggered

  -Add right sounds

  *DONE*-Introduction "click to continue" screen at the beginning
  *DONE*-Add meditation/intro audio with the "click to skip" visuals
  -Add stage 3 transition when the shapes in stage 2 are done
  -Add stage 3 intro visuals

  -Optimisation & Code Cleanup
  -Final CSS for the webpage

*/

console.log("EtM 0.51");

let canvas;
let myImage;
let introImage;
let welcomeImage;
let stage2intro;
let stage3intro;

let startFlag = false;
let welcomeFlag = false;
let currentStage = 0;


let soundEngine;

let stageOne, intro;
let stageTwo;
let stageThree;

// let button;
// let font;

let loadingScreen;
let stage2Screen, stage3Screen;
let curves = new Array(4);
let imagesLoaded = new Array();


function preload() {
  introImage = loadImage('images/intro.png');
  welcomeImage = loadImage('images/welcome.png');
  stage2intro = loadImage('images/stage2intro.png');
  //stage3intro = loadImage('images/stage3intro.png');

  for(let i = 0; i < 4; i++) {
    curves[i] = loadImage('images/curve' + i + '.png', () => {imagesLoaded[i] = true;}, () => {console.log('Failed to load image: curve' + i + '.png' )});
  }

  loadingScreen = loadImage('images/loading.png', () => {imagesLoaded[4] = true;}, () => {console.log('Failed to load image: loading.png')});
  stage2Screen = loadImage('images/stage2.png', () => {imagesLoaded[5] = true;}, () => {console.log('Failed to load image: stage2.png')});
  stage3Screen = loadImage('images/stage3intro.png', () => {imagesLoaded[6] = true;}, () => {console.log('Failed to load image: stage3.png')});

}


function setup() {
  canvas = createCanvas(640, 480, WEBGL);
  canvas.id('canvas'); 
  setAttributes('alpha', true); //Necessary to show the video capture underneath


  for(let i = 0; i < 4; i++) {
    curves[i].loadPixels();
  }

  soundEngine = new SoundEngine();
  stageOne = new StageOne(soundEngine);
  stageTwo = new StageTwo(soundEngine, curves, stage2Screen);
  stageThree = new StageThree(soundEngine, stage3Screen);

  // button = createButton("Change stage");
  // button.mousePressed(console.log('very cool'));
  // button.size(210,110);
  // button.position(width - 200, height - 100);
  // button.style("font-family", "Bodoni");
  // button.style("font-size", "40px");

  angleMode(DEGREES);
}


function gimme() {
  soundEngine.audioLoad.every(value => value === true);
}

function draw() {


  if(modelsLoaded && soundEngine.audioLoad.every(value => value === true)) {
    switch(currentStage) {

      case 0:
        image(welcomeImage, -width/2, -height/2, width, height);
        break;

      case 1:
        stageOne.start();
        stageOne.show(); 
        break;

      case 2:
        stageOne.end();
        stageTwo.show();
        break;

      case 3:
        stageThree.show();
        break;

        

      default:
        console.log("The current stage is not recognised: " + currentStage);
    }
  } else {
    clear();

    fill(0, 255, 200);
    image(loadingScreen, -width/2 - 50, -height/2 - 50, width + 100, height + 50);
  }
}

function mousePressed() {

  if(modelsLoaded && soundEngine.audioLoad.every(value => value === true)) {

  if(!startFlag) {
    Tone.start();
  }
  startFlag = true;
  
    switch(currentStage) {

      case 0:
        changeStage();
        break;
  
      case 1:
        changeStage();
        break;
  
      case 2:
        if(!stageTwo.startFlag) {
          stageTwo.startFlag = true;
        } else {
        stageTwo.clicked(mouseX/width, mouseY/height);
        }
        break;
  
      case 3:
        if(stageThree.introFlag) {
          stageThree.introFlag = false;
        }
        break;
  
      default:
        console.log('How did you get here? The current stage is: ' + currentStage);
        break;
    }
  }



  // if(currentStage === 2) {
  // } else if(currentStage === 3) {
  //   stageThree.introFlag = false;
  // } else {
  //   stageThree.introFlag = true;
  // }
  //currentStage = ((currentStage + 1)) % 3 + 1;

  //soundEngine.jukebox['intro'].player.start();
}

function keyPressed() {
  if(keyCode == 32) {
    changeStage();
  }

  if(keyCode == RIGHT_ARROW) {
    stageTwo.changeImage();
  }

  return false;
}

function changeStage() {
  currentStage = (currentStage + 1) % 4;



  // if(currentStage != 1) {
  //   stageTwo.endStage();
  // }

  //console.log('very cool');

  return false;
}

