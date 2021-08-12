
let mandelbrot; // This will contain and run the shader.
let downsample, analysis; // These will downsample and analyse the shader.
let colorPalette; // This will hold the color

let mandelShader; // Shaders for visualising and analysing the visuals
let mandelAnalysis;

let mandelPos, mandelScale, mandelSpeed, mandelAngle, mandelDir; // Uniforms for mandelbrot shader
let smoothPos, smoothScale, smoothAngle; // Smoothing variables

let aspectRatio; // To be used to figure out aspect ratio vs. the scale of the final texture
let scaleX;
let scaleY;


let colBalance; // Array with increments for the amount of color/state per frame
let grainParams; // Array with settings of grain parameters of each color/state
let incr; // Amount of increment per pixel, for all pixels to add up to 1.

let debugMode; // Debug flag

let p = []; // Text to be written on the page
let palette = [] // RGB Color values of the palette (Array)
let c1, c2, c3, c4, c5; // LAB Color values of the palette

const mandelVoice = new Voice(); // Granular synth

function preload() { // Preloading necessary shaders

  mandelShader = loadShader('mandelbrot.vert', 'mandelbrot.frag');
  mandelAnalysis = loadShader('analysis.vert', 'analysis.frag');

}

function setup() {

  createCanvas(600, 600);
  noStroke();

  mandelbrot = createGraphics(500, 500, WEBGL); // Graphics buffer to calculate the shader (THIS HAS THE RESOLUTION OF THE RENDER)
  analysis = createGraphics(100, 100, WEBGL); // Graphics buffers to downsample and analyze the shader
  
  mandelbrot.pixelDensity(1);
  analysis.pixelDensity(1);

  incr = 1./(analysis.width*analysis.height);

  downsample = createGraphics(100, 100);

  downsample.pixelDensity(1);

  colorPalette = createGraphics(5, 1); // Graphics buffer to hold the color palette

  mandelPos = createVector(0., 0.); // Initial settings for the uniforms
  mandelScale = 4.
  mandelSpeed = 0.01;
  mandelAngle = 0;
  mandelDir = createVector(mandelSpeed * mandelScale);

  smoothPos = mandelPos.copy(); // Initial settings for the smoothing variables
  smoothScale = mandelScale;
  smoothAngle = 0.;

  colBalance = [];

  for(let i = 0; i < 5; i++) {
    p[i] = createP();
  }
  
  loadColors(colorPalette); // Loads palette with five random colors, also filling the c1-c5 variables.
  colorPalette.loadPixels();

  grainParams = initiateGrainParams();
}

function draw() {

  //frameRate(30);
  //noSmooth();
  //analysis.noSmooth();
  //colorPalette.noSmooth();

  checkSmoothing(); // Smooth the data
  checkAspectRatio(); // Fix aspect ratio
  checkInput(); // Adjust uniforms if certain keys are being pressed

  mandelbrot.shader(mandelShader); // Run the shaders and set the uniforms.
  mandelShader.setUniform("u_resolution", [mandelbrot.width, mandelbrot.height]);
  //mandelShader.setUniform("u_time", millis() / 1000.0);
  //mandelShader.setUniform("u_mouse", [mouseX, map(mouseY, 0, height, height, 0)]);
  mandelShader.setUniform("Area", [smoothPos.x, smoothPos.y, scaleX, scaleY]); 
  mandelShader.setUniform("Angle", smoothAngle); 
  mandelShader.setUniform("tex0", colorPalette); 

  mandelbrot.rect(0, 0, mandelbrot.width, mandelbrot.height); //Display the shader in the graphics buffer, and then display that on the main canvas.
  image(mandelbrot, 0, 0, width, height); 

  if(frameCount%10 === 0) {
  analysis.shader(mandelAnalysis);
  mandelAnalysis.setUniform("u_resolution", [analysis.width, analysis.height]);
  mandelAnalysis.setUniform("tex0", downsample); 
  mandelAnalysis.setUniform("Color1", c1);
  mandelAnalysis.setUniform("Color2", c2);
  mandelAnalysis.setUniform("Color3", c3);
  mandelAnalysis.setUniform("Color4", c4);
  mandelAnalysis.setUniform("Color5", c5);
  


  
  downsample.image(mandelbrot, 0, 0, downsample.width, downsample.height); //Load the shader in the analysis buffer, downsampling it,
  analysis.translate(-width/2, -height/2); // Fix WEBGL coordinates
  analysis.rect(0, 0, analysis.width, analysis.height);
  analysis.loadPixels();
  getColorBalance(analysis.pixels);

  }

  if(debugMode) {
    for(let i = 0; i < colorBalance.length; i++) { // Write color values on screen
 
        let amount = colorBalance[i];
        // amount /= (analysis.width * analysis.height) * 4;

        stroke(0);
        strokeWeight(10);
        fill(palette[floor(i/3)]);
        textSize(50);

        text(amount.toFixed(2), 50 + (floor(i/3) * (width/5)), height - 20 - ((i%3) * 50));
      
    }
  }


  if(frameCount%20 === 0) {
    generateGrains();
  }

  //image(analysis, 0, 0,  width, height); //Uncomment to show analysis buffer on the canvas
  //image(colorPalette, 0, 0, 100, 100);

  // analysis.loadPixels()// , and load the pixels array.

  // if(frameCount%30 === 0) {
  // p.html(mandelAnalyse(analysis.pixels));
  // }

  //console.log(analysis.pixels);
  

}



function checkSmoothing() {
  smoothPos = p5.Vector.lerp(smoothPos, mandelPos, 0.1);
  smoothScale = lerp(smoothScale, mandelScale, 0.1);
  smoothAngle = lerp(smoothAngle, mandelAngle, 0.1);
}

