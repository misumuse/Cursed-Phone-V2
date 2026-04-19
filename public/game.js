// ============================================================
//  CURSED PHONE — Improved Client Script
// ============================================================
const socket = io({ transports: ['websocket', 'polling'], secure: true, rejectUnauthorized: false, extraHeaders: { 'ngrok-skip-browser-warning': 'true' } });
let roomCode = "", myName = "", currentMode = "text";
let timerInterval, appleGoal = 10;

// ---- DRAWING STATE ----
let brushColor = "#000000";
let brushSize = 3;
let currentTool = "pen";
let drawing = false, lastX = 0, lastY = 0;
let undoStack = [];
const MAX_UNDO = 20;

// ---- SOUND STATE ----
let soundEnabled = true;
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playTone(freq, type = "sine", duration = 0.15, volume = 0.3, delay = 0) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration + 0.01);
    } catch(e) {}
}

function playChord(freqs, duration = 0.2) { freqs.forEach((f, i) => playTone(f, "triangle", duration, 0.15, i * 0.03)); }
function playJoin()   { playChord([220, 330, 440]); }
function playStart()  { [200,250,300,400,500,600].forEach((f,i) => playTone(f, "sawtooth", 0.12, 0.2, i*0.06)); }
function playSubmit() { playChord([440, 554, 659], 0.3); }
function playSkip()   { playTone(80, "sawtooth", 0.5, 0.5); playTone(60, "sawtooth", 0.3, 0.4, 0.3); }
function playTimer()  { playTone(880, "square", 0.05, 0.4); }
function playEat()    { playTone(660, "sine", 0.1, 0.3); playTone(880, "sine", 0.1, 0.3, 0.12); }
function playDie()    { [400,300,200,100].forEach((f,i) => playTone(f, "sawtooth", 0.15, 0.3, i*0.08)); }
function playEvent()  { playTone(150, "square", 0.6, 0.5); playTone(100, "square", 0.4, 0.4, 0.3); }
function playDraw()   {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.08;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
    } catch(e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById("soundToggle");
    btn.textContent = soundEnabled ? "🔊" : "🔇";
    btn.className = soundEnabled ? "on" : "off";
}

// ---- TOAST ----
let toastTimeout;
function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.classList.remove("show"), 2500);
}

// ---- PARTICLES ----
const pCanvas = document.getElementById("particleCanvas");
const pCtx = pCanvas.getContext("2d");
let particles = [];

function resizeParticleCanvas() {
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;
}
resizeParticleCanvas();
window.addEventListener("resize", resizeParticleCanvas);

function spawnParticles(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            color,
            life: 1,
            size: 4 + Math.random() * 6
        });
    }
}

function animateParticles() {
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.025;
        pCtx.globalAlpha = p.life;
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        pCtx.fill();
    }
    pCtx.globalAlpha = 1;
    requestAnimationFrame(animateParticles);
}
animateParticles();

// ---- PALETTE SETUP ----
const COLORS = [
    "#000000","#ffffff","#ff0000","#ff6600","#ffcc00","#ffff00",
    "#00ff00","#00cc44","#00ffcc","#0099ff","#0044ff","#8800ff",
    "#ff00ff","#ff0088","#aa5533","#663300","#ff99cc","#aaaaaa",
    "#555555","#00ffff"
];

function buildPalette() {
    const pal = document.getElementById("palette");
    pal.innerHTML = "";
    COLORS.forEach(c => {
        const s = document.createElement("div");
        s.className = "swatch" + (c === "#000000" ? " active" : "");
        s.style.background = c;
        if (c === "#ffffff") s.style.border = "2px solid #666";
        s.onclick = () => {
            document.querySelectorAll(".swatch").forEach(el => el.classList.remove("active"));
            s.classList.add("active");
            setColor(c);
            setTool("pen");
        };
        pal.appendChild(s);
    });
    // Eraser at end
    const er = document.createElement("div");
    er.className = "swatch eraser-swatch";
    er.title = "Eraser";
    er.innerHTML = "✕";
    er.style.cssText = "display:flex;align-items:center;justify-content:center;font-size:14px;color:#999;";
    er.onclick = () => setTool("erase");
    pal.appendChild(er);
}
buildPalette();

function setColor(c) {
    brushColor = c;
    if (currentTool === "erase") setTool("pen");
}

