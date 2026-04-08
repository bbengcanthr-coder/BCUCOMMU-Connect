const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

let waitingQueue = [];

io.on('connection', (socket) => {
    socket.on('join', (username) => {
        socket.username = username;
        if (waitingQueue.length > 0) {
            let partner = waitingQueue.shift();
            let room = `room_${socket.id}_${partner.id}`;
            socket.join(room);
            partner.join(room);
            io.to(room).emit('chat_start', { users: [socket.username, partner.username] });
            socket.currentRoom = room;
            partner.currentRoom = room;
        } else {
            waitingQueue.push(socket);
            socket.emit('status', 'กำลังหาเพื่อนคุยให้คุณ...');
        }
    });

    socket.on('message', (msg) => {
        if(socket.currentRoom) {
            io.to(socket.currentRoom).emit('message', { user: socket.username, text: msg });
        }
    });

    socket.on('disconnect', () => {
        waitingQueue = waitingQueue.filter(s => s.id !== socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('BCUCOMMU is Live!'));