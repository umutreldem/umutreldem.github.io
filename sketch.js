console.log("Fractal soundscape V6.2");

let mandelbrot, downsample, analysis; // Contain, downsample, analyse, and run the shader.

let colorPalette; // This will hold the color

let mandelShader, mandelAnalysis; // Shaders for visualising and analysing the visuals

let mandelPos, mandelDir; // Vectors to hold pos and dir info

let mandelScale = 5.; // Uniforms
let mandelSpeed = 0.005;
let mandelAngle = 0.;
let mandelDepth = 0.; 
let scaleX, scaleY;
let smoothPos, smoothScale, smoothAngle; // Smoothing variables

let colorBalance = []; // Array with increments for the amount of color/state per frame
let colorAmount = [];
const BFGSeeds = [[3, 7, 8785], [9811, 9707, 3801], [1518, 2008, 9707], [4728, 8147, 7475], [8417, 5, 108]];
let grainParams; // Array with settings of grain parameters of each color/state
let incr; // Amount of increment per pixel, for all pixels to add up to 1.

let debugMode = false; // Debug & Mobile flag
let mobile = false; 

let quality = 1; // Mandelbrot render quality, goes from 1 to 4.
let screenDiv = 30;

let screenLength; // Length of screen.

let palette = new Array(5) // RGB Color values of the palette (Array)
let c1, c2, c3, c4, c5; // LAB Color values of the palette

let minGrain, maxGrain // Grain amount per iteration

let tenth // 1/10 of width, to calculate the size of the mobile button

let m_currentX; // Mobile uniforms
let m_currentY;
let m_currentRot;
let m_currentScale;


let startFlag = false; // Flag to start the installation.

const mandelVoice = new Voice(); // Granular synth

const BFGBank = Array(5); // To hold the BFGs for filter settings.




function preload() { // Preloading necessary shaders

  mandelShader = loadShader('mandelbrot.vert', 'mandelbrot.frag');
  mandelAnalysis = loadShader('analysis.vert', 'analysis.frag');

}





function setup() {

  mobile = window.mobileAndTabletCheck();

  createCanvas(windowWidth, windowHeight);
  noStroke();

  screenLength = sqrt(width*width + height*height);
  setAttributes('antialias', false);
  mandelbrot = createGraphics(width/quality, height/quality, WEBGL); // Graphics buffer to calculate the shader (THIS HAS THE RESOLUTION OF THE RENDER)
  analysis = createGraphics(mandelbrot.width/2, mandelbrot.height/2, WEBGL); // Graphics buffers to downsample and analyze the shader

  mandelbrot.pixelDensity(1);
  analysis.pixelDensity(1);

  incr = 1./(analysis.width*analysis.height);

  downsample = createGraphics(mandelbrot.width/2, mandelbrot.height/2);

  downsample.pixelDensity(1);

  colorPalette = createGraphics(5, 1); // Graphics buffer to hold the color palette

  mandelPos = createVector(0., 0.); // Initial settings for the uniforms

  smoothPos = mandelPos.copy(); // Initial settings for the smoothing variables
  smoothScale = mandelScale;
  smoothAngle = 0.;

  loadColors(colorPalette, BFGSeeds); // Loads palette with five random colors, also filling the c1-c5 variables.
  colorPalette.loadPixels();

  textFont('Verdana');

  if(mobile) {

    maxGrain = 30;
    minGrain = 15;

  } else {

    maxGrain = 50;
    minGrain = 20;

  }

  grainParams = initiateGrainParams();

  for(let i = 0; i < BFGBank.length; i++) {
    BFGBank[i] = new BFG(4);
  }



  // Touch gesture recognition settings for mobile
  if(mobile) {
    var options = {
      preventDefault: true
    };
    var hammer = new Hammer(document.body, options);

    var doubletap = new Hammer.Tap({ event: 'doubletap', taps: 2, threshold: 50, posThreshold: 500, time: 500 });
    var singletap = new Hammer.Tap();

    hammer.add([doubletap, singletap]);
	  doubletap.recognizeWith(singletap);
    singletap.requireFailure(doubletap);

    hammer.on("tap", screenTapped);
    hammer.on("doubletap", (e) => {
    
      if(e.center.x < width - tenth && e.center.y < height - tenth) {
        resetPosition();
      }

    });

    hammer.get('pan').set({direction: Hammer.DIRECTION_ALL, pointers: 0});
    hammer.get('pinch').set({enable: true, pointers: 2});
    hammer.get('rotate').set({enable: true});

    hammer.on('pan', panMove);
    hammer.on('panend', panMoveEnd); 
    hammer.on('pinch', pinchZoom);
    hammer.on('pinchend', pinchZoomEnd)
    hammer.on('rotate', pinchRotate);
    hammer.on('rotateend', pinchRotateEnd);



  }

}





