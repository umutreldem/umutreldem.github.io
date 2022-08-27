class VisualEngine {

    constructor() {
    }

    drawHands() {
        stroke(0, 90);
        strokeWeight(10);

        for(let i = 0; i < detectionHand.multiHandLandmarks.length; i++) {
            for(let j = 0; j < detectionHand.multiHandLandmarks[i].length; j++) {
                let handPoint = detectionHand.multiHandLandmarks[i][j];

                point(handPoint.x * width, handPoint.y * height, handPoint.z + 0.1);
            }
        }
    }

    drawLines() {
        stroke(0, 200, 150, 200);
        strokeWeight(3);

        for(let l = 0; l < arguments.length; l++) {

            let index = arguments[l];

            for(let i = 0; i < detectionHand.multiHandLandmarks.length; i++) {
                for(let j = 0; j < index.length-1; j++) {
                  let thisIndex = detectionHand.multiHandLandmarks[i][index[j]];
                  let nextIndex = detectionHand.multiHandLandmarks[i][index[j + 1]];
                  line(thisIndex.x * width, thisIndex.y * height, thisIndex.z, nextIndex.x * width, nextIndex.y * height, nextIndex.z);
                }
            }
        }
    }

    drawFace() {
        stroke(0, 200, 150, 100);
        strokeWeight(2);
      
        for(let i = 0; i < detectionFace.multiFaceLandmarks.length; i++) {
          for(let j = 0; j < detectionFace.multiFaceLandmarks[i].length; j++) {
            let facePoint = detectionFace.multiFaceLandmarks[i][j];
      
            point(facePoint.x * width, facePoint.y * height, facePoint.z);
          }
        }
    }
}





class StageOne extends VisualEngine {

    constructor(se) { //SoundEngine object
        super();

        this.soundEngine = se;
    }

    start() {
        if(this.soundEngine.jukebox['intro'].player.state !== 'started') {
            this.soundEngine.jukebox['intro'].player.start();
        }
    }

    show() {
                             //intro.clear();
        // shader(myShader);
        // intro.image(introImage, 0, -100, width + 100, height + 100);
        //                  //image(introImage, -width/2, -height/2, width + 100, height);
        
        // myShader.setUniform('frequency', 0.5);
        // myShader.setUniform('amplitude', 0.1);
        // myShader.setUniform('time', frameCount * 0.005);
        // myShader.setUniform('tex', intro);

        // rect( -width/2, -height/2, width, height);

        image(introImage, -width/2, -height/2, width, height);
    }

    end() {
        if(this.soundEngine.jukebox['intro'].player.state === 'started') {
            this.soundEngine.jukebox['intro'].player.stop();
        }
    }

}





class StageTwo extends VisualEngine {
    
    constructor(se, ia, sc) { //SoundEngine object, image to use

        super();

        this.startFlag = false;

        this.d = pixelDensity();

        this.curFinger;
        this.prevFinger;
        this.speed = 0.8;

        this.soundEngine = se;
        
        this.images = ia;
        this.imageIndex = 0;

        this.currImage = this.images[this.imageIndex];

        this.soundEngine.scrapePlayers[this.imageIndex].toDestination();

        this.screen = sc;
    }

    show() {
        clear();

        push();
        scale(-1, 1); // Mirror the visualisation to match the mirrored webcam capture
        translate(-width/2, -height/2); // [0, 0] is top left
        
        this.processDetection();
    }

    clicked(x, y) {
        if(x >= 0.81 && x <= 1. && y >= 0.7 && y <= 1.) {
            this.changeImage();
        }
    }

    changeImage() {

        this.soundEngine.scrapePlayers[this.imageIndex].disconnect();

        this.imageIndex++;

        if(this.imageIndex >= 4) {
            this.endStage();
            return false;   
        } 
 
        this.currImage = this.images[this.imageIndex];

        this.soundEngine.scrapePlayers[this.imageIndex].toDestination();



        return false;   
    }



