// Constants
const NOTES_WHITES = [
    [130.813, 'C3', 81],
    [146.832, 'D3', 87],
    [164.814, 'E3', 69],
    [174.614, 'F3', 82],
    [195.998, 'G3', 84],
    [220, 'A4', 89],
    [246.942, 'B4', 85],
    [261.626, 'C4', 73],
    [293.665, 'D4', 79],
    [329.628, 'E4', 80],
    [349.228, 'F4', 219],
    [391.995, 'G4', 221],
    [440, 'A5', 90],
    [493.88, 'B5', 88],
    [523.25, 'C5', 67],
    [587.33, 'D5', 86],
    [659.25, 'E5', 66],
    [698.46, 'F5', 78],
    [783.99, 'G5', 77],
    [880.00, 'A6', 188],
    [987.77, 'B6', 190]
];

const NOTES_BLACKS = [
    [138.591, 'C#3', 50],
    [155.563, 'D#3', 51],
    [0, '-', -1],
    [184.997, 'F#3', 53],
    [207.652, 'G#3', 54],
    [233.082, 'A#4', 55],
    [0, '-', -1],
    [277.183, 'C#4', 57],
    [311.127, 'D#4', 48],
    [0, '-', -1],
    [369.994, 'F#4', 61],
    [415.305, 'G#4', 65],
    [466.16, 'A#5', 83],
    [0, '-', -1],
    [554.37, 'C#5', 70],
    [622.25, 'D#5', 71],
    [0, '-', -1],
    [739.99, 'F#5', 74],
    [830.61, 'G#5', 75],
    [932.33, 'A#6', 76]
];

// Single sound
class OneSound {
    constructor(context, frequency, analyser, streamNode) {
        this.context = context;
        this.osc = this.context.createOscillator();
        this.pressed = false;
        this.streamNode = streamNode;
        this.analyser = analyser;

        this.osc.frequency.value = frequency;
        this.osc.type = 'triangle';
        this.osc.start(0);
    }

    play() {
        if(!this.pressed) {
            this.pressed = true;
            this.osc.connect(this.context.destination);
            this.osc.connect(this.streamNode);
            this.osc.connect(this.analyser);
        }
    }

    stop() {
        this.pressed = false;
        this.osc.disconnect();
    }
}

// Piano
class Piano {
    constructor(context, streamNode) {
        this.context = context;
        this.streamNode = streamNode;
        this.soundsWhite = [];
        this.soundsBlack = [];

        const analyserElement = document.getElementById('analyser');
        for (let i = 0; i < 128 ; i++) {
            const li = document.createElement("i");
            analyserElement.appendChild(li);
        }

        this.createAnalyser();
    }

    createAnalyser() {
        this.analyser = this.context.createAnalyser();

        this.analyser.fftSize = 1024;
        const bufferLength = this.analyser.frequencyBinCount,
            frequencyData = new Uint8Array(512);

        const allEls = document.querySelectorAll('i');
        const analyser = this.analyser;

        function animate() {
            analyser.getByteFrequencyData(frequencyData);

            for (let i = 0; i < allEls.length; i++) {
                allEls[i].style.backgroundColor = `hsla(${i*10}, 80%, 50%, 0.6)`;
                frequencyData[i] === 0 ? allEls[i].style.height = `2%` : allEls[i].style.height = `${frequencyData[i] * 100 / 255}%`;
            }

            requestAnimationFrame(animate);
        }

        animate();
    }

    turnOn() {
        const whites = document.querySelectorAll('.white');
        const blacks = document.querySelectorAll('.black');

        whites.forEach((white, index) => {
            NOTES_WHITES[index].push(white);
            const frq = NOTES_WHITES[index][0];
            const sound = new OneSound(this.context, frq, this.analyser, this.streamNode);
            this.soundsWhite.push(sound);
        });

        blacks.forEach((black, index) => {
            NOTES_BLACKS[index].push(black);
            const frq = NOTES_BLACKS[index][0];
            const sound = new OneSound(this.context, frq, this.analyser, this.streamNode);
            this.soundsBlack.push(sound);
        });

        window.addEventListener("keydown", (e) => this.playSound(e));
        window.addEventListener("keyup", (e) => this.stopSound(e));

    }

