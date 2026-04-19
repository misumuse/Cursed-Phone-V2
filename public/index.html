const socket = io();
let roomCode = "", myName = "", currentMode = "text", timerInterval, appleGoal = 10;
let brushColor = "black";

function setColor(c) { brushColor = c; }

socket.on('error_msg', (msg) => { document.getElementById('error-msg').innerText = msg; });

socket.on('random_event', (type) => {
    const body = document.getElementById('main-body');
    body.classList.remove('event-flip', 'event-invert', 'event-shake');
    if (type === "FLIP") body.classList.add('event-flip');
    if (type === "INVERT") body.classList.add('event-invert');
    if (type === "SHAKE") body.classList.add('event-shake');
    document.getElementById('event-ticker').innerText = "EVENT: " + type;
    setTimeout(() => {
        body.classList.remove('event-flip', 'event-invert', 'event-shake');
        document.getElementById('event-ticker').innerText = "Status: Stable";
    }, 5000);
});

function join() {
    roomCode = document.getElementById('codeInput').value.toUpperCase();
    myName = document.getElementById('nameInput').value;
    if (roomCode && myName) socket.emit('join_room', { code: roomCode, name: myName });
    document.getElementById('join-screen').classList.add('hidden');
    document.getElementById('lobby-screen').classList.remove('hidden');
    document.getElementById('room-display').innerText = roomCode;
}

function start() { socket.emit('start_game', roomCode); }

socket.on('update_players', (list) => {
    document.getElementById('player-list').innerHTML = list.map(p => `<li>💀 ${p}</li>`).join('');
});

socket.on('game_started', () => {
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    setupRound("WRITE A CURSED STARTING PROMPT", null, "text", 60);
});

socket.on('next_round', (data) => {
    appleGoal = data.appleReq;
    document.getElementById('goal').innerText = appleGoal;
    // If last was text, now draw. If last was image, now describe.
    const mode = data.lastEntry.type === 'text' ? 'image' : 'text';
    const instr = mode === 'image' ? "DRAW THIS:" : "DESCRIBE THIS DRAWING:";
    setupRound(instr, data.lastEntry, mode, data.time);
});

function setupRound(title, lastEntry, mode, time) {
    currentMode = mode;
    clearInterval(timerInterval);
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('instruction').innerText = title;
    
    let timeLeft = time;
    document.getElementById('submitBtn').disabled = (timeLeft > 1000);
    document.getElementById('timer').innerText = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) { clearInterval(timerInterval); submit(); }
    }, 1000);

    const drawTools = document.getElementById('draw-tools');
    const input = document.getElementById('textInput');
    const prev = document.getElementById('prev-content');
    ctx.clearRect(0,0,350,350);

    if (mode === 'image') {
        drawTools.classList.remove('hidden');
        input.classList.add('hidden');
        prev.innerText = lastEntry ? lastEntry.content : "Starting Round";
    } else {
        drawTools.classList.add('hidden');
        input.classList.remove('hidden');
        input.value = "";
        prev.innerHTML = lastEntry ? `<img src="${lastEntry.content}" width="200">` : "Error";
    }
}

function submit() {
    const content = currentMode === 'text' ? document.getElementById('textInput').value : canvas.toDataURL();
    socket.emit('submit_turn', { code: roomCode, content, type: currentMode, isSkip: false });
    document.getElementById('game-screen').classList.add('hidden');
}

// --- DRAWING LOGIC ---
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
let drawing = false, lastX = 0, lastY = 0;
canvas.onmousedown = (e) => { drawing = true; [lastX, lastY] = [e.offsetX, e.offsetY]; };
canvas.onmousemove = (e) => {
    if (!drawing) return;
    ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.strokeStyle = brushColor;
    ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
};
window.onmouseup = () => drawing = false;

// --- DEADLY/SHY SNAKE ---
const sCanvas = document.getElementById('snakeCanvas'), sCtx = sCanvas.getContext('2d');
let snake = [{x: 10, y: 10}], food = {x: 5, y: 5}, dx = 0, dy = 0, apples = 0;

window.onkeydown = (e) => {
    if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -1; }
    if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 1; }
    if (e.key === "ArrowLeft" && dx === 0) { dx = -1; dy = 0; }
    if (e.key === "ArrowRight" && dx === 0) { dx = 1; dy = 0; }
};

function resetSnake() {
    snake = [{x: 10, y: 10}]; dx = 0; dy = 0; apples = 0;
    document.getElementById('apples').innerText = 0;
    document.getElementById('skipBtn').disabled = true;
}

function runSnake() {
    if (dx === 0 && dy === 0) return;
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if (head.x < 0 || head.x > 19 || head.y < 0 || head.y > 19) return resetSnake();
    for (let p of snake) if (head.x === p.x && head.y === p.y) return resetSnake();

    // The Shy Apple (0.5% chance to dodge)
    const dist = Math.abs(head.x - food.x) + Math.abs(head.y - food.y);
    if (dist <= 2 && Math.random() < 0.005) food = {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20)};

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        apples++;
        document.getElementById('apples').innerText = apples;
        food = {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20)};
        if (apples >= appleGoal) document.getElementById('skipBtn').disabled = false;
    } else { snake.pop(); }

    sCtx.fillStyle = "#111"; sCtx.fillRect(0,0,200,200);
    sCtx.fillStyle = "#00ffcc"; snake.forEach(p => sCtx.fillRect(p.x*10, p.y*10, 9, 9));
    sCtx.fillStyle = "red"; sCtx.fillRect(food.x*10, food.y*10, 9, 9);
}
setInterval(runSnake, 100);

function skip() {
    socket.emit('submit_turn', { code: roomCode, content: "SNAKE SKIP", type: currentMode, isSkip: true });
    resetSnake();
    document.getElementById('game-screen').classList.add('hidden');
}

// --- FINAL REVEAL ---
socket.on('show_results', (players) => {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    const container = document.getElementById('results-content');
    players.forEach(p => {
        let bookHtml = `<div style="border: 2px solid #ff00ff; margin: 10px; padding: 10px; background: #000;">
                        <h3>${p.name}'s Original Idea</h3>`;
        p.book.forEach(e => {
            if(e.type === 'text') bookHtml += `<p style="color:yellow;">${e.author} wrote: "${e.content}"</p>`;
            else bookHtml += `<p>${e.author} drew:</p><img src="${e.content}" width="300"><br>`;
        });
        bookHtml += `</div>`;
        container.innerHTML += bookHtml;
    });
});