    endStage() {
        //this.soundEngine.audioToggle(false, this.imageIndex);
        changeStage();
        //currentStage = 3;
    }

    processDetection() {

    
        if(detectionHand != undefined && detectionHand.multiHandLandmarks.length > 0) {
            
            this.drawLines([0, 5, 9, 13, 17, 0], [0, 1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]);; // Visualise hands
            this.drawHands();

            let indexFinger = detectionHand.multiHandLandmarks[0][8];
      
            this.curFinger = createVector(indexFinger.x, indexFinger.y);
      
            //let fingerSpeed = p5.Vector.sub(this.curFinger, this.prevFinger);
            
      
            //this.speed = lerp(this.speed, map(this.fingerSpeed.magSq(), 0., 0.01, 0.9, 1.1, true), 0.1);
            //console.log(speed);
            
            //soundEngine.playbackRate = speed;
      
            this.prevFinger = this.curFinger;
      
            if(this.startFlag) {
            this.spotlight(parseInt(indexFinger.x * this.currImage.width), parseInt(indexFinger.y * this.currImage.height));
            }
            //console.log(parseInt(indexFinger.x * myImage.width));
        } else {
            this.soundEngine.audioToggle(false, this.imageIndex);
        }

        // if(detectionFace != undefined && detectionFace.multiFaceLandmarks.length > 0) {
      
        //     this.drawFace(); //Visualise face
    
        // }

        pop();


        push();
        scale(-1, 1);
        image(this.screen, width/2, -height/2, -width, height); // Draw image
        pop();

        
        if(!this.startFlag) {
            image(stage2intro, -width/2, -height/2, width, height);
        } else {
            image(this.currImage, width/2, -height/2, -width, height); // Draw image
        }

    }

    

    spotlight(x, y) {
        let imageDetected = this.checkForPixels(x, y);

        this.soundEngine.audioToggle(imageDetected, this.imageIndex);
    }

    checkForPixels(x, y) {
        for(let v = -25; v < 25; v++) {
            for(let h = -25; h < 25; h++) {
                
                for(let i = 0; i < this.d; i++) {
                    for(let j = 0; j < this.d; j++) {
                        //loop over
                        let index = 4 * (((y + v) * this.d + j) * this.currImage.width * this.d + ((x + h) * this.d + i));

                        let a = this.currImage.pixels[index + 3];
                        let handPoint = detectionHand.multiHandLandmarks[0][8];

                        if(a > 0) {
                            //console.log("found non-alpha!: " + r);
                            stroke(255, 0, 0);
                            point(handPoint.x * width, handPoint.y * height, handPoint.z + 0.1);
                    
                            return true;
                        } 
                    }
                }
            }
        }
        return false;
    }
}





class StageThree extends VisualEngine {

    constructor(se , is) { //SoundEngine object
        super();

        this.soundEngine = se;

        this.fingers = new Array(2); // 2D Array for the curve of 5 fingers of each hand, with degrees in this project.
        for(let i = 0; i < 2; i++) {
            this.fingers[i] = new Array(5);
            for(let j = 0; j < 5; j++) {
                this.fingers[i][j] = {
                    curve: 0,
                    trigger: false,
                    id: (i * 5) + j // 0 - 9 for all fingers, left to right
                };
            }
        }

        this.mouthOpen = false;

        this.nosePoint = new Array(2);
        this.nosePoint[1] = createVector(0.5, 0.5); //Initiate the previous nose vector as middle of screen

        this.threshold = 30;

        this.introScreen = is;
        this.introFlag = true;
    }