function draw() {

  //frameRate(30);
  mandelbrot.noSmooth();
  analysis.noSmooth();
  noSmooth();

  checkSmoothing(); // Smooth the data
  checkAspectRatio(); // Fix aspect ratio
  checkInput(); // Adjust uniforms if certain keys are being pressed

  mandelbrot.shader(mandelShader); // Run the shaders and set the uniforms.
  mandelShader.setUniform("u_resolution", [mandelbrot.width, mandelbrot.height]);
  mandelShader.setUniform("Area", [smoothPos.x, smoothPos.y, scaleX, scaleY]); 
  mandelShader.setUniform("Angle", smoothAngle); 
  mandelShader.setUniform("u_time", millis() / 1000.);
  mandelShader.setUniform("tex0", colorPalette); 

  

  mandelbrot.rect(0, 0, mandelbrot.width, mandelbrot.height); //Display the shader in the graphics buffer, and then display that on the main canvas.
  image(mandelbrot, 0, 0, width, height); 
  //image(colorPalette, 0, 0, 200, 200);


  if(frameCount%30 === 0) {

    analysis.shader(mandelAnalysis);
    mandelAnalysis.setUniform("u_resolution", [analysis.width, analysis.height]);
    mandelAnalysis.setUniform("tex0", downsample); 
    mandelAnalysis.setUniform("res", [downsample.width, downsample.height]); 
    mandelAnalysis.setUniform("Color1", c1);
    mandelAnalysis.setUniform("Color2", c2);
    mandelAnalysis.setUniform("Color3", c3);
    mandelAnalysis.setUniform("Color4", c4);
    mandelAnalysis.setUniform("Color5", c5);
    
    downsample.image(mandelbrot, 0, 0, downsample.width, downsample.height); //Load the shader in the analysis buffer, downsampling it,
    analysis.translate(-width/2, -height/2); // Fix WEBGL coordinates
    analysis.rect(0, 0, analysis.width, analysis.height);
    analysis.loadPixels();

    colorBalance = getColorBalance(analysis.pixels); // Create an array containing amount of each Color/State
    colorAmount = getColorAmount(colorBalance); // Create an array containing the amount of each Color

  }

//image(analysis, 0, 0, width, height);


  if(mobile) {

    if(frameCount%60 === 0) {

      generateGrains();

    }

  } else {
    if(frameCount%screenDiv === 0) {

      generateGrains();

    }
  }

  setPhaserParams(BFGBank, map(mandelDepth, 0, 1500, 0., 1.,true));
  setConvolverParams(mandelDepth);

  if(debugMode) {
    for(let i = 0; i < colorBalance.length; i++) { // Write color values on screen
 
        let amount = colorBalance[i];
        // amount /= (analysis.width * analysis.height) * 4;

        stroke(0);
        strokeWeight(10);
        fill(palette[floor(i/3)].getValues(mandelAngle, 255));
        textSize(50);

        text(amount.toFixed(2), 150 + (floor(i/3) * (width/5)), height - 20 - ((i%3) * 50));
      
    }
  }












  // Start text & Instructions
  if(!startFlag) { 

    fill(0, 150);
    rect(0, 0, width, height);
    
    fill(255);
    stroke(0);
    textSize(screenLength / 25);
    textAlign(CENTER);
    textStyle(BOLD);
    if(mobile) {

      text("Press to start", width/2 + 10, height/2)

    } else {

      text("Click to start", width/2 + 10, height/2)

    }

  }

  if(mandelDepth < 500) {

    let a = map(mandelDepth, 0, 500, 1., 0.,true);
    a = (a*a*a) * 255. // Cubic easing function
    
    fill(255, a);
    stroke(0, a);
    strokeWeight(2);
    textSize(screenLength / 75);
    textStyle(NORMAL);
    textAlign(LEFT);
    text("'Brief Gaze of the Infinite Maze’ is an interactive installation where you can explore an almost-infinite synaesthetic audiovisual space. \n \n Fractals are infinitely complex, never ending visual patterns. In this installation, each frame is turned into a soundscape in real time using an algorithm analyzing your perception of colors and shapes on the screen. \n \n The infinitely complex patterns turn into an ever-changing world of sound: Exploring the fractals creates complementary sonic events reflecting your unique journey in this audiovisual world.", 50, height/20, width/4, height);
    textAlign(RIGHT);
    
    if(mobile) {
      text("CONTROLS: \n \n Drag finger: Move around \n Pinch: Zoom in/out \n Rotate with two fingers: Rotate left/right \n Double tap: Reset \n Q Button: Change resolution \n\n\n Chrome & Headphones are recommended \n for better experience. \n\n\n Created by \n Umut Eldem \n\n umutreldem.com", width - 50, 100);
    } else {
      text("CONTROLS: \n \n Arrow keys: Move around \n W/S: Zoom in/out \n Q/E: Rotate left/right \n Spacebar: Reset position/zoom \n R: Change resolution \n\n\n Chrome & Headphones \n are recommended \n for better experience. \n\n\n Created by \n Umut Eldem \n\n umutreldem.com", width - 50, 100);

    } 
  }


  if(mobile) { // Quality button for mobile
    stroke(255);
    strokeWeight(5);
    fill(0, 200);

    tenth = width/10;

    rect(width - tenth, height - tenth, tenth, tenth);
    textSize(tenth * 0.75);
    textAlign(CENTER, CENTER);
    strokeWeight(10);
    fill(0);
    text("Q", width - (tenth/2), height - (tenth/2));
  }

}



