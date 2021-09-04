const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on("joinRoom", (data) => {
        socket.join(data.roomId);
        console.log(`User ${socket.id} with username ${data.username} has joined room ${data.roomId}`);
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

server.listen(3001, () => {
    console.log("LISTENING ON PORT 3001");
});