    show() {

        if(this.introFlag) {
            
            clear();
            push();
            scale(-1, 1);
            image(this.introScreen, width/2, -height/2, -width, height); // Draw image
            pop();

        } else {

            clear();

            push();
            scale(-1, 1); // Mirror the visualisation to match the mirrored webcam capture
            translate(-width/2, -height/2); // [0, 0] is top left

            
            if(detectionHand != undefined && detectionHand.multiHandLandmarks.length > 0) {
                


                if(Object.values(this.soundEngine.jukebox).some(element => element.player.state === 'started')) { // If at least one thing from the jukebox is currently playing
                    this.drawLines([0, 5, 9, 13, 17, 0], [0, 1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]);; // Visualise hands
                    this.drawHands();
                }

                this.checkFinger(detectionHand.multiHandLandmarks); // Check finger to see if any are curled

            }


            if(detectionFace != undefined && detectionFace.multiFaceLandmarks.length > 0) {

                //console.log(nosePoint);

                if(Object.values(this.soundEngine.jukebox).some(element => element.player.state === 'started')) { // If at least one thing from the jukebox is currently playing
                    this.drawFace(); //Visualise face
                }
                this.checkFace(detectionFace.multiFaceLandmarks); // Check face for open mouth, closed eyes, and nose movement
            
            }

        }

    }

    checkFinger(fingArr) {
        for(let f = 0; f < 2; f++) {
            for(let i = 0; i < 5; i++) {
                let fingerIndex = 4 * (i + 1); // 4, 8, 12, 16, 20

                if(fingArr[f] != undefined) {
                    //this.fingers[f][i] = detectionHand.multiHandLandmarks[f][fingerIndex] - detectionHand.multiHandLandmarks[f][fingerIndex-1]; //

                    let tip = createVector(fingArr[f][fingerIndex].x, fingArr[f][fingerIndex].y);
                    let middle = createVector(fingArr[f][fingerIndex-2].x, fingArr[f][fingerIndex-1].y);
                    let bottom = createVector(fingArr[f][fingerIndex-3].x, fingArr[f][fingerIndex-2].y);

                    let middle_tip = p5.Vector.sub(tip, middle);
                    let bottom_middle = p5.Vector.sub(middle, bottom);

                    let fingerCurl = middle_tip.angleBetween(bottom_middle);

                    this.fingers[f][i].curve = Math.abs(fingerCurl);
                    //console.log(this.fingers[f][i].curve);
                    this.checkTrigger(this.fingers[f][i], this.threshold, tip);
                } else {
                    //console.log("no hand!");
                }
            }
        }
    }

    checkTrigger(fing, thresh, tip) {
        if(fing.curve >= thresh && !fing.trigger) {
            
                fing.trigger = true;

                let fingPan = map(tip.x, 0., 1., 0.9, -0.9, true); //Map finger tip position (0: right, 1: left) to panning (-1:left, 1: right);

                let fPlayer =  soundEngine.jukebox[fing.id.toString()];
                if(fPlayer.player.state == 'stopped') {
                    fPlayer.panVol.set({pan: fingPan});
                    fPlayer.player.start();
                }
    
        } else if(fing.curve < thresh && fing.trigger) {
           
                fing.trigger = false;
        }
    }

