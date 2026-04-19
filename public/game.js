<!DOCTYPE html>
<html>
<head>
    <title>CURSED PHONE</title>
    <style>
        * { font-family: "Comic Sans MS", cursive !important; box-sizing: border-box; transition: transform 0.5s; }
        body { background: #2b0031; color: #00ffcc; display: flex; height: 100vh; margin: 0; overflow: hidden; }
        
        .event-flip { transform: rotate(180deg); }
        .event-invert { filter: invert(1); }
        .event-shake { animation: shake 0.5s infinite; }
        @keyframes shake { 0% { margin-left: 0; } 25% { margin-left: 10px; } 50% { margin-left: -10px; } 100% { margin-left: 0; } }

        #sidebar { width: 280px; background: #000; border-left: 5px solid #ff00ff; padding: 15px; text-align: center; }
        #game-container { flex: 1; display: flex; align-items: center; justify-content: center; }
        .card { background: #1a1a1a; padding: 25px; border: 5px solid #ff00ff; border-radius: 20px; box-shadow: 10px 10px 0px #00ffcc; width: 480px; text-align: center; }
        
        canvas#drawCanvas { background: white; border: 3px solid #00ffcc; cursor: crosshair; margin: 10px auto; display: block; touch-action: none; }
        .palette { display: flex; justify-content: center; gap: 5px; margin-bottom: 10px; }
        .swatch { width: 25px; height: 25px; border: 2px solid white; cursor: pointer; border-radius: 50%; }

        .hidden { display: none !important; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 2px solid #ff00ff; background: #000; color: #00ffcc; }
        button { background: #ff00ff; color: white; border: none; padding: 12px; cursor: pointer; font-weight: bold; width: 100%; }
        #timer { font-size: 48px; color: #ffff00; }
        #snakeCanvas { background: #111; border: 2px solid #fff; margin: 10px 0; }
        #error-msg { color: #ff0000; font-weight: bold; margin-top: 10px; }
    </style>
</head>
<body id="main-body">
    <div id="game-container">
        <div id="join-screen" class="card">
            <h1>CURSED PHONE</h1>
            <input type="text" id="nameInput" placeholder="YOUR NAME">
            <input type="text" id="codeInput" placeholder="ROOM CODE">
            <button onclick="join()">JOIN / HOST</button>
        </div>

        <div id="lobby-screen" class="card hidden">
            <h1>LOBBY: <span id="room-display"></span></h1>
            <ul id="player-list" style="list-style:none; padding:0;"></ul>
            <button onclick="start()">START (MIN 3)</button>
            <div id="error-msg"></div>
        </div>

        <div id="game-screen" class="card hidden">
            <div id="timer">60</div>
            <p id="instruction" style="font-size: 1.2em;"></p>
            <div id="prev-content" style="background: #333; padding: 10px; border-radius: 10px; margin-bottom: 10px;"></div>
            
            <div id="draw-tools" class="hidden">
                <div class="palette">
                    <div class="swatch" style="background: black;" onclick="setColor('black')"></div>
                    <div class="swatch" style="background: red;" onclick="setColor('red')"></div>
                    <div class="swatch" style="background: blue;" onclick="setColor('blue')"></div>
                    <div class="swatch" style="background: green;" onclick="setColor('green')"></div>
                    <div class="swatch" style="background: yellow;" onclick="setColor('yellow')"></div>
                    <div class="swatch" style="background: white; border: 1px solid #999;" onclick="setColor('white')"></div>
                </div>
                <canvas id="drawCanvas" width="350" height="350"></canvas>
            </div>

            <input type="text" id="textInput" placeholder="Describe the horror...">
            <button id="submitBtn" onclick="submit()">SUBMIT TURN</button>
        </div>

        <div id="results-screen" class="card hidden" style="overflow-y: auto; max-height: 90vh; width: 600px;">
            <h1>CURSED REVEAL</h1>
            <div id="results-content"></div>
            <button onclick="location.reload()">RE-CURSE</button>
        </div>
    </div>

    <div id="sidebar">
        <h3 style="color: #ff00ff;">SNAKE TO SKIP</h3>
        <canvas id="snakeCanvas" width="200" height="200"></canvas>
        <p>Apples: <span id="apples">0</span> / <span id="goal">10</span></p>
        <button id="skipBtn" disabled onclick="skip()" style="background: red;">SKIP ROUND</button>
        <p id="event-ticker" style="color: yellow; font-size: 12px; margin-top: 10px;">Status: Stable</p>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script src="game.js"></script>
</body>
</html>