    playSound(e) {
        const keyCode = e.keyCode || e.target.getAttribute('data-key');
        const noteToPlay = NOTES_WHITES.findIndex(note => note[2] === keyCode);
        const noteToPlayBlack = NOTES_BLACKS.findIndex(note => note[2] === keyCode);
        if (noteToPlay > -1) {
            const element = NOTES_WHITES[noteToPlay];
            element[3].className = 'white playing';
            this.soundsWhite[noteToPlay].play();
        }
        if (noteToPlayBlack > -1) {
            const element = NOTES_BLACKS[noteToPlayBlack];
            element[3].className = 'black playing';
            this.soundsBlack[noteToPlayBlack].play();
        }
    }

    stopSound(e) {
        const keyCode = e.keyCode || e.target.getAttribute('data-key');
        const noteToPlay = NOTES_WHITES.findIndex(note => note[2] === keyCode);
        const noteToPlayBlack = NOTES_BLACKS.findIndex(note => note[2] === keyCode);
        if (noteToPlay > -1) {
            const element = NOTES_WHITES[noteToPlay];
            element[3].className = 'white';
            this.soundsWhite[noteToPlay].stop();
        }
        if (noteToPlayBlack > -1) {
            const element = NOTES_BLACKS[noteToPlayBlack];
            element[3].className = 'black';
            this.soundsBlack[noteToPlayBlack].stop();
        }
    }

    stopAll() {
        this.soundsWhite.forEach((sound, index) => {
            const element = NOTES_WHITES[index];
            if (element[3]) {
                element[3].className = 'white';
            }
            sound.stop();
        });
        this.soundsBlack.forEach((sound, index) => {
            const element = NOTES_BLACKS[index];
            if (element[3]) {
                element[3].className = 'black';
            }
            sound.stop();
        });
    }

}

class Recorder {
    constructor(streamNode) {
        const chunks = [];
        this.recorder = new MediaRecorder(streamNode.stream);

        this.recorder.ondataavailable = e => {
            chunks.push(e.data);
        };

        this.recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            createAudioElement(URL.createObjectURL(blob));
        };
    }

    start() {
        this.recorder.start();
    }

    stop() {
        this.recorder.stop();
    }
}

function createEnviroment(context, streamNode) {
    const piano = new Piano(context, streamNode);
    piano.turnOn();
    return piano;
}

function addRecorderEvents(streamNode) {
    const start = document.querySelector('.start-recording');
    const stop = document.querySelector('.stop-recording');

    const recorders = [];

    start.addEventListener('click', () => {
        const recorder = new Recorder(streamNode);
        const index = recorders.push(recorder);
        recorder.start();
        start.className = 'button green start-recording disabled';
        stop.className = 'button red stop-recording';
        stop.setAttribute('recorder', (index - 1).toString());
    });

    stop.addEventListener('click', (e) => {
        recorders[e.target.getAttribute('recorder')].stop();
        start.className = 'button green start-recording';
        stop.className = 'button red stop-recording disabled';
    });
}

function addFocusEvents(piano) {
    let hidden = "hidden";

    // Standards:
    if (hidden in document)
        document.addEventListener("visibilitychange", onchange);
    else if ((hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", onchange);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", onchange);
    else if ((hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", onchange);
    // IE 9 and lower:
    else if ("onfocusin" in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide
            = window.onfocus = window.onblur = onchange;

    function onchange (evt) {
        if (this[hidden]) {
            piano.stopAll();
        }
    }
}

function createAudioElement(blobUrl) {
    const player = document.querySelector('.player');
    player.innerHTML = '';
    const download = document.createElement('a');
    download.innerHTML = 'download music';
    download.download = 'audio.webm';
    download.className = 'download-link button';
    download.href = blobUrl;
    const audioEl = document.createElement('audio');
    audioEl.controls = true;
    const sourceEl = document.createElement('source');
    sourceEl.src = blobUrl;
    sourceEl.type = 'audio/webm';
    audioEl.appendChild(sourceEl);
    player.appendChild(audioEl);
    player.appendChild(download);
}

window.onload = function() {
    const playButton = document.querySelector('.play-button');
    const hover = document.querySelector('.hover');

    playButton.addEventListener('click', () => {
        let context;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            context = new AudioContext();
        } catch (e) {
            alert('Web Audio API is not supported in this browser');
        }

        if (context) {
            playButton.style.display = 'none';
            hover.style.display = 'none';
            const streamNode = context.createMediaStreamDestination();
            const piano = createEnviroment(context, streamNode);
            addFocusEvents(piano);
            addRecorderEvents(streamNode);
        }
    });

};