    checkFace(faceArr) {

        //Check if mouth is open: If mouth is larger than the smallest lip (times ratio), it's open.
        let upperLip_top = createVector(faceArr[0][0].x, faceArr[0][0].y);
        let upperLip_bottom = createVector(faceArr[0][13].x, faceArr[0][13].y);

        let mouth_top = createVector(faceArr[0][13].x, faceArr[0][13].y);
        let mouth_bottom = createVector(faceArr[0][14].x, faceArr[0][14].y);

        let lowerLip_top = createVector(faceArr[0][14].x, faceArr[0][14].y);
        let lowerLip_bottom = createVector(faceArr[0][17].x, faceArr[0][17].y);

        let upperLip_size = p5.Vector.sub(upperLip_top, upperLip_bottom).mag();
        let mouth_size = p5.Vector.sub(mouth_top, mouth_bottom).mag();
        let lowerLip_size = p5.Vector.sub(lowerLip_top, lowerLip_bottom).mag();

        let ratio = 1.;

        let result = mouth_size > min(upperLip_size, lowerLip_size) * ratio;

        if(result && soundEngine.jukebox['10'].player.state == 'stopped') {
            soundEngine.jukebox['10'].player.start();
        }

        
        let leftEye_upperTop = createVector(faceArr[0][27].x, faceArr[0][27].y);
        let leftEye_upperBottom = createVector(faceArr[0][159].x, faceArr[0][159].y);

        let leftEye_top = createVector(faceArr[0][159].x, faceArr[0][159].y);
        let leftEye_bottom = createVector(faceArr[0][145].x, faceArr[0][145].y);

        let leftEye_lowerTop = createVector(faceArr[0][145].x, faceArr[0][145].y);
        let leftEye_lowerBottom = createVector(faceArr[0][23].x, faceArr[0][23].y);

        let leftEye_upperSize = p5.Vector.sub(leftEye_upperTop, leftEye_upperBottom).mag();
        let leftEye_size = p5.Vector.sub(leftEye_top, leftEye_bottom).mag();
        let leftEye_lowerSize = p5.Vector.sub(leftEye_lowerTop, leftEye_lowerBottom).mag();

        let leftEyeRatio = 0.7;
        let leftEyeResult = leftEye_size * leftEyeRatio < min(leftEye_upperSize, leftEye_lowerSize);

        //console.log(leftEye_size, leftEye_upperSize, leftEye_lowerSize, eyeResult);

        if(leftEyeResult && soundEngine.jukebox['leftEye'].player.state == 'stopped') {
            soundEngine.jukebox['leftEye'].panVol.set({pan: 0.75});
            soundEngine.jukebox['leftEye'].player.start();
        }

        let rightEye_upperTop = createVector(faceArr[0][257].x, faceArr[0][257].y);
        let rightEye_upperBottom = createVector(faceArr[0][386].x, faceArr[0][386].y);

        let rightEye_top = createVector(faceArr[0][386].x, faceArr[0][386].y);
        let rightEye_bottom = createVector(faceArr[0][374].x, faceArr[0][374].y);

        let rightEye_lowerTop = createVector(faceArr[0][374].x, faceArr[0][374].y);
        let rightEye_lowerBottom = createVector(faceArr[0][253].x, faceArr[0][253].y);

        let rightEye_upperSize = p5.Vector.sub(rightEye_upperTop, rightEye_upperBottom).mag();
        let rightEye_size = p5.Vector.sub(rightEye_top, rightEye_bottom).mag();
        let rightEye_lowerSize = p5.Vector.sub(rightEye_lowerTop, rightEye_lowerBottom).mag();

        let rightEyeRatio = 0.7;
        let rightEyeResult = rightEye_size * rightEyeRatio < min(rightEye_upperSize, rightEye_lowerSize);

        //console.log(leftEye_size, leftEye_upperSize, leftEye_lowerSize, eyeResult);

        if(rightEyeResult && soundEngine.jukebox['rightEye'].player.state == 'stopped') {
            soundEngine.jukebox['rightEye'].panVol.set({pan: -0.75});
            soundEngine.jukebox['rightEye'].player.start();
        }

              
        let nosey = detectionFace.multiFaceLandmarks[0][0];
        this.nosePoint[0] = createVector(nosey.x, nosey.y);

        let noseDelta = p5.Vector.sub(this.nosePoint[0], this.nosePoint[1]); // Nose movement
        let nosePan = map(this.nosePoint[0].x, 0., 1., 0.9, -0.9, true);

        if(soundEngine.jukebox['headLeft'].player.state == 'stopped' && soundEngine.jukebox['headRight'].player.state == 'stopped') {

            if(noseDelta.x > 0.05) { // Detection threshold for nose movement in both directions
                soundEngine.jukebox['headLeft'].panVol.set({pan: nosePan});
                soundEngine.jukebox['headLeft'].player.start();
            } else if(noseDelta.x < -0.05) {
                soundEngine.jukebox['headRight'].panVol.set({pan: nosePan});
                soundEngine.jukebox['headRight'].player.start();
            }

        }
        this.nosePoint[1] = this.nosePoint[0].copy();

    }
}