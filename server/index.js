const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { addUser, findUserById, findUserByUsername, getUsers, removeUser, getNumberOfPlayers, getPlayerTurnIndex, initialiseEliminatedPlayers, nextPlayerIndex } = require('./users');
const { initialiseDeck, shuffleDeck, initialisePlayerCards, getPlayerCards, getRemainingCards, getDiscardPile, discardCard, removePlayerCard } = require('./deckOfCards');
const { initialisePlayersPermanentCards, initialisePlayersActiveCards, getPlayersPermanentCards, getPlayersActiveCards, setPlayerPermanentCard, setPlayerActiveCard } = require('./playersCards');

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
        initialiseEliminatedPlayers();
        io.in(password).emit("initialiseGame", {playerCards: getPlayerCards(), remainingCards: getRemainingCards(), discardPile: getDiscardPile()});
    });

    socket.on("submitPermanentCard", (data) => {
        initialisePlayersPermanentCards(socket.id, data);
        initialisePlayersActiveCards(socket.id, data);

        if(Object.keys(getPlayersPermanentCards()).length === getNumberOfPlayers()) {
            io.in(data.password).emit("notPlayerTurn", {history: `It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
            io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: "It is your turn"});
        } else {
            for(const id in getPlayersPermanentCards()) {
                io.to(id).emit("waitingOnPlayerSubmitPermanentCard", getNumberOfPlayers()-Object.keys(getPlayersPermanentCards()).length);
            }
        };
    });

    socket.on("executeConfirm", (data) => {
        const playerName = findUserById(socket.id).username;
        const userId= findUserByUsername(data.chosenPlayer).id;
        const playersPermanentCards = getPlayersPermanentCards();
        const playersActiveCards = getPlayersActiveCards();

        if(data.chosenPermanentCard === playersPermanentCards[userId] && data.chosenActiveCard === playersActiveCards[userId]) {
            //other player chooses a card to discard, then shuffles the non-discarded card into the deck and gets a new card, then goes to next player turn. Send history to all other players.
            console.log("to code: successful execute");
        } else {
            socket.to(data.password).emit("updateHistory", 
                `${playerName} tried to execute ${data.chosenPlayer} and failed. They guessed:
                Permanent Card: ${data.chosenPermanentCard}
                Active Card: ${data.chosenActiveCard}`)
            socket.emit("executeFailed");
        };
    });

    socket.on("executeLoseCard", (data) => {
        const playerName = findUserById(socket.id).username;
        socket.to(data.password).emit("updateHistory", 
            `${playerName} has lost a card slot due to failed execute.
            They discarded ${data.chosenCard}.`);

        discardCard(data.chosenCard);
        io.in(data.password).emit("updateDiscardPile", getDiscardPile());

        removePlayerCard(socket.id, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());

        setPlayerPermanentCard(socket.id, "");
        socket.emit("updatePermanentCard", "");
        setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
        socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

        socket.emit("clearExecuteStates");

        nextPlayerIndex();
        io.in(data.password).emit("notPlayerTurn", {history: `It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: "It is your turn"});        
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