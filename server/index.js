const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { addUser, findUserById, findUserByUsername, getUsers, removeUser, getNumberOfPlayers, getPlayerTurnIndex, initialiseEliminatedPlayers, nextPlayerIndex, eliminatePlayer } = require('./users');
const { initialiseDeck, shuffleDeck, initialisePlayerCards, getPlayerCards, getRemainingCards, getDiscardPile, discardCard, removePlayerCard, drawCard, updatePlayerCard, insertCard } = require('./deckOfCards');
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
            socket.to(data.password).emit("updateHistory", 
                `${playerName} tried to execute ${data.chosenPlayer} and succeeded. They guessed:
                Permanent Card: ${data.chosenPermanentCard}
                Active Card: ${data.chosenActiveCard}`);

            socket.emit("clearExecuteStates");
            socket.emit("notPlayerTurn", {history: `You successfully executed ${data.chosenPlayer}`});

            io.to(userId).emit("executeSuccess");
        } else {
            socket.to(data.password).emit("updateHistory", 
                `${playerName} tried to execute ${data.chosenPlayer} and failed. They guessed:
                Permanent Card: ${data.chosenPermanentCard}
                Active Card: ${data.chosenActiveCard}`)
            socket.emit("executeFailed");
        };
    });

    socket.on("executeFailedLoseCard", (data) => {
        discardCard(data.chosenCard);
        io.in(data.password).emit("updateDiscardPile", getDiscardPile());

        removePlayerCard(socket.id, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());

        socket.emit("clearExecuteStates");

        const playerName = findUserById(socket.id).username;
        if(getPlayerCards()[socket.id].length === 0) {
            setPlayerActiveCard(socket.id, "");
            socket.emit("updateActiveCard", "");

            const winner = eliminatePlayer(socket.id);
            if(winner) {
                io.in(data.password).emit("loseScreen", {winner: winner});
                io.to(winner.id).emit("winScreen");
            } else {
                nextPlayerIndex();
                io.in(data.password).emit("notPlayerTurn", {history: 
                    `${playerName} failed to execute and has been eliminated from the game. They discarded ${data.chosenCard}.
                    It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} failed to execute and has been eliminated from the game. They discarded ${data.chosenCard}.
                    It is your turn.`});                 
            };
        }  else {
            setPlayerPermanentCard(socket.id, "");
            socket.emit("updatePermanentCard", "");
            setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
            socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

            nextPlayerIndex();
            io.in(data.password).emit("notPlayerTurn", {history: 
                `${playerName} has lost a card slot due to failed execute. They discarded ${data.chosenCard}.
                It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
            io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} has lost a card slot due to failed execute. They discarded ${data.chosenCard}.
                It is your turn.`});  
        };      
    });

    socket.on("executeSuccessLoseCard", (data) => {
        discardCard(data.chosenCard);
        io.in(data.password).emit("updateDiscardPile", getDiscardPile());

        removePlayerCard(socket.id, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());

        setPlayerPermanentCard(socket.id, "");
        socket.emit("updatePermanentCard", "");
        setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
        socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

        const playerName = findUserById(socket.id).username;
        io.in(data.password).emit("updateHistory", `${playerName} was successfully executed and lost a card slot. They discarded ${data.chosenCard}. They now have the choice to draw a new card.`);

        socket.emit("executeSuccessChooseCardToDraw", {drawnCard: drawCard()});
    });

    socket.on("executeSuccessDrawCard", (data) => {
        if(data.chosenCard === data.activeCard) {
            insertCard(data.drawnCard);
            shuffleDeck();
        } else {
            updatePlayerCard(socket.id, data.activeCard, data.chosenCard);
            socket.emit("updatePlayerCards", getPlayerCards());

            setPlayerActiveCard(socket.id, data.chosenCard)
            socket.emit("updateActiveCard", data.chosenCard);

            insertCard(data.activeCard);
            shuffleDeck();
        }

        socket.emit("clearExecuteStates");

        nextPlayerIndex();
        io.in(data.password).emit("notPlayerTurn", {history: `It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: "It is your turn."});
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