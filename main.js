// --- AI MASTERY // LIVE VIRTUAL DECK // AUDIO FIX VERSION ---

const members = [
    "ALISHER FARHADI", "ROSS COHEN", "EPIC TECH", "ADAM NORMANDIN", 
    "LUDOVIC", "CHUCK BAGGETT", "MIMI BROWN", "MATTHEW LEIGH", "CHRIS CONLEY"
];

let audioCtx, masterGain, analyzer;
let kickBuffer, scratchBuffer, shimmerBuffer;
let isPlaying = false;
let progress = 0;
let scratchIntensity = 0;

// 1. THREE.JS ENGINE SETUP
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000508, 0.008);
const camera = new THREE.PerspectiveCamera(65, window.innerWidth/window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('main-canvas'), 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Build VU Meter UI
const vuContainer = document.getElementById('vumeter');
for(let i=0; i<15; i++) {
    const bar = document.createElement('div');
    bar.className = 'vu-bar';
    vuContainer.appendChild(bar);
}

// 2. THE GEOMETRY
const points = [];
for (let i = 0; i < 60; i++) {
    points.push(new THREE.Vector3(Math.sin(i * 0.2) * 15, Math.cos(i * 0.1) * 15, i * 150));
}
const curve = new THREE.CatmullRomCurve3(points);
const tubeGeo = new THREE.TubeGeometry(curve, 600, 6, 12, false);
const tubeMat = new THREE.MeshStandardMaterial({ 
    color: 0x00f2ff, 
    wireframe: true, 
    emissive: 0x00f2ff,
    emissiveIntensity: 0.6 
});
const tunnel = new THREE.Mesh(tubeGeo, tubeMat);
scene.add(tunnel);

const light = new THREE.PointLight(0xff00ff, 150, 300);
scene.add(light);

// 3. THE IMPROVED AUDIO LOADER
async function setupAudio() {
    console.log("Initializing Audio Context...");
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Ensure the context is running
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        masterGain = audioCtx.createGain();
        analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 64;
        masterGain.connect(analyzer).connect(audioCtx.destination);

        // Loading high-stability CDN samples
        console.log("Loading Soundbank...");
        kickBuffer = await loadSample('https://cdn.pixabay.com/audio/2022/03/10/audio_c976f920f3.mp3'); 
        scratchBuffer = await loadSample('https://cdn.pixabay.com/audio/2021/11/24/audio_985532588e.mp3'); 
        shimmerBuffer = await loadSample('https://cdn.pixabay.com/audio/2022/03/15/audio_27607a513c.mp3'); 
        
        console.log("Soundbank Loaded Successfully.");
        startLiveSet();
    } catch (e) {
        console.error("Audio Setup Failed:", e);
    }
}

async function loadSample(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

function playLoop(buffer, vol = 0.5) {
    if (!buffer) return;
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = vol;
    source.connect(gain).connect(masterGain);
    source.start(0);
}

function triggerFX(buffer, pitch = 1.0, vol = 0.3) {
    if (!buffer || !audioCtx) return;
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    gain.gain.value = vol;
    source.connect(gain).connect(masterGain);
    source.start(0);
}

function startLiveSet() {
    console.log("Dropping the beat...");
    playLoop(kickBuffer, 0.7);    
    playLoop(shimmerBuffer, 0.3); 
    
    setInterval(() => {
        if(Math.random() > 0.6) {
            triggerFX(scratchBuffer, 0.8 + Math.random() * 1.5, 0.2);
            scratchIntensity = 2.5; 
            gsap.to(tubeMat, { emissiveIntensity: 2, duration: 0.1, yoyo: true, repeat: 1 });
        }
    }, 1100); 
}

// 4. ANIMATION & VU METER
const vuBars = document.querySelectorAll('.vu-bar');
const dataArray = new Uint8Array(32);

function animate() {
    requestAnimationFrame(animate);
    
    if (isPlaying && analyzer) {
        analyzer.getByteFrequencyData(dataArray);
        
        vuBars.forEach((bar, i) => {
            const h = (dataArray[i] / 255) * 80;
            bar.style.height = `${h}px`;
            if (h > 70) bar.classList.add('peak');
            else bar.classList.remove('peak');
        });

        progress += 0.00003 + (dataArray[1] * 0.0000008);
        if (progress > 1) progress = 0;

        const pos = curve.getPointAt(progress);
        const lookAt = curve.getPointAt((progress + 0.005) % 1);
        camera.position.copy(pos);
        camera.lookAt(lookAt);

        if(scratchIntensity > 0) {
            camera.position.x += Math.sin(Date.now() * 0.5) * scratchIntensity;
            camera.position.y += Math.cos(Date.now() * 0.5) * scratchIntensity;
            scratchIntensity *= 0.85; 
        }

        light.intensity = 100 + dataArray[0] * 2;
        light.position.copy(pos);
    }
    renderer.render(scene, camera);
}

// BOOT BUTTON
const initBtn = document.getElementById('init-btn');
setTimeout(() => {
    document.getElementById('loader-progress').style.width = "100%";
    initBtn.style.opacity = "1";
    initBtn.classList.add('ready');
}, 3000);

initBtn.addEventListener('click', async () => {
    await setupAudio();
    isPlaying = true;
    gsap.to("#boot-screen", { opacity: 0, duration: 1, onComplete: () => {
        document.getElementById('boot-screen').style.display = 'none';
        document.getElementById('hud').style.opacity = '1';
        animate();
    }});

    setInterval(() => {
        const name = members[Math.floor(Math.random() * members.length)];
        document.getElementById('active-member').innerText = name;
        triggerFX(shimmerBuffer, 1.5, 0.1); 
    }, 5000);
});