function checkAspectRatio() {
  aspectRatio = width/height;
  scaleX = smoothScale;
  scaleY = smoothScale;

  if (aspectRatio > 1.) {
    scaleY /= aspectRatio;
  } else {
    scaleX *= aspectRatio;
  }
};

function checkInput() {

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
  
  if(keyIsDown(87)) { // Q & R = rotate
    mandelScale *= 0.99;
  } else if(keyIsDown(83)) {
    mandelScale *= 1.01;
  }

  if(keyIsDown(81)) {
    mandelAngle -= 0.01;
  } else if(keyIsDown(69)) {
    mandelAngle += 0.01;
  }

}

function keyTyped() {

  if(keyCode === 32) { //Spacebar = Reset position
    resetPosition();
  }

  if(keyCode === 67) {
    loadColors(colorPalette);
  } 

  if(keyCode === 68) {
    debugMode = !debugMode;
  }

}

function loadColors(buf) {

  buf.strokeWeight(1);

  for(let i = 0; i < 5; i++) {

    randomCol = [random(255), random(255), random(255)]; // Generate random color and load it to the color variable
    palette[i] = randomCol;
    eval('c' + (i + 1)  + '= rgb2lab(randomCol)'); 
    
    buf.stroke(randomCol);
    buf.point([i], 0);

  }


} 


function getColorBalance(pix) {

  colorBalance = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


  for(let i = 0; i < pix.length; i += 4) {

    switch(pix[i]) { // Color match for pixels 0.1/0.2/.../0.5 -> 25/51/76/102/128
      case 0:
        break;
      case 25:
        getColorState(pix, i, 0, colorBalance);
        break;
      case 51:
        getColorState(pix, i, 3, colorBalance);
        break;
      case 76:
        getColorState(pix, i, 6, colorBalance);
        break;
      case 102:
        getColorState(pix, i, 9, colorBalance);
        break;
      case 128:
        getColorState(pix, i, 12, colorBalance);
        break;
      default:
        console.log('getColorBalance() color data is not recognised: ' + pix[i]);
    }
  }
}


function getColorState(arr, i, coli, colArr) {

  switch(arr[i+1]) {
    case 25:
      colArr[coli + 0] += incr;
      break;
    case 51:
      colArr[coli + 1] += incr;
      break;
    case 76:
      colArr[coli + 2] += incr;
      break;
    default:
      console.log('getColorState() state data is not recognised: ' + arr[i+1]);
  }

}


function resetPosition() {

  mandelPos = createVector(0., 0.);
  mandelScale = 4.;
  mandelAngle = 0.;

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

  // resizeCanvas(windowWidth, 500);

}


function generateGrains() {
  
  let xPos = mouseX/width;
  let yPos = 1. - (mouseY/height);

  let amount = random(5, 20);

  //makeGrain(colorBalance);

  for(let i = 0; i < amount; i++) {
    let delay = random(0, 1000);
    setTimeout(makeGrain, delay, colorBalance);
  }

}

function makeGrain(arr) { // This will look at the colorBalance array and create an appropriate grain according to the current chances
  
  let gChance = random(); 
  let acc = 0;
  let result = 0;

  for(let i = 0; i < arr.length; i++) { //Chances range from 0.-1, accumulating on top of each other. 

    acc += arr[i];
    if(gChance < acc) { // If gChance is smaller than the current chance (falling in the threshold, it will chance result to that type.
      result = i + 1; // 0 -> Nothing happens, 1 - 15 -> Appropriate color/status grain. 
      break;
    }

  }
 

  if(result > 0) {
    result--;
    console.log(result);
    mandelVoice.play(floor(result/3),random(), random(), grainParams[result].attack, grainParams[result].release, grainParams[result].spread, grainParams[result].pan);
  }


}


function initiateGrainParams() {

  let params = [
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    },
    
    {
      attack: 0.4,
      release: 0.4,
      spread: 0.2,
      pan: 0.1
    }
  
  ];

  return params;


}

function mousePressed() {
  userStartAudio(); 
}

// function makeGrain(x, y) {

//   ;

// }

// function mandelAnalyse(mPix) {

//   let colorBalance = [0, 0, 0, 0, 0];



//   for(let i = 0; i < mPix.length; i += 4) {
    
//     let deltaVals = [0., 0., 0., 0., 0.];
//     currentCol = [mPix[i], mPix[i+1], mPix[i+2]];

//     if(currentCol[0] + currentCol[1] + currentCol[2] >= 10) {

//     for(let j = 0; j < 5; j++) {
      
//       eval('deltaVals[' + j + '] =' + 'colorDistance(currentCol,' + 'c' + (j + 1) + ');');

//     }

//     let highestIndex = indexOfMax(deltaVals);

//     colorBalance[highestIndex]++;
    
//     }

//   }


//   return colorBalance;

// }



// function colorDistance(col1, col2) {
  
//   let rmean = (col1[0] + col2[0]) / 2.;

//   let r = col1[0] - col2[0];
//   let g = col1[1] - col2[1];
//   let b = col1[2] - col2[2];

//   return sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));

// }


// function indexOfMax(arr) {
//   if (arr.length === 0) {
//       return -1;
//   }

//   var max = arr[0];
//   var maxIndex = 0;

//   for (var i = 1; i < arr.length; i++) {
//       if (arr[i] > max) {
//           maxIndex = i;
//           max = arr[i];
//       }
//   }

//   return maxIndex;
// }








// OLD ANALYSIS FUNCTION
// function mandelAnalyse(mPix) {

//   let acc = 0;

//   for(let i = 0; i < mPix.length; i += 4) {
//     if(mPix[i] > 100) {
//       acc++
//     }
//   }

//   return acc;

// }