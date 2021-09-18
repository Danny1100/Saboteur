const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { addUser, removeUser, getUsers, getNumberOfPlayers } = require('./users');
const { initialiseDeck, shuffleDeck, getDeck, initialisePlayerCards, getPlayerCards, getRemainingCards } = require('./deckOfCards');
const { initialisePlayersPermanentCards, initialisePlayersActiveCards, getPlayersPermanentCards, getPlayersActiveCards } = require('./playersCards');

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
            console.log(`User ${socket.id} with username ${data.username} has joined the lobby.`);
            io.in(data.password).emit("playerJoined", {users: users, numberOfPlayers: getNumberOfPlayers()});
        };
    });

    socket.on("startGame", (password) => {
        initialiseDeck(getNumberOfPlayers());
        shuffleDeck();
        initialisePlayerCards(getUsers());
        getDeck();
        io.in(password).emit("initialiseGame", getPlayerCards());
    });

    socket.on("submitPermanentCard", (data) => {
        initialisePlayersPermanentCards(socket.id, data);
        initialisePlayersActiveCards(socket.id, data);

        if(Object.keys(getPlayersPermanentCards()).length === getNumberOfPlayers()) {
            
        } else {
            for(const id in getPlayersPermanentCards()) {
                io.to(id).emit("waitingOnPlayerSubmitPermanentCard", getNumberOfPlayers()-Object.keys(getPlayersPermanentCards()).length);
            }
        };
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
        const foundUser = removeUser(socket.id);
        io.to(foundUser.password).emit("playerLeft", getUsers());
    });
});

server.listen(3001, () => {
    console.log("LISTENING ON PORT 3001");
});