function setBrush(size, btnId) {
    brushSize = size;
    document.querySelectorAll(".brush-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(btnId)?.classList.add("active");
}

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
    const el = document.getElementById("tool-" + tool);
    if (el) el.classList.add("active");
    if (tool === "erase") {
        document.querySelectorAll(".swatch").forEach(b => b.classList.remove("active"));
    }
    document.getElementById("drawCanvas").style.cursor = tool === "fill" ? "cell" : tool === "spray" ? "crosshair" : tool === "erase" ? "cell" : "crosshair";
}

// ---- CANVAS SETUP ----
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

function saveUndo() {
    if (undoStack.length >= MAX_UNDO) undoStack.shift();
    undoStack.push(canvas.toDataURL());
}

function undo() {
    if (undoStack.length === 0) return;
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = undoStack.pop();
}

function clearCanvas() {
    saveUndo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Flood fill
function floodFill(x, y, fillColorHex) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const targetIdx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
    const tr = data[targetIdx], tg = data[targetIdx+1], tb = data[targetIdx+2], ta = data[targetIdx+3];

    const hex = fillColorHex.replace("#","");
    const fr = parseInt(hex.slice(0,2),16);
    const fg = parseInt(hex.slice(2,4),16);
    const fb = parseInt(hex.slice(4,6),16);

    if (tr===fr && tg===fg && tb===fb) return;

    const stack = [[Math.floor(x), Math.floor(y)]];
    while (stack.length) {
        const [cx, cy] = stack.pop();
        if (cx<0||cx>=canvas.width||cy<0||cy>=canvas.height) continue;
        const idx = (cy * canvas.width + cx) * 4;
        if (data[idx]!==tr||data[idx+1]!==tg||data[idx+2]!==tb||data[idx+3]!==ta) continue;
        data[idx]=fr; data[idx+1]=fg; data[idx+2]=fb; data[idx+3]=255;
        stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    ctx.putImageData(imgData, 0, 0);
}

let sprayInterval;
canvas.addEventListener("mousedown", (e) => {
    if (currentTool === "fill") {
        saveUndo();
        floodFill(e.offsetX, e.offsetY, brushColor);
        return;
    }
    saveUndo();
    drawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    if (currentTool === "spray") {
        sprayAt(e.offsetX, e.offsetY);
        sprayInterval = setInterval(() => sprayAt(lastX, lastY), 30);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    lastX = e.offsetX; lastY = e.offsetY;
    if (currentTool === "pen" || currentTool === "erase") {
        ctx.lineWidth = currentTool === "erase" ? brushSize * 3 : brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = currentTool === "erase" ? "white" : brushColor;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
        if (Math.random() < 0.1) playDraw();
    }
});

window.addEventListener("mouseup", () => {
    drawing = false;
    clearInterval(sprayInterval);
});

// Touch support
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const ex = t.clientX - r.left, ey = t.clientY - r.top;
    if (currentTool === "fill") { saveUndo(); floodFill(ex, ey, brushColor); return; }
    saveUndo();
    drawing = true;
    [lastX, lastY] = [ex, ey];
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const ex = t.clientX - r.left, ey = t.clientY - r.top;
    ctx.lineWidth = currentTool === "erase" ? brushSize * 3 : brushSize;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = currentTool === "erase" ? "white" : brushColor;
    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(ex, ey); ctx.stroke();
    [lastX, lastY] = [ex, ey];
}, { passive: false });

canvas.addEventListener("touchend", () => { drawing = false; });

