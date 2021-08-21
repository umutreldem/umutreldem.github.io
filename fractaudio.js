window.AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext(); // Initiate the Audio Context & Suspend in order to start it with a user gesture
context.suspend();



const bufferBank = Array(5); // Main buffers & convolution buffer
let convBuffer; 

const tuna = new Tuna(context);

const master = context.createGain(); // Master gain node, connected to the destination
master.connect(context.destination); 

const filter = context.createBiquadFilter({type: 'lowpass'});
filter.connect(master);

const convolver = context.createConvolver(); // Convolver node
convolver.connect(filter);

const delay = new tuna.Delay(); // Delay node
delay.connect(convolver);

const phaserBank = Array(5);
for(let i = 0; i < phaserBank.length; i++) {
    phaserBank[i] = new tuna.Phaser();
    phaserBank[i].connect(delay);
}


// Global variables
let w, h;
let data;
let drawingdata = [];
let voices = [];
let voicesmono = [];
let isloaded = false;
let X = 0;
let Y = 0;
let mouseState = false;
let helpvisible = true;

// Initial settings
let attack = 0.40;
let release = 0.40;
let density = 0.85;
let spread = 0.2;
let reverb = 0.5;
let pan = 0.1;
let trans = 1;
let xOff = 0.2;
let yOff = 0.2;

function initiateAudio() {
    context.resume();
}


// Grain class
function Grain(buffer, positionx, positiony, params, bufferInd) {

    var that = this; // Scope issues
    this.now = context.currentTime; // Update the time value

    // Creating the source
    this.source = context.createBufferSource();

    // Setting playback rate
    this.speed = params.speed;
    this.speedOff = random(-params.speedRandOff, params.speedRandOff);
    this.speed += this.speedOff

    this.source.playbackRate.value = params.speed;
    this.source.buffer = buffer;


    // Gain for enveloping
    this.gain = context.createGain();

    //Basic panner
    let yes = Math.ceil((Math.random() * 3.));

    if(yes === 1) {
        this.panner = context.createPanner();
        this.panner.panningModel = "equalpower";
        this.panner.distanceModel = "linear";
        this.panner.positionX = random(-params.pan, params.pan); // Random between -pan to pan

        // Connections
        this.source.connect(this.panner);
        this.panner.connect(this.gain);
    } else {
        this.source.connect(this.gain);
    }

    this.gain.connect(phaserBank[bufferInd]);

    // Position and offset calculation
    this.positionx = positionx;
    this.positionx  // += (Math.random()* (xOff * 2)) - xOff;
    this.offset = this.positionx * (buffer.duration)
    //console.log(this.offset)

    // Amplitude calculate and update
    this.positiony = positiony;
    this.amp = this.positiony;

    //Envelope parameters
    this.attack = params.attack;
    this.attack += random(-params.attackRandOff, params.attackRandOff);
    //console.log(this.attack);

    this.release = params.release;
    this.attack += random(-params.releaseRandOff, params.releaseRandOff);

    if(this.release < 0) {
        this.release = 0.1;
    }
    this.spread = params.spread;

    this.randomoffset = (Math.random() * this.spread) - (this.spread/2);

    //Setting the envelope
    this.source.start(this.now, Math.abs(this.offset + this.randomoffset), this.attack + this.release);
    this.gain.gain.setValueAtTime(0.0, this.now);
    this.gain.gain.linearRampToValueAtTime(this.amp, this.now + this.attack);
    this.gain.gain.linearRampToValueAtTime(0.0, this.now + (this.attack + this.release));

    //Garbage collection
    this.source.stop(this.now + this.attack + this.release + 0.1);
    let tms = (this.attack + this.release) * 1000; // Time in ms
    setTimeout(function() {
        that.gain.disconnect();
        if(yes === 1) {
            that.panner.disconnect();
        }
    }, tms + 200);
}





//Voice class for playback
function Voice() {
    
    this.grains = [];
    this.graincount = 0;
    var that = this; // For scope issues

    this.play = function(bufferInd, mouseX, mouseY, params) {

        let gBuffer = bufferBank[bufferInd];

        //New grain
        this.g = new Grain(gBuffer, mouseX, mouseY, params, bufferInd);
        //Pushed to grain array
        that.grains[that.graincount] = this.g;
        that.graincount++;

        if(that.graincount > 20) {
            that.graincount = 0;
        }
    }
}










// Loading the audio files into buffers
const request1 = new XMLHttpRequest();
request1.open('GET', 'audio/scriabin.mp3', true);
request1.responseType = 'arraybuffer';
request1.onload = function() {
    context.decodeAudioData(request1.response, function(b){
        bufferBank[0] = b;
        data = bufferBank[0].getChannelData(0);
        isloaded = true;
        console.log('Loaded audio file!');
    }, function() {
        console.log('Loading sound file failed');
    })
}
request1.send();

const request2 = new XMLHttpRequest();
request2.open('GET', 'audio/vs_flute_q2.wav', true);
request2.responseType = 'arraybuffer';
request2.onload = function() {
    context.decodeAudioData(request2.response, function(b){
        bufferBank[1] = b;
        data = bufferBank[1].getChannelData(0);
        isloaded = true;
        console.log('Loaded audio file!');
    }, function() {
        console.log('Loading sound file failed');
    })
}
request2.send();

const request3 = new XMLHttpRequest();
request3.open('GET', 'audio/bell1.wav', true);
request3.responseType = 'arraybuffer';
request3.onload = function() {
    context.decodeAudioData(request3.response, function(b){
        bufferBank[2] = b;
        data = bufferBank[2].getChannelData(0);
        isloaded = true;
        console.log('Loaded audio file!');
    }, function() {
        console.log('Loading sound file failed');
    })
}
request3.send();

const request4 = new XMLHttpRequest();
request4.open('GET', 'audio/chime1.wav', true);
request4.responseType = 'arraybuffer';
request4.onload = function() {
    context.decodeAudioData(request4.response, function(b){
        bufferBank[3] = b;
        data = bufferBank[3].getChannelData(0);
        isloaded = true;
        console.log('Loaded audio file!');
    }, function() {
        console.log('Loading sound file failed');
    })
}
request4.send();

const request5 = new XMLHttpRequest();
request5.open('GET', 'audio/tone2.wav', true);
request5.responseType = 'arraybuffer';
request5.onload = function() {
    context.decodeAudioData(request5.response, function(b){
        bufferBank[4] = b;
        data = bufferBank[4].getChannelData(0);
        isloaded = true;
        console.log('Loaded audio file!');
    }, function() {
        console.log('Loading sound file failed');
    })
}
request5.send();

// Loading the impulse response to the convolver
const convRequest = new XMLHttpRequest();
convRequest.open('GET', 'audio/HS.wav', true);
convRequest.responseType = 'arraybuffer';
convRequest.onload = function() {
    let audioData = convRequest.response;
    context.decodeAudioData(audioData, function(b) {
        convolver.buffer = b;
        console.log('Loaded convolver file!');
    }, function(e){console.log("Error with decoding audio data" + e.err)});
}
convRequest.send();