function checkSmoothing() {
  smoothPos = p5.Vector.lerp(smoothPos, mandelPos, 0.1);
  smoothScale = lerp(smoothScale, mandelScale, 0.1);
  smoothAngle = lerp(smoothAngle, mandelAngle, 0.1);
}

function checkAspectRatio() {
  let aspectRatio = width/height;
  scaleX = smoothScale;
  scaleY = smoothScale;

  if (aspectRatio > 1.) {
    scaleY /= aspectRatio;
  } else {
    scaleX *= aspectRatio;
  }
};

function checkInput() {

  if(startFlag) {

    mandelDir = createVector(mandelSpeed * mandelScale, 0);
    let s = sin(mandelAngle);
    let c = cos(mandelAngle);
    mandelDir = createVector(mandelDir.x * c, mandelDir.x * s);

    if(keyIsDown(LEFT_ARROW)) {
      mandelPos.sub(mandelDir);
    } else if(keyIsDown(RIGHT_ARROW)) {
      mandelPos.add(mandelDir);
    }  
    
    mandelDir = createVector(-mandelDir.y, mandelDir.x);
    if(keyIsDown(UP_ARROW)) {
      mandelPos.add(mandelDir);
    } else if(keyIsDown(DOWN_ARROW)) {
      mandelPos.sub(mandelDir);
    }
    
    if(keyIsDown(87)) { // W & S = zoom in/out
      mandelScale *= 0.99;
      mandelDepth++;
    } else if(keyIsDown(83)) {
      mandelScale *= 1.01;
      mandelDepth--;
    }

    if(keyIsDown(81)) { // Q & E = rotate
      mandelAngle -= 0.01;
      refreshColors(colorPalette);
    } else if(keyIsDown(69)) {
      mandelAngle += 0.01;
      refreshColors(colorPalette);
    }

  }
  
}