function sprayAt(x, y) {
    ctx.fillStyle = brushColor;
    const radius = brushSize * 4;
    for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ---- SOCKET LOGIC ----
socket.on("error_msg", (msg) => { document.getElementById("error-msg").innerText = msg; });

socket.on("random_event", (type) => {
    const body = document.getElementById("main-body");
    body.classList.remove("event-flip","event-invert","event-shake","event-rainbow","event-zoom","event-glitch");
    const map = { FLIP:"event-flip", INVERT:"event-invert", SHAKE:"event-shake", RAINBOW:"event-rainbow", ZOOM:"event-zoom", GLITCH:"event-glitch" };
    if (map[type]) body.classList.add(map[type]);
    document.getElementById("event-ticker").innerText = "⚡ EVENT: " + type;
    playEvent();
    showToast("⚡ CHAOS: " + type);
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    spawnParticles(cx, cy, "#ff00ff", 40);
    setTimeout(() => {
        body.classList.remove("event-flip","event-invert","event-shake","event-rainbow","event-zoom","event-glitch");
        document.getElementById("event-ticker").innerText = "Status: Stable";
    }, 5000);
});

function join() {
    roomCode = document.getElementById("codeInput").value.toUpperCase();
    myName = document.getElementById("nameInput").value.trim();
    if (!roomCode || !myName) return;
    socket.emit("join_room", { code: roomCode, name: myName });
    document.getElementById("join-screen").classList.add("hidden");
    document.getElementById("lobby-screen").classList.remove("hidden");
    document.getElementById("room-display").innerText = roomCode;
    playJoin();
}

document.getElementById("codeInput").addEventListener("keydown", e => { if (e.key === "Enter") join(); });
document.getElementById("nameInput").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("codeInput").focus(); });

function start() { socket.emit("start_game", roomCode); }

socket.on("update_players", (list) => {
    document.getElementById("player-list").innerHTML = list.map(p => `<li>💀 ${p}</li>`).join("");
});

socket.on("game_started", () => {
    document.getElementById("lobby-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
    setupRound("WRITE A CURSED STARTING PROMPT", null, "text", 60);
    playStart();
    showToast("THE CURSE BEGINS!");
    spawnParticles(window.innerWidth/2, window.innerHeight/2, "#ff00ff", 60);
});

socket.on("next_round", (data) => {
    appleGoal = data.appleReq;
    document.getElementById("goal").innerText = appleGoal;
    document.getElementById("waiting-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
    const mode = data.lastEntry.type === "text" ? "image" : "text";
    const instr = mode === "image" ? "🎨 DRAW THIS:" : "📝 DESCRIBE THIS DRAWING:";
    setupRound(instr, data.lastEntry, mode, data.time);
});

function setupRound(title, lastEntry, mode, time) {
    currentMode = mode;
    clearInterval(timerInterval);
    document.getElementById("instruction").innerText = title;

    let timeLeft = time;
    const timerEl = document.getElementById("timer");
    timerEl.innerText = timeLeft;
    timerEl.classList.remove("danger");
    document.getElementById("submitBtn").disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 10) {
            timerEl.classList.add("danger");
            playTimer();
        }
        if (timeLeft <= 0) { clearInterval(timerInterval); submit(); }
    }, 1000);

    const drawTools = document.getElementById("draw-tools");
    const input = document.getElementById("textInput");
    const prev = document.getElementById("prev-content");

    if (mode === "image") {
        drawTools.classList.remove("hidden");
        input.classList.add("hidden");
        clearCanvas();
        undoStack = [];
        prev.style.color = "#ffff00";
        prev.innerText = lastEntry ? lastEntry.content : "Starting Round";
    } else {
        drawTools.classList.add("hidden");
        input.classList.remove("hidden");
        input.value = "";
        if (lastEntry) {
            prev.innerHTML = `<img src="${lastEntry.content}" style="max-width:100%;border-radius:6px;border:2px solid #444;">`;
        }
        setTimeout(() => input.focus(), 100);
    }
}

function submit() {
    clearInterval(timerInterval);
    const content = currentMode === "text"
        ? document.getElementById("textInput").value
        : canvas.toDataURL("image/jpeg", 0.7);
    socket.emit("submit_turn", { code: roomCode, content, type: currentMode, isSkip: false });
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("waiting-screen").classList.remove("hidden");
    playSubmit();
    spawnParticles(window.innerWidth/2, 200, "#00ffcc", 30);
    showToast("SUBMITTED!");
}

// ---- SNAKE ----
const sCanvas = document.getElementById("snakeCanvas");
const sCtx = sCanvas.getContext("2d");
const GRID = 22, CELL = 10; // 22x22 grid, 10px each = 220px + 1px border each side
let snake = [{x:11, y:11}], food = {x:5, y:5}, dx=0, dy=0, apples=0;
let snakeHue = 0;

window.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT") return;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }
    if (e.key==="ArrowUp" && dy===0) { dx=0; dy=-1; }
    if (e.key==="ArrowDown" && dy===0) { dx=0; dy=1; }
    if (e.key==="ArrowLeft" && dx===0) { dx=-1; dy=0; }
    if (e.key==="ArrowRight" && dx===0) { dx=1; dy=0; }
});

