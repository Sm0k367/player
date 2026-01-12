// --- AI MASTERY // LIVE VIRTUAL DECK ENGINE ---

const members = [
    "ALISHER FARHADI", "ROSS COHEN", "EPIC TECH", "ADAM NORMANDIN", 
    "LUDOVIC", "CHUCK BAGGETT", "MIMI BROWN", "MATTHEW LEIGH"
];

let audioCtx, masterGain, analyzer, kickBuffer, scratchBuffer;
let isPlaying = false;
let progress = 0;
let scratchIntensity = 0;

// 1. THREE.JS ARCHITECTURE
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000508, 0.008);
const camera = new THREE.PerspectiveCamera(65, window.innerWidth/window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create the VU Meter Bars in HUD
const vuContainer = document.getElementById('vumeter');
for(let i=0; i<15; i++) {
    const bar = document.createElement('div');
    bar.className = 'vu-bar';
    vuContainer.appendChild(bar);
}

// 2. THE PATH & TUNNEL (The "Vinyl" Curve)
const points = [];
for (let i = 0; i < 50; i++) {
    points.push(new THREE.Vector3(Math.sin(i * 0.2) * 15, Math.cos(i * 0.1) * 15, i * 120));
}
const curve = new THREE.CatmullRomCurve3(points);
const tubeGeo = new THREE.TubeGeometry(curve, 400, 5, 12, false);
const tubeMat = new THREE.MeshStandardMaterial({ 
    color: 0x00f2ff, 
    wireframe: true, 
    emissive: 0x00f2ff,
    emissiveIntensity: 0.5 
});
const tunnel = new THREE.Mesh(tubeGeo, tubeMat);
scene.add(tunnel);

const light = new THREE.PointLight(0xff00ff, 100, 200);
scene.add(light);

// 3. THE LIVE DJ SOUND ENGINE
async function setupAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 64;
    masterGain.connect(analyzer).connect(audioCtx.destination);

    // Load High-Quality Samples (Placeholders - Replace with your own assets in repo)
    // You can use direct links to .wav or .mp3 files here
    kickBuffer = await loadSample('https://actions.google.com/sounds/v1/science_fiction/glitch_low_hit.ogg'); 
    scratchBuffer = await loadSample('https://actions.google.com/sounds/v1/impacts/crash_with_echo.ogg');
    
    startLiveSet();
}

async function loadSample(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

function playLoop(buffer, rate = 1.0, vol = 0.5) {
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = rate;
    gain.gain.value = vol;
    source.connect(gain).connect(masterGain);
    source.start();
}

function triggerScratch() {
    if (!scratchBuffer) return;
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = scratchBuffer;
    // Turntablism Physics: Random pitch shifting for "scratches"
    source.playbackRate.value = 0.5 + Math.random() * 2; 
    gain.gain.value = 0.2;
    source.connect(gain).connect(masterGain);
    source.start();
    
    // Visual "Jolt"
    scratchIntensity = 2.0;
    gsap.to(camera.rotation, { z: camera.rotation.z + 0.2, duration: 0.1, yoyo: true, repeat: 1 });
}

function startLiveSet() {
    playLoop(kickBuffer, 0.8, 0.6); // The driving "Bass Thrum"
    
    // Scheduled Turntable FX
    setInterval(() => {
        if(Math.random() > 0.7) triggerScratch();
    }, 1100); // Synced to 110 BPM approx
}

// 4. THE ANIMATION LOOP
const vuBars = document.querySelectorAll('.vu-bar');
const dataArray = new Uint8Array(32);

function animate() {
    requestAnimationFrame(animate);
    
    if (isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
        
        // Update VU Meter
        vuBars.forEach((bar, i) => {
            const h = (dataArray[i] / 255) * 80;
            bar.style.height = `${h}px`;
            if (h > 65) bar.classList.add('peak');
            else bar.classList.remove('peak');
        });

        // Movement Logic
        progress += 0.00004 + (dataArray[2] * 0.0000005);
        if (progress > 1) progress = 0;

        const pos = curve.getPointAt(progress);
        const lookAt = curve.getPointAt((progress + 0.01) % 1);
        camera.position.copy(pos);
        camera.lookAt(lookAt);

        // Scratch Jitter
        if(scratchIntensity > 0) {
            camera.position.x += Math.sin(Date.now()) * scratchIntensity;
            scratchIntensity *= 0.9;
        }

        // Pulse light to kick drum
        light.intensity = 50 + dataArray[0];
        light.position.copy(pos);
    }
    
    renderer.render(scene, camera);
}

// START BUTTON
const initBtn = document.getElementById('init-btn');
// Simulate loading
setTimeout(() => {
    document.getElementById('loader-progress').style.width = "100%";
    initBtn.style.opacity = "1";
    initBtn.classList.add('ready');
}, 2000);

initBtn.addEventListener('click', () => {
    setupAudio();
    isPlaying = true;
    gsap.to("#boot-screen", { opacity: 0, duration: 1.5, onComplete: () => {
        document.getElementById('boot-screen').style.display = 'none';
        document.getElementById('hud').style.opacity = '1';
        animate();
    }});

    // Cycle Member Names
    setInterval(() => {
        const name = members[Math.floor(Math.random() * members.length)];
        document.getElementById('active-member').innerText = name;
    }, 5000);
});