function keyTyped() {

  if(startFlag) {

    if(keyCode === 32) { //Spacebar = Reset position
      resetPosition();
      refreshColors(colorPalette);
    }

    // if(keyCode === 68) { // D = Triger debug
    //   debugMode = !debugMode;
    // }

    if(keyCode === 82) { // B == Change quality (1 - 2.5)
      changeQuality();
    }

  }

}

function loadColors(buf, seeds) {


  for(let i = 0; i < 5; i++) {

    palette[i] = new BFG(3, seeds[i]);
    let newCol = palette[i].getValues(0, 255);
    newCol.push(255); // Alpha


    eval('c' + (i + 1)  + '= rgb2lab(newCol)'); 

    buf.set(i, 0, newCol);
  }
  

  buf.updatePixels();

} 

function refreshColors(buf) {

  buf.strokeWeight(1);

  for(let i = 0; i < 5; i++) {
    
    let scaledAngle = mandelAngle * 0.4; // The speed of the color change when rotating
    let newCol = palette[i].getValues(scaledAngle, 255);
    newCol.push(255); // Alpha

    eval('c' + (i + 1)  + '= rgb2lab(newCol)'); 
    
    
    buf.set(i, 0, newCol);

    buf.updatePixels();

    // buf.background(0);
    // buf.stroke(newCol);
    // buf.point([i], 0);

  }

} 


function getColorBalance(pix) {

  let arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


  for(let i = 0; i < pix.length; i += 4) { // Iterate through the R value of pixels


    switch(pix[i]) { // Color match for pixels 0.1/0.2/.../0.5 -> 25/51/76/102/128
      case 0:
        break;
      case 25: case 26:
        getColorState(pix, i, 0, arr);
        break;
      case 51:
        getColorState(pix, i, 3, arr);
        break;
      case 76: case 77:
        getColorState(pix, i, 6, arr);
        break;
      case 102:
        getColorState(pix, i, 9, arr);
        break;
      case 128:
        getColorState(pix, i, 12, arr);
        break;
      default:
        console.log('getColorBalance() color data is not recognised: ' + pix[i]);
    }
  }

  return arr;

}


function getColorState(arr, i, coli, colArr) {

  switch(arr[i+1]) { // Look at the G value of pixels
    case 25: case 26:
      colArr[coli + 0] += incr;
      break;
    case 51:
      colArr[coli + 1] += incr;
      break; 
    case 76: case 77:
      colArr[coli + 2] += incr;
      break;
    default:
      console.log('getColorState() state data is not recognised: ' + arr[i+1]);
  }

}

function getColorAmount(colBal) {

  let arr = [0., 0., 0., 0., 0., 0.]; // Last element is the amount of empty cells

  for(let i = 0; i < colBal.length; i += 3) {
    arr[floor(i/3)] = (colBal[i] + colBal[i+1] + colBal[i+2]);
    arr[5] += arr[floor(i/3)];
  }

  arr[5] = 1. - arr[5];
  return arr;

}


function resetPosition() {

  mandelPos = createVector(0., 0.);
  mandelScale = 5.;
  mandelAngle = 0.;
  mandelDepth = 0;

}


