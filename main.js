const members = ["ALISHER FARHADI", "ROSS COHEN", "EPIC TECH", "ADAM NORMANDIN", "LUDOVIC"]; // Add all names here
let audioCtx, masterGain, compressor;

// 1. SCENE SETUP
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000205, 0.005);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// 2. THE ARCHITECTURE (Generative Tunnel)
const points = [];
for (let i = 0; i < 100; i++) {
    points.push(new THREE.Vector3(Math.sin(i * 0.1) * 10, Math.cos(i * 0.1) * 10, i * 150));
}
const curve = new THREE.CatmullRomCurve3(points);
const tubeGeo = new THREE.TubeGeometry(curve, 500, 4, 8, false);
const tubeMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, wireframe: true, transparent: true, opacity: 0.2 });
const tunnel = new THREE.Mesh(tubeGeo, tubeMat);
scene.add(tunnel);

// 3. REAL-TIME AUDIO ENGINE
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    compressor = audioCtx.createDynamicsCompressor();
    masterGain.connect(compressor).connect(audioCtx.destination);
    
    // Constant Bass Thrum
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.5;
    
    const bass = audioCtx.createOscillator();
    bass.type = 'sawtooth';
    bass.frequency.value = 55; // Low A
    bass.connect(masterGain);
    bass.start();
}

function triggerWhoosh() {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    osc.connect(g).connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 1);
}

// 4. ANIMATION LOOP
let progress = 0;
function animate() {
    requestAnimationFrame(animate);
    
    progress += 0.00005; // Cinematic Speed
    if(progress > 1) progress = 0;

    const pos = curve.getPointAt(progress);
    const lookAt = curve.getPointAt((progress + 0.01) % 1);
    camera.position.copy(pos);
    camera.lookAt(lookAt);

    // Pulse tunnel to 110 BPM (approx every 0.54s)
    const pulse = Math.sin(Date.now() * 0.0115); 
    tubeMat.opacity = 0.1 + (pulse * 0.05);

    renderer.render(scene, camera);
}

document.getElementById('init-btn').addEventListener('click', () => {
    initAudio();
    gsap.to("#boot-screen", { opacity: 0, duration: 2, onComplete: () => {
        document.getElementById('boot-screen').style.display = 'none';
        animate();
    }});
    // Simulate passing names & trigger audio
    setInterval(() => {
        triggerWhoosh();
        const randomMember = members[Math.floor(Math.random() * members.length)];
        document.getElementById('member-focus').innerText = randomMember;
    }, 4000); 
});
