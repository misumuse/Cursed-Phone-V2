const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let rooms = {}; 
const CHAOS_WORDS = ["BEEF", "SOGGY", "WIZARD", "GLITCH", "DUST", "CHEESE", "SUSPICIOUS", "MOIST", "CRISP"];
const EVENTS = ["FLIP", "INVERT", "SHAKE"];

io.on('connection', (socket) => {
    socket.on('join_room', ({ code, name }) => {
        socket.join(code);
        if (!rooms[code]) rooms[code] = { players: [], currentRound: 0, skipCount: 0 };
        rooms[code].players.push({ id: socket.id, name, book: [] });
        io.to(code).emit('update_players', rooms[code].players.map(p => p.name));
    });

    socket.on('start_game', (code) => {
        const room = rooms[code];
        if (!room) return;
        if (room.players.length < 3) {
            return socket.emit('error_msg', "Need at least 3 players to start the curse!");
        }
        
        io.to(code).emit('game_started');
        
        setInterval(() => {
            const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
            io.to(code).emit('random_event', event);
        }, 25000);
    });

    socket.on('submit_turn', ({ code, content, type, isSkip }) => {
        const room = rooms[code];
        if (!room) return;
        if (isSkip) room.skipCount++;

        const pIdx = room.players.findIndex(p => p.id === socket.id);
        // This logic ensures books rotate correctly every round
        const bOwnerIdx = (pIdx + room.currentRound) % room.players.length;

        let finalContent = content;
        if (type === 'text' && !isSkip) {
            let w = content.split(" ");
            if(w.length > 1) w.splice(Math.floor(Math.random() * w.length), 0, CHAOS_WORDS[Math.floor(Math.random() * CHAOS_WORDS.length)]);
            finalContent = w.join(" ").toUpperCase();
        }

        room.players[bOwnerIdx].book.push({ author: room.players[pIdx].name, content: finalContent, type });

        // Check if everyone is done with the round
        if (room.players.every(p => p.book.length === room.currentRound + 1)) {
            room.currentRound++;
            
            // If rounds = number of players, the books have returned home
            if (room.currentRound >= room.players.length) {
                io.to(code).emit('show_results', room.players);
            } else {
                room.players.forEach((p, i) => {
                    const nextBookIdx = (i + room.currentRound) % room.players.length;
                    const lastEntry = room.players[nextBookIdx].book[room.currentRound - 1];
                    
                    let roll = Math.random();
                    let time = roll < 0.15 ? 3 : (roll > 0.95 ? 300000 : 60);
                    let appleReq = room.skipCount >= 10 ? 90 : 10 + (room.skipCount * 5);
                    
                    io.to(p.id).emit('next_round', { lastEntry, time, appleReq });
                });
            }
        }
    });
});

http.listen(3000, () => console.log('🔥 CURSED SERVER ON PORT 3000'));
