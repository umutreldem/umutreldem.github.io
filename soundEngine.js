class SoundEngine {
    
    constructor() {

        this.audioLoad = new Array(20);

        for(let i = 0; i < 20; i++) {
            this.audioLoad[i] = false;
        }

        this.scrapePlayers = new Array(4);

        for(let i = 0 ; i < 4; i++) {

            

            this.scrapePlayers[i] = new Tone.Player({
                url: 'audio/scrape/scrape' + i + '.mp3',
                onload: () => {
                    let id = i + 16;
                    this.audioLoad[id] = true;
                },

                loop: true,
                fadeIn: 2.5, 
                fadeOut: 1.5
            });
            //this.scrapePlayers[i].toDestination();
            this.scrapePlayers[i].sync().start(0);
        }


        let baseURL = 'audio/';
        let fingerURL = 'fingers/';
        let eyeURL = 'eyes/';
        let headURL = 'head/';


        this.jukebox = {
            'intro': {'player': new Tone.Player(baseURL + 'intro/introduction.mp3', () => {this.audioLoad[0] = true;})},
            '0': {'player': new Tone.Player(baseURL + fingerURL + '0.mp3', () => {this.audioLoad[1] = true;})},
            '1': {'player':new Tone.Player(baseURL + fingerURL + '1.mp3', () => {this.audioLoad[2] = true;})},
            '2': {'player':new Tone.Player(baseURL + fingerURL + '2.mp3', () => {this.audioLoad[3] = true;})},
            '3': {'player':new Tone.Player(baseURL + fingerURL + '3.mp3', () => {this.audioLoad[4] = true;})},
            '4': {'player':new Tone.Player(baseURL + fingerURL + '4.mp3', () => {this.audioLoad[5] = true;})},
            '5': {'player':new Tone.Player(baseURL + fingerURL + '5.mp3', () => {this.audioLoad[6] = true;})},
            '6': {'player':new Tone.Player(baseURL + fingerURL + '6.mp3', () => {this.audioLoad[7] = true;})},
            '7': {'player':new Tone.Player(baseURL + fingerURL + '7.mp3', () => {this.audioLoad[8] = true;})},
            '8': {'player':new Tone.Player(baseURL + fingerURL + '8.mp3', () => {this.audioLoad[9] = true;})},
            '9': {'player':new Tone.Player(baseURL + fingerURL + '9.mp3', () => {this.audioLoad[10] = true;})},
            '10': {'player':new Tone.Player(baseURL + fingerURL +'10.mp3', () => {this.audioLoad[11] = true;})},
            'leftEye': {'player':new Tone.Player(baseURL + eyeURL + '01.mp3', () => {this.audioLoad[12] = true;})},
            'rightEye': {'player':new Tone.Player(baseURL + eyeURL + '02.mp3', () => {this.audioLoad[13] = true;})},
            'headLeft': {'player':new Tone.Player(baseURL + headURL + '01.mp3', () => {this.audioLoad[14] = true;})},
            'headRight': {'player':new Tone.Player(baseURL + headURL + '02.mp3', () => {this.audioLoad[15] = true;})}
        }

        



        for(const val in this.jukebox) {
            this.jukebox[val].panVol = new Tone.PanVol(0, 0);
            this.jukebox[val].player.chain(this.jukebox[val].panVol, Tone.Destination);
        }



        // this.jukebox = new Tone.Players({
        //     '0': baseURL + fingerURL + '0.wav',
        //     '1': baseURL + fingerURL + '1.wav',
        //     '2': baseURL + fingerURL + '2.wav',
        //     '3': baseURL + fingerURL + '3.wav',
        //     '4': baseURL + fingerURL + '4.wav',
        //     '5': baseURL + fingerURL + '5.wav',
        //     '6': baseURL + fingerURL + '6.wav',
        //     '7': baseURL + fingerURL + '7.wav',
        //     '8': baseURL + fingerURL + '8.wav',
        //     '9': baseURL + fingerURL + '9.wav',
        //     '10': baseURL + fingerURL +'10.wav',
        //     'leftEye': baseURL + eyeURL + '01.wav',
        //     'rightEye': baseURL + eyeURL + '02.wav',
        //     'headLeft': baseURL + headURL + '01.wav',
        //     'headRight': baseURL + headURL + '02.wav'
        // });
        // this.jukebox.toDestination();

    }

    setPlaybackRate(v) {
        this.player.playbackRate = v;
    }

    audioToggle(s, i) {
        if(s) {
            if(this.scrapePlayers[i].state == 'stopped') Tone.Transport.start();
        } else if(this.scrapePlayers[i].state == 'started') { 
            Tone.Transport.pause();
        }
    }
}