function rgb2lab(rgb){
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

function windowResized() {

  resizeCanvas(windowWidth, windowHeight); // Resize canvas and recalculate the screen length.
  screenLength = sqrt(width*width + height*height);

  mandelbrot.resizeCanvas(width/quality, height/quality);
  analysis.resizeCanvas(mandelbrot.width/2, mandelbrot.height/2);
  downsample.resizeCanvas(mandelbrot.width/2, mandelbrot.height/2);

  incr = 1./(analysis.width*analysis.height);

}

function mousePressed() {

  if(!startFlag) { // Start audio when mouse is pressed (Otherwise it will not run)

    initiateAudio();

    startFlag = true;

  }

}


function setPhaserParams(bank, val) { // Takes BFG bank and current time value, and sets the phaser bank parameters accordingly.

  for(let i = 0; i < bank.length; i++) {

    let newParams = bank[i].getValues(val);
    
    let freq = newParams[0] * 500.;
    let rate = newParams[1] * 0.5;
    let depth = newParams[2] * 0.25;
    let stereoPhase = newParams[3] * 20.;

    phaserBank[i].baseFrequency.value = freq;
    phaserBank[i].frequency.value = rate;
    phaserBank[i].depth = depth;
    phaserBank[i].Q.value = stereoPhase;

  }

}


function setConvolverParams(depth) { // Takes mandelbrot depth (0 - 500) and sets wet/dry level of reverb.

  let wet = map(depth, 0, 1200, 0.5, 0.1, true);
  let dry = 1. - wet;


  convolver.dryLevel = dry;
  convolver.wetLevel = wet;

  convolver.wet.value = wet;

 

}


function generateGrains() {

  let maxColor = max(colorAmount[0], colorAmount[1], colorAmount[2], colorAmount[3], colorAmount[4]);
  let amount = map(maxColor, 0., 1., maxGrain, minGrain);
  //console.log(amount);
  amount = floor(amount);
  //makeGrain(colorBalance);

  for(let i = 0; i < amount; i++) {
    let delay = random(0, 3000);
    setTimeout(makeGrain, delay, colorBalance);
  }

}

function makeGrain(arr) { // This will look at the colorBalance array and create an appropriate grain according to the current chances
  
  let gChance = Math.random(); 
  let acc = 0.;
  let result = 0;

  for(let i = 0; i < arr.length; i++) { //Chances range from 0.-1, accumulating on top of each other. 

    acc += arr[i];

    if(gChance < acc) { // If gChance is smaller than the current chance (falling in the threshold, it will chance result to that type.
      
      result = i + 1; // 0 -> Nothing happens, 1 - 15 -> Appropriate color/status grain. 
      break;

    }
  }
 


  if(result > 0) {
    result--; // Fixing index number to start from 0 and play grain.

    let xPos = map(mandelDepth, 0., 1500., 0., 0.9, true);
    let mandelSine = map(mandelDepth, 0., 1500., 0., PI, true);
    mandelSine = Math.sin(mandelSine) * (colorAmount[5] * 20.);


    let curColor = floor(result/3);
    if(true) { // 
      let curColorAmount = colorBalance[result];
      //curColorAmount *= curColorAmount
      //curColorAmount * mandelSine;

      //curColorAmount = Math.min(curColorAmount, 0.8);
      //curColorAmount = sqrt(1 - pow(curColorAmount - 1, 2)); // easeOutCirc easing function
      //curColorAmount *= curColorAmount;
      //curColorAmount = -1. * (Math.cos(Math.PI * curColorAmount) - 1.) / 2.;
      curColorAmount = map(curColorAmount, 0., 1., 0.5, 1.);
      
      //console.log(curColorAmount);

      mandelVoice.play(curColor, xPos, curColorAmount, grainParams[result]);
    }
  }


}


function initiateGrainParams() {

  let params = [
    {
      attack: 0.01, // Color 1 State 1 (EMPTY BORDER)
      attackRandOff: 0.01,
      release: 0.01,
      releaseRandOff: 0.01,
      spread: 0.35,
      speed: 4.,
      speedRandOff: 0.25,
      pan: 0.1,
      amp: 1.
    },
    
    {
      attack: 0.75, // Color 1 State 2 (FILL)
      attackRandOff: 0.15,
      release: 0.75,
      releaseRandOff: 0.15,
      spread: 0.05,
      speed: 0.35,
      speedRandOff: 0.1,
      pan: 0.1,
      amp: 0.2
    },
    
    {
      attack: 0.1, // Color 1 State 3 (MIXED or GRADIENT)
      attackRandOff: 0.05,
      release: 0.1,
      releaseRandOff: 0.05,
      spread: 0.01,
      speed: 1.,
      speedRandOff: 0.50,
      pan: 0.1,
      amp: 1.
    },
    
    {
      attack: 0.01, // Color 2 State 1 (EMPTY BORDER)
      attackRandOff: 0.01,
      release: 0.01,
      releaseRandOff: 0.01,
      spread: 0.35,
      speed: 2.5,
      speedRandOff: 0.25,
      pan: 0.1,
      amp: 1.
    },
    
    {
      attack: 0.75, // Color 2 State 2 (FILL)
      attackRandOff: 0.01,
      release: 0.75,
      releaseRandOff: 0.01,
      spread: 0.1,
      speed: 0.5,
      speedRandOff: 0.1,
      pan: 0.1,
      amp: 0.1
    },
    
    {
      attack: 0.1, // Color 2 State 3 (MIXED or GRADIENT)
      attackRandOff: 0.01,
      release: 0.1,
      releaseRandOff: 0.01,
      spread: 0.15,
      speed: 0.7,
      speedRandOff: 0.2,
      pan: 0.1,
      amp: 0.5
    },
    
    {
      attack: 0.01, // Color 3 State 1 (EMPTY BORDER)
      attackRandOff: 0.01,
      release: 0.01,
      releaseRandOff: 0.01,
      spread: 0.35,
      speed: 4.,
      speedRandOff: 0.25,
      pan: 0.1,
      amp: 1.
    },
    
    {
      attack: 0.75, // Color 3 State 2 (FILL)
      attackRandOff: 0.05,
      release: 0.75,
      releaseRandOff: 0.05,
      spread: 0.05,
      speed: 0.8,
      speedRandOff: 0.15,
      pan: 0.1,
      amp: 0.1
    },
    
    {
      attack: 0.1, // Color 3 State 3 (MIXED or GRADIENT)
      attackRandOff: 0.05,
      release: 0.5,
      releaseRandOff: 0.05,
      spread: 0.01,
      speed: 1.,
      speedRandOff: 0.50,
      pan: 0.1,
      amp: 0.75
    },
    
    {
      attack: 0.01, // Color 4 State 1 (EMPTY BORDER)
      attackRandOff: 0.01,
      release: 0.01,
      releaseRandOff: 0.01,
      spread: 0.35,
      speed: 4.,
      speedRandOff: 0.25,
      pan: 0.1,
      amp: 1.
    },
    
    {
      attack: 0.75, // Color 4 State 2 (FILL)
      attackRandOff: 0.05,
      release: 0.75,
      releaseRandOff: 0.05,
      spread: 0.05,
      speed: 0.7,
      speedRandOff: 0.15,
      pan: 0.1,
      amp: 0.2
    },
    
    {
      attack: 0.1, // Color 4 State 3 (MIXED or GRADIENT)
      attackRandOff: 0.01,
      release: 0.5,
      releaseRandOff: 0.01,
      spread: 0.1,
      speed: 1.,
      speedRandOff: 0.1,
      pan: 0.1,
      amp: 0.5
    },
    
    {
      attack: 0.01, // Color 5 State 1 (EMPTY BORDER)
      attackRandOff: 0.01,
      release: 0.01,
      releaseRandOff: 0.01,
      spread: 0.35,
      speed: 4.,
      speedRandOff: 0.25,
      pan: 0.1,
      amp: 1.
    },
    
    {
      attack: 0.75, // Color 5 State 2 (FILL)
      attackRandOff: 0.01,
      release: 0.75,
      releaseRandOff: 0.101,
      spread: 0.05,
      speed: 0.7,
      speedRandOff: 0.15,
      pan: 0.1,
      amp: 0.2
    },
    
    {
      attack: 0.05, // Color 5 State 3 (MIXED or GRADIENT)
      attackRandOff: 0.1,
      release: 0.01,
      releaseRandOff: 0.5,
      spread: 0.3,
      speed: 2.,
      speedRandOff: 1.,
      pan: 0.1,
      amp: 0.25
    }
  
  ];

  return params;

}


function changeQuality() {
  quality += 0.5;
  if(quality > 2.5) {
    quality = 1;
  }

  if(mobile) {

    switch(quality) {
      case 1:
        maxGrain = 30;
        minGrain = 15;
        screenDiv = 30;
        break;
      case 1.5:
        maxGrain = 20;
        minGrain = 10;
        break;
      case 2:
        maxGrain = 15;
        minGrain = 7;
        break;
      case 2.5:
        maxGrain = 10;
        minGrain = 5;
        break;
    }

  } else {  
    
    switch(quality) {
      case 1:
        maxGrain = 40;
        minGrain = 20;
        screenDiv = 30;
        break;
      case 1.5:
        maxGrain = 30;
        minGrain = 15;
        screenDiv = 60;
        break;
      case 2:
        maxGrain = 25;
        minGrain = 10;
        screenDiv = 90;
        break;
      case 2.5:
        maxGrain = 20;
        minGrain = 5;
        screenDiv = 120;
        break;
    }

  }

  windowResized();
}


// Regexp to check if the user is on mobile or tablet
window.mobileAndTabletCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};


