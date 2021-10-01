const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { addUser, findUserById, findUserByUsername, getUsers, removeUser, getNumberOfPlayers, getPlayerTurnIndex, initialiseEliminatedPlayers, nextPlayerIndex, eliminatePlayer, initialisePlayersPassedChallenge, updatePlayersPassedChallenge, calculatePlayersWaiting, getPlayersPassedChallenge, resetPlayersPassedChallenge, setActionChosenPlayer, getActionChosenPlayer, getEliminatedPlayers } = require('./users');
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
    //listening for initial game setup
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
        initialisePlayersPassedChallenge();
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

    //listening for execute action
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

    //listening for draw action
    socket.on("drawAction", (data) => {
        socket.emit("drawActionChooseCardToDraw", {drawnCard: drawCard()});
        io.in(data.password).emit("updateRemainingCards", getRemainingCards());
    });

    socket.on("confirmNewCard", (data) => {
        if(data.chosenCard === data.activeCard) {
            discardCard(data.drawnCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());
        } else {
            discardCard(data.activeCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());
            
            updatePlayerCard(socket.id, data.activeCard, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());
            setPlayerActiveCard(socket.id, data.chosenCard);
            socket.emit("updateActiveCard", data.chosenCard);
        };
        
        socket.emit("chooseCharacterAction");
    });

    //listening for character actions
    socket.on("assassinChosePlayer", (data) => {
        for(let id in getEliminatedPlayers()) {
            if(!getEliminatedPlayers()[id]) {
                io.to(id).emit("challengeAction", {player: findUserById(socket.id), chosenPlayer: data.chosenPlayer, characterAction: "Assassin"});
            } else {
                io.to(id).emit("notPlayerTurn", {history: `${findUserById(socket.id).username} is using Assassin on ${data.chosenPlayer}. Waiting to see if other players will challenge.`});
            };
        };

        io.to(findUserByUsername(data.chosenPlayer).id).emit("countessAction", {player: findUserById(socket.id)});

        updatePlayersPassedChallenge(socket.id);
        socket.emit("updateHistory", `You are using Assassin on ${data.chosenPlayer}. Waiting to see if other players will challenge.`)
        socket.emit("challengeWait", {playersWaiting: calculatePlayersWaiting()});

        setActionChosenPlayer(data.chosenPlayer);
        //clearDrawAction, and clear opponent action for everyone at the finish of assassin action
        //clearPlayersWaiting when someone challenges, or opponent uses countess
    });

    socket.on("assassinGuessActiveCard", (data) => {
        const chosenPlayer = findUserByUsername(data.chosenPlayer);
        
        socket.emit("clearDrawStates");
        io.in(data.password).emit("clearPlayersWaiting");
        io.in(data.password).emit("clearOpponentAction");

        if(data.chosenCard === getPlayersActiveCards()[chosenPlayer.id]) {
            discardCard(data.chosenCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());

            removePlayerCard(chosenPlayer.id, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());

            const currentPlayer = findUserById(socket.id);
            if(getPlayerCards()[chosenPlayer.id].length === 0) {
                setPlayerActiveCard(chosenPlayer.id, "");
                io.to(chosenPlayer.id).emit("updateActiveCard", "");

                const winner = eliminatePlayer(chosenPlayer.id);
                if(winner) {
                    io.in(data.password).emit("loseScreen", {winner: winner});
                    io.to(winner.id).emit("winScreen");
                } else {
                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${currentPlayer.username} successfully assassinated ${chosenPlayer.username} who has been eliminated from the game. They discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} successfully assassinated ${chosenPlayer.username} who has been eliminated from the game. They discarded ${data.chosenCard}.
                        It is your turn.`}); 
                };
            } else {
                setPlayerPermanentCard(chosenPlayer.id, "");
                io.to(chosenPlayer.id).emit("updatePermanentCard", "");
                setPlayerActiveCard(chosenPlayer.id, getPlayerCards()[chosenPlayer.id][0]);
                io.to(chosenPlayer.id).emit("updateActiveCard", getPlayerCards()[chosenPlayer.id][0]);

                nextPlayerIndex();
                io.in(data.password).emit("notPlayerTurn", {history: 
                    `${currentPlayer.username} successfully assassinated ${chosenPlayer.username}. They discarded ${data.chosenCard}.
                    It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} successfully assassinated ${chosenPlayer.username}. They discarded ${data.chosenCard}.
                    It is your turn.`});  
            };
        } else {
            nextPlayerIndex();
            const currentPlayer = findUserById(socket.id);
            io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} failed to assassinate ${data.chosenPlayer}.
                ${currentPlayer.username} guessed that ${data.chosenPlayer}'s active card was ${data.chosenCard} and was incorrect.
                It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
            io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} failed to assassinate ${data.chosenPlayer}.
                ${currentPlayer.username} guessed that ${data.chosenPlayer}'s active card was ${data.chosenCard} and was incorrect.
                It is your turn.`});
        };
    });

    //listening for challenge actions
    socket.on("challengePass", (data) => {
        updatePlayersPassedChallenge(socket.id);
        let playersWaiting = calculatePlayersWaiting();
        if(playersWaiting === 0) {
            io.in(data.password).emit("updatePlayersWaiting", 0);
            resetPlayersPassedChallenge();

            const currentPlayer = getUsers()[getPlayerTurnIndex()];
            switch (data.opponentAction) {
                case "Assassin":
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} and was not challenged.
                        ${currentPlayer.username} is now guessing ${getActionChosenPlayer()}'s active card.`})
                    io.to(currentPlayer.id).emit("assassinGuessActiveCard");
                    setActionChosenPlayer("");
                    break;

                case "Prophet":
                    //server should keep track of opponent name for history msg and send nonPlayerTurn to all other players
                    console.log("Prophet");
                    break;

                case "Archmage":
                    //server should keep track of opponent name for history msg and send nonPlayerTurn to all other players
                    console.log("Archmage");
                    break;

                case "Rogue":
                    //server should keep track of opponent name for history msg and send nonPlayerTurn to all other players
                    console.log("Rogue");
                    break;

                default:
                    console.log("Error in challengePass.");
            };
        } else {
            let playersPassedChallenge = getPlayersPassedChallenge();
            for(let id in playersPassedChallenge) {
                if(playersPassedChallenge[id]) {
                    io.to(id).emit("challengeWait", {playersWaiting: playersWaiting});
                }
            };
        };
    });

    socket.on("challengeAction", (data) => {
        socket.emit("clearPlayersWaiting");
        resetPlayersPassedChallenge();

        const currentPlayer = getUsers()[getPlayerTurnIndex()];
        const challengePlayer = findUserById(socket.id);
        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used ${data.opponentAction} on ${getActionChosenPlayer()} and was challenged by ${challengePlayer.username}.
            ${currentPlayer.username} is now going to reveal a card.`})
        io.to(currentPlayer.id).emit("challengeReveal", {challengePlayer: challengePlayer});
        setActionChosenPlayer("");
    });

    socket.on("challengeReveal", (data) => {
        console.log(data.chosenPlayer);
        console.log(data.challengePlayer);
        console.log(data.chosenCard);
        console.log(data.opponentAction);

        if(data.opponentAction === data.chosenCard) {
            //win challenge, use the below lines to clear data at the end
            // socket.emit("clearDrawStates");
            // io.in(data.password).emit("clearOpponentAction");
            
        } else {
            socket.emit("clearDrawStates");
            io.in(data.password).emit("clearOpponentAction");

            discardCard(data.chosenCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());

            removePlayerCard(socket.id, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());

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
                        `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                        ${playerName} has been eliminated from the game.
                        ${playerName} discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                        ${playerName} has been eliminated from the game.
                        ${playerName} discarded ${data.chosenCard}.
                        It is your turn.`});                 
                };
            } else {
                setPlayerPermanentCard(socket.id, "");
                socket.emit("updatePermanentCard", "");
                setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
                socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

                nextPlayerIndex();
                io.in(data.password).emit("notPlayerTurn", {history: 
                    `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                    ${playerName} discarded ${data.chosenCard}.
                    It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                    `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                    ${playerName} discarded ${data.chosenCard}.
                    It is your turn.`}); 
            };
        };
    }); 

    //listening for client disconnect
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
        const foundUser = removeUser(socket.id);
        io.to(foundUser.password).emit("playerLeft", getUsers());
    });
});

server.listen(3001, () => {
    console.log("LISTENING ON PORT 3001");
});