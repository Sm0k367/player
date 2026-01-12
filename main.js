// --- AI MASTERY // NO-EXTERNAL-DEPENDENCY AUDIO ENGINE ---

const members = [
    "ALISHER FARHADI", "ROSS COHEN", "EPIC TECH", "ADAM NORMANDIN", 
    "LUDOVIC", "CHUCK BAGGETT", "MIMI BROWN", "MATTHEW LEIGH", "CHRIS CONLEY"
];

// SHORT BASE64 AUDIO DATA (KICK & SCRATCH)
// These are short, efficient pulses to ensure the file stays performant
const KICK_B64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/w=="; // Placeholder: Real logic will synthesize a punchy kick below

let audioCtx, masterGain, analyzer;
let isPlaying = false;
let progress = 0;
let scratchIntensity = 0;

// 1. THREE.JS SETUP
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000508, 0.008);
const camera = new THREE.PerspectiveCamera(65, window.innerWidth/window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const vuContainer = document.getElementById('vumeter');
for(let i=0; i<15; i++) {
    const bar = document.createElement('div');
    bar.className = 'vu-bar';
    vuContainer.appendChild(bar);
}

const points = [];
for (let i = 0; i < 60; i++) {
    points.push(new THREE.Vector3(Math.sin(i * 0.2) * 15, Math.cos(i * 0.1) * 15, i * 150));
}
const curve = new THREE.CatmullRomCurve3(points);
const tubeGeo = new THREE.TubeGeometry(curve, 600, 6, 12, false);
const tubeMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, wireframe: true, emissive: 0x00f2ff, emissiveIntensity: 0.6 });
const tunnel = new THREE.Mesh(tubeGeo, tubeMat);
scene.add(tunnel);

const light = new THREE.PointLight(0xff00ff, 150, 300);
scene.add(light);

// 2. SYNTHETIC DJ ENGINE (No External Files Needed)
function createKickSymbol() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

function createScratchFX() {
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start();
}

function setupAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 64;
    masterGain.connect(analyzer).connect(audioCtx.destination);
    
    // Start the 110 BPM Loop (Kick drum every 545ms)
    setInterval(() => {
        if(isPlaying) {
            createKickSymbol();
            // Jolt tunnel on beat
            tubeMat.emissiveIntensity = 2;
            gsap.to(tubeMat, { emissiveIntensity: 0.6, duration: 0.4 });
        }
    }, 545);

    // Random DJ Scratches
    setInterval(() => {
        if(isPlaying && Math.random() > 0.7) {
            createScratchFX();
            scratchIntensity = 3.0;
        }
    }, 1200);
}

// 3. RENDER LOOP
const vuBars = document.querySelectorAll('.vu-bar');
const dataArray = new Uint8Array(32);

function animate() {
    requestAnimationFrame(animate);
    if (isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
        vuBars.forEach((bar, i) => {
            const h = (dataArray[i] / 255) * 80;
            bar.style.height = `${h}px`;
        });

        progress += 0.00004;
        const pos = curve.getPointAt(progress % 1);
        const lookAt = curve.getPointAt((progress + 0.005) % 1);
        camera.position.copy(pos);
        camera.lookAt(lookAt);

        if(scratchIntensity > 0) {
            camera.position.x += Math.random() * scratchIntensity;
            scratchIntensity *= 0.9;
        }
        light.position.copy(pos);
    }
    renderer.render(scene, camera);
}

document.getElementById('init-btn').addEventListener('click', () => {
    setupAudio();
    isPlaying = true;
    document.getElementById('boot-screen').style.display = 'none';
    document.getElementById('hud').style.opacity = '1';
    animate();
    
    setInterval(() => {
        document.getElementById('active-member').innerText = members[Math.floor(Math.random() * members.length)];
    }, 4000);
});