// Mobile controls
function screenTapped(e) {

  if(e.center.x > width - tenth && e.center.y > height - tenth) {
    changeQuality();
  }
}


function pinchZoom(e) {
  
  panMove(e);

  if(m_currentScale == undefined) {

    m_currentScale = e.scale;

  } else {

    if(m_currentScale < e.scale) { 

      mandelScale *= 0.99;
      mandelDepth++;

    } else if(m_currentScale > e.scale) {

      mandelScale *= 1.01;
      mandelDepth--;

    }

  }
    //console.log(m_currentScale - e.scale);
}

function pinchZoomEnd(e) {
  m_currentScale = undefined;

  //console.log('pinch end');

} 

function pinchRotate(e) {
  if(m_currentRot == undefined) {
    m_currentRot = e.rotation;
  } else {


    let diffR = abs((m_currentRot-e.rotation)) / 8.;

    if(e.rotation > m_currentRot) {
      mandelAngle += 0.1 * diffR;
      
    } else if(e.rotation < m_currentRot) {
      mandelAngle -= 0.1 * diffR;
    }
  } 

  m_currentRot = e.rotation;
}

function pinchRotateEnd(e) {
  m_currentRot = undefined;

}

function panMove(e) {

  //console.log(e.deltaX);

  if(m_currentX == undefined) {
    m_currentX = e.deltaX;
    m_currentY = e.deltaY;
  } else {
    mandelDir = createVector(mandelSpeed * mandelScale, 0);
    let s = sin(mandelAngle);
    let c = cos(mandelAngle);

    let diffX = abs((m_currentX-e.deltaX)) / 8.;
    let diffY = abs((m_currentY-e.deltaY))/ 8.; 

    mandelDirH = createVector(mandelDir.x * c * diffX, mandelDir.x * s * diffX);
    mandelDirV = createVector(-mandelDir.x * s * diffY, mandelDir.x * c * diffY);

 
    
    if(e.deltaX > m_currentX) {
      mandelPos.sub(mandelDirH);
    } else if(e.deltaX < m_currentX) {
      mandelPos.add(mandelDirH);
    }

    if(e.deltaY > m_currentY) {
      mandelPos.add(mandelDirV);
    } else if(e.deltaY < m_currentY) {
      mandelPos.sub(mandelDirV);
    }

    m_currentX = e.deltaX;
    m_currentY = e.deltaY;

  }
}

function panMoveEnd(e) {
  m_currentX = undefined;
  m_currentY = undefined;
}









class BFG {

  constructor(planes, seed) {

    this.offset = Array(planes);

    if(!seed) { // if undefined
      this.seed = Array(planes);
      this.noseed = true;
    } else {
      this.seed = seed;
      this.noseed = false;
    }
    

    for(let i = 0; i < this.offset.length; i++) {
      
      this.offset[i] = 0.;

      if(this.noseed) {
      this.seed[i] = random(0, 100);
      }
    }
    

  }

  getValues(step, mult = 1) {
 

    let result = [];

    for(let i = 0; i < this.offset.length; i++) {
      noiseSeed(this.seed[i]);
      result[i] = noise(this.offset[i] + step) * mult;
    }
    return result;

  }

}


