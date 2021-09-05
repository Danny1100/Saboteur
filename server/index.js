const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { addUser } = require('./users')

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

io.on("connection", (socket) => {
    console.log(`User ${socket.id} has connected to the server`);

    socket.on("joinRoom", (data) => {
        const {error, users} = addUser(socket.id, data.username, data.password);
        if(error) {
            io.to(socket.id).emit("joinError", error);
        } else {
            socket.join(data.password);
            console.log(`User ${socket.id} with username ${data.username} has joined.`);
            io.in(data.password).emit("playerJoined", users);
        };
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

server.listen(3001, () => {
    console.log("LISTENING ON PORT 3001");
});