function resetSnake() {
    snake = [{x:11, y:11}]; dx=0; dy=0; apples=0;
    document.getElementById("apples").innerText = 0;
    document.getElementById("skipBtn").disabled = true;
    playDie();
}

function spawnFood() {
    let nx, ny;
    do {
        nx = Math.floor(Math.random() * GRID);
        ny = Math.floor(Math.random() * GRID);
    } while (snake.some(p => p.x===nx && p.y===ny));
    food = {x:nx, y:ny};
}

function runSnake() {
    if (dx===0 && dy===0) {
        drawSnakeBoard();
        return;
    }
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if (head.x<0||head.x>=GRID||head.y<0||head.y>=GRID) return resetSnake();
    if (snake.some(p => head.x===p.x && head.y===p.y)) return resetSnake();

    // Shy apple (0.5% dodge)
    const dist = Math.abs(head.x-food.x) + Math.abs(head.y-food.y);
    if (dist<=2 && Math.random()<0.005) spawnFood();

    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) {
        apples++;
        document.getElementById("apples").innerText = apples;
        spawnFood();
        if (apples >= appleGoal) document.getElementById("skipBtn").disabled = false;
        playEat();
        snakeHue = (snakeHue + 30) % 360;
        // particle burst at food location
        const rect = sCanvas.getBoundingClientRect();
        spawnParticles(rect.left + food.x*CELL + CELL/2, rect.top + food.y*CELL + CELL/2, "#ff3300", 10);
    } else {
        snake.pop();
    }
    drawSnakeBoard();
}

function drawSnakeBoard() {
    sCtx.fillStyle = "#050505";
    sCtx.fillRect(0, 0, sCanvas.width, sCanvas.height);
    // Grid dots
    sCtx.fillStyle = "rgba(255,255,255,0.05)";
    for (let x=0; x<GRID; x++) for (let y=0; y<GRID; y++) {
        sCtx.fillRect(x*CELL+4, y*CELL+4, 2, 2);
    }
    // Snake (rainbow gradient)
    snake.forEach((p, i) => {
        const hue = (snakeHue + i * 8) % 360;
        sCtx.fillStyle = `hsl(${hue}, 100%, 55%)`;
        sCtx.beginPath();
        sCtx.roundRect(p.x*CELL+1, p.y*CELL+1, CELL-2, CELL-2, 2);
        sCtx.fill();
    });
    // Food (pulsing)
    const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
    sCtx.fillStyle = `rgba(255,50,50,${pulse})`;
    sCtx.beginPath();
    sCtx.arc(food.x*CELL+CELL/2, food.y*CELL+CELL/2, CELL/2*pulse, 0, Math.PI*2);
    sCtx.fill();
}

setInterval(runSnake, 100);

function skip() {
    socket.emit("submit_turn", { code: roomCode, content: "SNAKE SKIP", type: currentMode, isSkip: true });
    resetSnake();
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("waiting-screen").classList.remove("hidden");
    playSkip();
    showToast("ROUND SKIPPED!");
}

// ---- RESULTS ----
socket.on("show_results", (players) => {
    clearInterval(timerInterval);
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("waiting-screen").classList.add("hidden");
    document.getElementById("results-screen").classList.remove("hidden");
    const container = document.getElementById("results-content");
    container.innerHTML = "";
    players.forEach((p, i) => {
        setTimeout(() => {
            const div = document.createElement("div");
            div.className = "result-book";
            div.innerHTML = `<h3>📖 ${p.name}'s Original Idea</h3>`;
            p.book.forEach(e => {
                const entry = document.createElement("div");
                entry.className = "result-entry";
                if (e.type === "text") {
                    entry.innerHTML = `<p>✍️ <b>${e.author}</b> wrote: "${e.content}"</p>`;
                } else {
                    entry.innerHTML = `<p>🖼️ <b>${e.author}</b> drew:</p><img src="${e.content}" style="max-width:100%;border-radius:6px;">`;
                }
                div.appendChild(entry);
            });
            container.appendChild(div);
        }, i * 300);
    });
    playStart();
    showToast("THE CURSE IS REVEALED!");
    spawnParticles(window.innerWidth/2, window.innerHeight/2, "#ffff00", 80);
});
