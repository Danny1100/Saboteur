const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { addUser, findUserById, findUserByUsername, getUsers, removeUser, getNumberOfPlayers, getPlayerTurnIndex, initialiseEliminatedPlayers, nextPlayerIndex, eliminatePlayer, initialisePlayersPassedChallenge, updatePlayersPassedChallenge, calculatePlayersWaiting, getPlayersPassedChallenge, resetPlayersPassedChallenge, setActionChosenPlayer, getActionChosenPlayer, getEliminatedPlayers, initialiseUsersPlayAgain, getUsersPlayAgain, setUsersPlayAgain, getNumberOfUsersPlayAgain, resetUsersGameStates, initialiseNumberOfWins, getNumberOfWins, incrementWins, setGameStarted, fullResetUsers } = require('./users');
const { initialiseDeck, shuffleDeck, initialisePlayerCards, getPlayerCards, getRemainingCards, getDiscardPile, discardCard, removePlayerCard, drawCard, updatePlayerCard, insertCard, getDeck, findWinner, resetDeckOfCards, fullResetDeckOfCards } = require('./deckOfCards');
const { initialisePlayersPermanentCards, initialisePlayersActiveCards, getPlayersPermanentCards, getPlayersActiveCards, setPlayerPermanentCard, setPlayerActiveCard, resetPlayersCards } = require('./playersCards');

const PORT = process.env.PORT || 3001;

const router = require('./router');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // origin: "http://localhost:3000"
        origin: "https://ecstatic-boyd-abc2f3.netlify.app"
    }
});

app.use(router);

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

            console.log(getUsers());
        };
    });

    socket.on("startGame", (password) => {
        setGameStarted(true);

        initialiseDeck(getNumberOfPlayers());
        shuffleDeck();
        initialisePlayerCards(getUsers());
        initialiseEliminatedPlayers();
        initialisePlayersPassedChallenge();
        initialiseUsersPlayAgain();
        initialiseNumberOfWins();
        io.in(password).emit("initialiseGame", {playerCards: getPlayerCards(), remainingCards: getRemainingCards(), discardPile: getDiscardPile(), numberOfWins: getNumberOfWins()});

        console.log("The game has started.");
        console.log(getDeck());
    });

    socket.on("submitPermanentCard", (data) => {
        initialisePlayersPermanentCards(socket.id, data);
        initialisePlayersActiveCards(socket.id, data);

        if(Object.keys(getPlayersPermanentCards()).length === getNumberOfPlayers()) {
            io.in(data.password).emit("notPlayerTurn", {history: `It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
            io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: "It is your turn"});

            console.log(`${findUserById(socket.id).username} has selected ${data.permanentCard} as their permanent card. ${data.activeCard} is their active card.`);
            console.log("All players have submitted their permanent card.");
        } else {
            for(const id in getPlayersPermanentCards()) {
                io.to(id).emit("waitingOnPlayerSubmitPermanentCard", getNumberOfPlayers()-Object.keys(getPlayersPermanentCards()).length);

                console.log(`${findUserById(socket.id).username} has selected ${data.permanentCard} as their permanent card. ${data.activeCard} is their active card.`);
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

            console.log(`${playerName} tried to execute ${data.chosenPlayer} and succeeded. They guessed:
            Permanent Card: ${data.chosenPermanentCard}
            Active Card: ${data.chosenActiveCard}`);
        } else {
            socket.to(data.password).emit("updateHistory", 
                `${playerName} tried to execute ${data.chosenPlayer} and failed. They guessed:
                Permanent Card: ${data.chosenPermanentCard}
                Active Card: ${data.chosenActiveCard}`)
            socket.emit("executeFailed");

            console.log(`${playerName} tried to execute ${data.chosenPlayer} and failed. They guessed:
            Permanent Card: ${data.chosenPermanentCard}
            Active Card: ${data.chosenActiveCard}`);
        };
    });

    socket.on("executeFailedLoseCard", (data) => {
        if(data.chosenCard === "Saboteur") {
            insertCard(data.chosenCard);
            shuffleDeck();
            io.in(data.password).emit("updateRemainingCards", getRemainingCards());
        } else {
            discardCard(data.chosenCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());
        };

        removePlayerCard(socket.id, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());

        socket.emit("clearExecuteStates");

        const playerName = findUserById(socket.id).username;
        if(getPlayerCards()[socket.id].length === 0) {
            setPlayerActiveCard(socket.id, "");
            socket.emit("updateActiveCard", "");

            const winner = eliminatePlayer(socket.id);
            if(winner) {
                incrementWins(winner.id);
                io.in(data.password).emit("updateNumberOfWins", getNumberOfWins());
                io.in(data.password).emit("loseScreen", {winner: winner});
                io.to(winner.id).emit("winScreen");

                console.log(`${winner.username} won the game.`);
            } else {
                nextPlayerIndex();

                if(data.chosenCard === "Saboteur") {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${playerName} failed to execute and has been eliminated from the game. They shuffled ${data.chosenCard} back into the deck.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} failed to execute and has been eliminated from the game. 
                        They shuffled ${data.chosenCard} back into the deck.
                        It is your turn.`});

                    console.log(`${playerName} failed to execute and has been eliminated from the game. 
                    They shuffled ${data.chosenCard} back into the deck.`);
                    console.log(getDeck());
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${playerName} failed to execute and has been eliminated from the game. They discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} failed to execute and has been eliminated from the game. They discarded ${data.chosenCard}.
                        It is your turn.`});

                    console.log(`${playerName} failed to execute and has been eliminated from the game. They discarded ${data.chosenCard}.`);
                };
                                 
            };
        }  else {
            setPlayerPermanentCard(socket.id, "");
            socket.emit("updatePermanentCard", "");
            setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
            socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

            nextPlayerIndex();

            if(data.chosenCard === "Saboteur") {
                io.in(data.password).emit("notPlayerTurn", {history: 
                    `${playerName} has lost a card slot due to failed execute. They shuffled ${data.chosenCard} back into the deck.
                    It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} has lost a card slot due to failed execute. 
                    They shuffled ${data.chosenCard} back into the deck.
                    It is your turn.`});  

                console.log(`${playerName} failed to execute and lost a card slot. 
                They shuffled ${data.chosenCard} back into the deck.`);
                console.log(getDeck());
            } else {
                io.in(data.password).emit("notPlayerTurn", {history: 
                    `${playerName} has lost a card slot due to failed execute. They discarded ${data.chosenCard}.
                    It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} has lost a card slot due to failed execute. They discarded ${data.chosenCard}.
                    It is your turn.`});  

                console.log(`${playerName} failed to execute and lost a card slot. 
                They discarded ${data.chosenCard}.`);
            };
            
        };      
    });

    socket.on("executeSuccessLoseCard", (data) => {
        if(data.chosenCard === "Saboteur") {
            insertCard(data.chosenCard);
            shuffleDeck();
            io.in(data.password).emit("updateRemainingCards", getRemainingCards());
        } else {
            discardCard(data.chosenCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());
        };
        
        removePlayerCard(socket.id, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());

        setPlayerPermanentCard(socket.id, "");
        socket.emit("updatePermanentCard", "");
        setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
        socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

        const playerName = findUserById(socket.id).username;
        if(data.chosenCard === "Saboteur") {
            io.in(data.password).emit("updateHistory", `${playerName} was successfully executed and lost a card slot. 
                They shuffled ${data.chosenCard} back into the deck. 
                They now have the choice to draw a new card.`);

                console.log(`${playerName} was successfully executed and lost a card slot. 
                They shuffled ${data.chosenCard} back into the deck.`);
        } else {
            io.in(data.password).emit("updateHistory", `${playerName} was successfully executed and lost a card slot. They discarded ${data.chosenCard}. They now have the choice to draw a new card.`);

            console.log(`${playerName} was successfully executed and lost a card slot. They discarded ${data.chosenCard}.`);
        };
        
        socket.emit("executeSuccessChooseCardToDraw", {drawnCard: drawCard()});
    });

    socket.on("executeSuccessDrawCard", (data) => {
        if(data.chosenCard === data.activeCard) {
            insertCard(data.drawnCard);
            shuffleDeck();

            console.log(`They kept ${data.activeCard} as their active card.`);
        } else {
            updatePlayerCard(socket.id, data.activeCard, data.chosenCard);
            socket.emit("updatePlayerCards", getPlayerCards());

            setPlayerActiveCard(socket.id, data.chosenCard)
            socket.emit("updateActiveCard", data.chosenCard);

            insertCard(data.activeCard);
            shuffleDeck();

            console.log(`Their new active card is ${data.drawnCard}.`);
        }

        socket.emit("clearExecuteStates");

        nextPlayerIndex();
        io.in(data.password).emit("notPlayerTurn", {history: `It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: "It is your turn."});
    });

    //listening for draw action
    socket.on("drawAction", (data) => {
        socket.emit("drawActionNewCard", {drawnCard: drawCard()});
        io.in(data.password).emit("updateRemainingCards", getRemainingCards());
    });

    socket.on("confirmNewCard", (data) => {
        if(data.activeCard === "Saboteur") {
            discardCard(data.drawnCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());
            io.in(data.password).emit("updateHistory", `${findUserById(socket.id).username} drew a card and discarded ${data.drawnCard}`);

            console.log(`${findUserById(socket.id).username} drew a ${data.drawnCard} and discarded it because they hold Saboteur`);
        } else {
            discardCard(data.activeCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());
            
            updatePlayerCard(socket.id, data.activeCard, data.drawnCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());
            setPlayerActiveCard(socket.id, data.drawnCard);
            socket.emit("updateActiveCard", data.drawnCard);
            io.in(data.password).emit("updateHistory", `${findUserById(socket.id).username} drew a card and discarded ${data.activeCard}`);

            console.log(`${findUserById(socket.id).username} drew ${data.drawnCard} and discarded ${data.activeCard}`);
        };

        if(getRemainingCards() === 0) {
            const winner = findUserById(findWinner());
            incrementWins(winner.id);
            io.in(data.password).emit("updateNumberOfWins", getNumberOfWins());
            io.in(data.password).emit("loseScreen", {winner: winner});
            io.to(winner.id).emit("winScreen");

            console.log(`No cards left. ${winner.username} won.`);
        } else {
            socket.emit("chooseCharacterAction");
        }
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

        console.log(`${findUserById(socket.id).username} is using Assassin on ${data.chosenPlayer}.`);
    });

    socket.on("assassinGuessActiveCard", (data) => {
        const chosenPlayer = findUserByUsername(data.chosenPlayer);
        
        socket.emit("clearDrawStates");
        io.in(data.password).emit("clearPlayersWaiting");
        io.in(data.password).emit("clearOpponentAction");

        if(data.chosenCard === getPlayersActiveCards()[chosenPlayer.id]) {
            if(data.chosenCard === "Saboteur") {
                insertCard(data.chosenCard);
                shuffleDeck();
                io.in(data.password).emit("updateRemainingCards", getRemainingCards());
            } else {
                discardCard(data.chosenCard);
                io.in(data.password).emit("updateDiscardPile", getDiscardPile());
            };

            removePlayerCard(chosenPlayer.id, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());

            const currentPlayer = findUserById(socket.id);
            if(getPlayerCards()[chosenPlayer.id].length === 0) {
                setPlayerActiveCard(chosenPlayer.id, "");
                io.to(chosenPlayer.id).emit("updateActiveCard", "");

                const winner = eliminatePlayer(chosenPlayer.id);
                if(winner) {
                    incrementWins(winner.id);
                    io.in(data.password).emit("updateNumberOfWins", getNumberOfWins());
                    io.in(data.password).emit("loseScreen", {winner: winner});
                    io.to(winner.id).emit("winScreen");

                    console.log(`${currentPlayer.username} successfully assassinated ${chosenPlayer.username} guessing ${data.chosenCard}.
                                ${winner.username} has won the game.`);
                } else {
                    nextPlayerIndex();

                    if(data.chosenCard === "Saboteur") {
                        io.in(data.password).emit("notPlayerTurn", {history: 
                            `${currentPlayer.username} successfully assassinated ${chosenPlayer.username} who has been eliminated from the game. 
                            They shuffled ${data.chosenCard} back into the deck.
                            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} successfully assassinated ${chosenPlayer.username} who has been eliminated from the game. 
                            They shuffled ${data.chosenCard} back into the deck.
                            It is your turn.`}); 
                    } else {
                        io.in(data.password).emit("notPlayerTurn", {history: 
                            `${currentPlayer.username} successfully assassinated ${chosenPlayer.username} who has been eliminated from the game. They discarded ${data.chosenCard}.
                            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} successfully assassinated ${chosenPlayer.username} who has been eliminated from the game. They discarded ${data.chosenCard}.
                            It is your turn.`}); 
                    };

                    console.log(`${currentPlayer.username} successfully assassinated ${chosenPlayer.username} guessing ${data.chosenCard}.
                                ${chosenPlayer.username} has been eliminated.`);
                };
            } else {
                setPlayerPermanentCard(chosenPlayer.id, "");
                io.to(chosenPlayer.id).emit("updatePermanentCard", "");
                setPlayerActiveCard(chosenPlayer.id, getPlayerCards()[chosenPlayer.id][0]);
                io.to(chosenPlayer.id).emit("updateActiveCard", getPlayerCards()[chosenPlayer.id][0]);

                nextPlayerIndex();

                if(data.chosenCard === "Saboteur") {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${currentPlayer.username} successfully assassinated ${chosenPlayer.username}. 
                        They shuffled ${data.chosenCard} back into the deck.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} successfully assassinated ${chosenPlayer.username}. 
                        They shuffled ${data.chosenCard} back into the deck.
                        It is your turn.`});
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${currentPlayer.username} successfully assassinated ${chosenPlayer.username}. They discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} successfully assassinated ${chosenPlayer.username}. They discarded ${data.chosenCard}.
                        It is your turn.`});
                };

                console.log(`${currentPlayer.username} successfully assassinated ${chosenPlayer.username} guessing ${data.chosenCard}.`);
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

            console.log(`${currentPlayer.username} failed to assassinate ${data.chosenPlayer}. Their guess was ${data.chosenCard}.`);
        };
    });

    socket.on("countessAction", (data) => {
        io.in(data.password).emit("clearPlayersWaiting");
        resetPlayersPassedChallenge();

        const currentPlayer = getUsers()[getPlayerTurnIndex()];
        for(let id in getEliminatedPlayers()) {
            if(!getEliminatedPlayers()[id] && id !== socket.id) {
                io.to(id).emit("challengeAction", {player: findUserById(socket.id), currentPlayer: currentPlayer, characterAction: "Countess"});
            } else {
                io.to(id).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${findUserById(socket.id).username}. 
                    ${findUserById(socket.id).username} is using Countess to block assassination.
                    Waiting to see if other players will challenge.`});
            };
        };

        updatePlayersPassedChallenge(socket.id);
        socket.emit("updateHistory", `${currentPlayer.username} used Assassin on you. 
            You called Countess to block.
            Waiting to see if other players will challenge.`)
        socket.emit("challengeWait", {playersWaiting: calculatePlayersWaiting()});

        console.log(`${findUserById(socket.id).username} is using Countess to block assassination.`);
    });

    socket.on("prophetAction", () => {
        for(let id in getEliminatedPlayers()) {
            if(!getEliminatedPlayers()[id]) {
                io.to(id).emit("challengeAction", {player: findUserById(socket.id), characterAction: "Prophet"});
            } else {
                io.to(id).emit("notPlayerTurn", {history: `${findUserById(socket.id).username} is using Prophet. Waiting to see if other players will challenge.`});
            };
        };

        updatePlayersPassedChallenge(socket.id);
        socket.emit("updateHistory", `You are using Prophet. Waiting to see if other players will challenge.`)
        socket.emit("challengeWait", {playersWaiting: calculatePlayersWaiting()});

        console.log(`${findUserById(socket.id).username} is using Prophet.`);
    });

    socket.on("prophetFinishSeeingCards", (data) => {
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("clearDrawStates");
        io.in(data.password).emit("clearPlayersWaiting");
        io.in(data.password).emit("clearOpponentAction");
        resetPlayersPassedChallenge();

        nextPlayerIndex();
        const currentPlayer = findUserById(socket.id);
        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Prophet and looked at the top two cards in the deck.
            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} used Prophet and looked at the top two cards in the deck.
            It is your turn.`});
    });

    socket.on("archmageChosePlayer", (data) => {
        for(let id in getEliminatedPlayers()) {
            if(!getEliminatedPlayers()[id]) {
                io.to(id).emit("challengeAction", {player: findUserById(socket.id), chosenPlayer: data.chosenPlayer, characterAction: "Archmage"});
            } else {
                io.to(id).emit("notPlayerTurn", {history: `${findUserById(socket.id).username} is using Archmage on ${data.chosenPlayer}. Waiting to see if other players will challenge.`});
            };
        };

        updatePlayersPassedChallenge(socket.id);
        socket.emit("updateHistory", `You are using Archmage on ${data.chosenPlayer}. Waiting to see if other players will challenge.`)
        socket.emit("challengeWait", {playersWaiting: calculatePlayersWaiting()});

        setActionChosenPlayer(data.chosenPlayer);

        console.log(`${findUserById(socket.id).username} is using Archmage on ${data.chosenPlayer}.`);
    });

    socket.on("rogueChosePlayer", (data) => {
        for(let id in getEliminatedPlayers()) {
            if(!getEliminatedPlayers()[id]) {
                io.to(id).emit("challengeAction", {player: findUserById(socket.id), chosenPlayer: data.chosenPlayer, characterAction: "Rogue"});
            } else {
                io.to(id).emit("notPlayerTurn", {history: `${findUserById(socket.id).username} is using Rogue on ${data.chosenPlayer}. Waiting to see if other players will challenge.`});
            };
        };

        updatePlayersPassedChallenge(socket.id);
        socket.emit("updateHistory", `You are using Rogue on ${data.chosenPlayer}. Waiting to see if other players will challenge.`)
        socket.emit("challengeWait", {playersWaiting: calculatePlayersWaiting()});

        setActionChosenPlayer(data.chosenPlayer);

        console.log(`${findUserById(socket.id).username} is using Rogue on ${data.chosenPlayer}.`);
    });

    socket.on("rogueFinishSeeingCard", (data) => {
        updatePlayersPassedChallenge(socket.id);
        let playersWaiting = calculatePlayersWaiting();
        if(playersWaiting === 1) {
            io.in(data.password).emit("clearDrawStates");
            io.in(data.password).emit("clearPlayersWaiting");
            io.in(data.password).emit("clearOpponentAction");
            resetPlayersPassedChallenge();

            nextPlayerIndex();
            const currentPlayer = findUserById(socket.id);
            io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue on ${data.chosenPlayer} who revealed their active card.
                It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
            io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} used Rogue on ${data.chosenPlayer} who revealed their active card.
                It is your turn.`});
                
            console.log(`${findUserById(socket.id).username} has finished looking. All players done, next player turn.`);
        } else {
            let playersPassedChallenge = getPlayersPassedChallenge();
            for(let id in playersPassedChallenge) {
                if(playersPassedChallenge[id]) {
                    io.to(id).emit("rogueWait", {playersWaiting: playersWaiting-1});
                }
            };

            console.log(`${findUserById(socket.id).username} has finished looking. Waiting on ${playersWaiting-1} players.`);
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
                        ${currentPlayer.username} is now guessing ${getActionChosenPlayer()}'s active card.`});
                    io.to(currentPlayer.id).emit("assassinGuessActiveCard");
                    break;

                case "Countess":
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("clearDrawStates");
                    io.in(data.password).emit("clearPlayersWaiting");
                    io.in(data.password).emit("clearOpponentAction");
                    resetPlayersPassedChallenge();

                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()}.
                        ${getActionChosenPlayer()} called Countess to block the assassination and was not challenged.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()}.
                        ${getActionChosenPlayer()} called Countess to block the assassination and was not challenged.
                        It is your turn.`})

                    break;

                case "Prophet":
                    const deck = getDeck();
                    if(getRemainingCards() !== 1) {
                        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Prophet and was not challenged.
                            ${currentPlayer.username} is now looking at the top two cards in the deck.`});

                        io.to(currentPlayer.id).emit("prophetSeeCards", {history: `You used Prophet and were not challenged.`, topCard: deck[0], secondCard: deck[1]});
                    } else {
                        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Prophet and was not challenged.
                            ${currentPlayer.username} is now looking at the last card in the deck.`});

                        io.to(currentPlayer.id).emit("prophetSeeCards", {history: `You used Prophet and were not challenged. There is only one card left in the deck.`, topCard: deck[0]});
                    }
                    break;

                case "Archmage":
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} and was not challenged.
                        ${currentPlayer.username} and ${getActionChosenPlayer()} have swapped active cards.`});

                    const playerActiveCard = getPlayersActiveCards()[currentPlayer.id];
                    const opponentActiveCard = getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id];

                    setPlayerActiveCard(currentPlayer.id, opponentActiveCard);
                    setPlayerActiveCard(findUserByUsername(getActionChosenPlayer()).id, playerActiveCard);
                    io.to(currentPlayer.id).emit("updateActiveCard", getPlayersActiveCards()[currentPlayer.id]);
                    io.to(findUserByUsername(getActionChosenPlayer()).id).emit("updateActiveCard", getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id]);
                    
                    updatePlayerCard(currentPlayer.id, playerActiveCard, opponentActiveCard);
                    updatePlayerCard(findUserByUsername(getActionChosenPlayer()).id, opponentActiveCard, playerActiveCard);
                    io.in(data.password).emit("updatePlayerCards", getPlayerCards());

                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} and was not challenged.
                        ${currentPlayer.username} and ${getActionChosenPlayer()} have swapped active cards.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} and was not challenged.
                        ${currentPlayer.username} and ${getActionChosenPlayer()} have swapped active cards.
                        It is your turn.`})

                    break;

                case "Rogue":
                    for(let id in getEliminatedPlayers()) {
                        if(!getEliminatedPlayers()[id] && findUserByUsername(getActionChosenPlayer()).id !== id && currentPlayer.id !== id) {
                            io.to(id).emit("rogueSeeActiveCard", {history: `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} and wasn't challenged.`,
                                topCard: getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id], 
                                chosenPlayer: getActionChosenPlayer()});
                        } else if(findUserByUsername(getActionChosenPlayer()).id === id) {
                            io.to(id).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue on you and wasn't challenged. 
                                The other players are looking at your active card.`});
                        } else if(currentPlayer.id === id) {
                            io.to(id).emit("rogueSeeActiveCard", {history: `You used Rogue on ${getActionChosenPlayer()} and weren't challenged.`,
                                topCard: getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id], 
                                chosenPlayer: getActionChosenPlayer()});
                        } else {
                            io.to(id).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} and wasn't challenged. 
                                ${getActionChosenPlayer()}'s active card is ${getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id]}.`});
                        };
                    };
                    
                    break;

                default:
                    console.log("Error in challengePass.");
            };

            setActionChosenPlayer("");

            console.log(`${findUserById(socket.id).username} has passed. All players have passed.`);
        } else {
            let playersPassedChallenge = getPlayersPassedChallenge();
            for(let id in playersPassedChallenge) {
                if(playersPassedChallenge[id]) {
                    io.to(id).emit("challengeWait", {playersWaiting: playersWaiting});
                }
            };

            console.log(`${findUserById(socket.id).username} has passed. Waiting on ${playersWaiting} players.`);
        };
    });

    socket.on("challengeAction", (data) => {
        io.in(data.password).emit("clearPlayersWaiting");
        resetPlayersPassedChallenge();

        const currentPlayer = getUsers()[getPlayerTurnIndex()];
        const challengePlayer = findUserById(socket.id);
        if(data.opponentAction === "Assassin" || data.opponentAction === "Rogue" || data.opponentAction === "Archmage") {
            io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used ${data.opponentAction} on ${getActionChosenPlayer()} and was challenged by ${challengePlayer.username}.
                ${currentPlayer.username} is now going to reveal a card.`})
            io.to(currentPlayer.id).emit("updateHistory", `You used ${data.opponentAction} on ${getActionChosenPlayer()} and ${challengePlayer.username} challenged you.
                Choose a card to reveal.`);
            io.to(currentPlayer.id).emit("challengeReveal", {challengePlayer: challengePlayer, action: data.opponentAction});
        } else if (data.opponentAction === "Countess") {
            const countessPlayer = findUserByUsername(getActionChosenPlayer());
            io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} and ${getActionChosenPlayer()} called Countess.
                ${getActionChosenPlayer()} was challenged and is now going to reveal a card.`});
            io.to(countessPlayer.id).emit("updateHistory", `${currentPlayer.username} used Assassin on you and you called Countess. 
                ${challengePlayer.username} challenged your Countess.
                Choose a card to reveal:`)
            io.to(countessPlayer.id).emit("challengeReveal", {challengePlayer: challengePlayer, action: "Countess"});
        } else {
            io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used ${data.opponentAction} and was challenged by ${challengePlayer.username}.
                ${currentPlayer.username} is now going to reveal a card.`})
            io.to(currentPlayer.id).emit("updateHistory", `You used ${data.opponentAction} and ${challengePlayer.username} challenged you.
                Choose a card to reveal.`);
            io.to(currentPlayer.id).emit("challengeReveal", {challengePlayer: challengePlayer, action: data.opponentAction});
        };

        console.log(`${challengePlayer.username} challenged.`);
    });

    socket.on("challengeReveal", (data) => {
        if(data.opponentAction === data.chosenCard) {
            const currentPlayer = findUserById(socket.id);
            if(data.opponentAction === "Assassin" || data.opponentAction === "Rogue") {
                io.in(data.password).emit("updateHistory", `${currentPlayer.username} used ${data.opponentAction} on ${data.chosenPlayer} and was challenged by ${data.challengePlayer}.
                    ${currentPlayer.username} was holding ${data.opponentAction} and won the challenge.
                    ${data.challengePlayer} is choosing a card to discard.`);
                io.to(socket.id).emit("notPlayerTurn", {history: `${currentPlayer.username} used ${data.opponentAction} on ${data.chosenPlayer} and was challenged by ${data.challengePlayer}.
                    ${currentPlayer.username} was holding ${data.opponentAction} and won the challenge.
                    ${data.challengePlayer} is choosing a card to discard.`});
            } else {
                io.in(data.password).emit("updateHistory", `${currentPlayer.username} used ${data.opponentAction} and was challenged by ${data.challengePlayer}.
                    ${currentPlayer.username} was holding ${data.opponentAction} and won the challenge.
                    ${data.challengePlayer} is choosing a card to discard.`);
                io.to(socket.id).emit("notPlayerTurn", {history: `${currentPlayer.username} used ${data.opponentAction} and was challenged by ${data.challengePlayer}.
                    ${currentPlayer.username} was holding ${data.opponentAction} and won the challenge.
                    ${data.challengePlayer} is choosing a card to discard.`});
            };
            
            io.to(findUserByUsername(data.challengePlayer).id).emit("loseChallenge");

            console.log(`${currentPlayer.username} revealed ${data.opponentAction} and won the challenge.`);
        } else {
            socket.emit("clearDrawStates");
            io.in(data.password).emit("clearOpponentAction");

            const playerName = findUserById(socket.id).username;
            let discardedMessage = `${playerName} discarded ${data.chosenCard}.`
            if(data.chosenCard === "Saboteur") {
                insertCard(data.chosenCard);
                shuffleDeck();
                io.in(data.password).emit("updateRemainingCards", getRemainingCards());

                discardedMessage = `${playerName} shuffled ${data.chosenCard} back into the deck.`

                console.log(`${playerName} revealed ${data.chosenCard} and lost the challenge.`);
                console.log(getDeck());
            } else {
                discardCard(data.chosenCard);
                io.in(data.password).emit("updateDiscardPile", getDiscardPile());

                console.log(`${playerName} revealed ${data.chosenCard} and lost the challenge.`);
            };

            removePlayerCard(socket.id, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());

            if(getPlayerCards()[socket.id].length === 0) {
                setPlayerActiveCard(socket.id, "");
                socket.emit("updateActiveCard", "");

                const winner = eliminatePlayer(socket.id);
                if(winner) {
                    incrementWins(winner.id);
                    io.in(data.password).emit("updateNumberOfWins", getNumberOfWins());
                    io.in(data.password).emit("loseScreen", {winner: winner});
                    io.to(winner.id).emit("winScreen");

                    console.log(`${winner.username} has won.`);
                } else {
                    nextPlayerIndex();
                    if(data.opponentAction === "Assassin" || data.opponentAction === "Rogue") {
                        io.in(data.password).emit("notPlayerTurn", {history: 
                            `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                            ${playerName} has been eliminated from the game.
                            ${discardedMessage}
                            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                            `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. ${playerName} has been eliminated from the game.
                            ${discardedMessage}
                            It is your turn.`});
                    } else {
                        io.in(data.password).emit("notPlayerTurn", {history: 
                            `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. 
                            ${playerName} has been eliminated from the game.
                            ${discardedMessage}
                            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                            `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. ${playerName} has been eliminated from the game.
                            ${discardedMessage}
                            It is your turn.`});
                    };  
                    
                    console.log(`${playerName} has been eliminated.`);
                };
            } else {
                setPlayerPermanentCard(socket.id, "");
                socket.emit("updatePermanentCard", "");
                setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
                socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

                nextPlayerIndex();
                if(data.opponentAction === "Assassin" || data.opponentAction === "Rogue") {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                        ${discardedMessage}
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                        ${discardedMessage}
                        It is your turn.`}); 
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. 
                        ${discardedMessage}
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. 
                        ${discardedMessage}
                        It is your turn.`}); 
                };
            };
            setActionChosenPlayer("");
        };
    }); 

    socket.on("challengeCountessReveal", (data) => {
        const currentPlayer = getUsers()[getPlayerTurnIndex()];
        const countessPlayer = getActionChosenPlayer();
        const challengePlayer = data.challengePlayer;

        if(data.chosenCard === "Countess") {
            io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${countessPlayer} and ${countessPlayer} called Countess.
                ${challengePlayer} challenged ${countessPlayer}'s Countess and lost.
                ${challengePlayer} is now choosing a card to discard.`});

            io.to(findUserByUsername(challengePlayer).id).emit("loseCountessChallenge");

            console.log(`${challengePlayer} challenged ${countessPlayer}'s Countess and lost.`);
        } else {
            let discardedMessage = `${countessPlayer} discarded ${data.chosenCard}.`
            if(data.chosenCard === "Saboteur") {
                insertCard(data.chosenCard);
                shuffleDeck();
                io.in(data.password).emit("updateRemainingCards", getRemainingCards());

                discardedMessage = `${countessPlayer} shuffled ${data.chosenCard} back into the deck.`

                console.log(`${countessPlayer}'s countess was challenged and they lost. They shuffled ${data.chosenCard} back into the deck.`);
                console.log(getDeck());
            } else {
                discardCard(data.chosenCard);
                io.in(data.password).emit("updateDiscardPile", getDiscardPile());

                console.log(`${countessPlayer}'s countess was challenged and they lost. They discarded ${data.chosenCard}.`);
            };

            removePlayerCard(socket.id, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());

            if(getPlayerCards()[socket.id].length === 0) {
                setPlayerActiveCard(socket.id, "");
                socket.emit("updateActiveCard", "");

                const winner = eliminatePlayer(socket.id);
                if(winner) {
                    incrementWins(winner.id);
                    io.in(data.password).emit("updateNumberOfWins", getNumberOfWins());
                    io.in(data.password).emit("loseScreen", {winner: winner});
                    io.to(winner.id).emit("winScreen");

                    console.log(`${winner.username} has won.`)
                } else {
                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${currentPlayer.username} used Assassin on ${countessPlayer} who called Countess.
                        ${challengePlayer} challenged ${countessPlayer}'s Countess and won the challenge.
                        ${countessPlayer} has been eliminated from the game.
                        ${discardedMessage}
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${currentPlayer.username} used Assassin on ${countessPlayer} who called Countess. ${challengePlayer} challenged ${countessPlayer}'s Countess and won the challenge.
                        ${countessPlayer} has been eliminated from the game. ${discardedMessage}
                        It is your turn.`});  
                        
                    console.log(`${countessPlayer} has been eliminated from the game.`);
                };
                socket.emit("clearDrawStates");
                io.to(currentPlayer.id).emit("clearDrawStates");
                io.in(data.password).emit("clearPlayersWaiting");
                io.in(data.password).emit("clearOpponentAction");
            } else {
                setPlayerPermanentCard(socket.id, "");
                socket.emit("updatePermanentCard", "");
                setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
                socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

                io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${countessPlayer} who called Countess.
                    ${challengePlayer} challenged ${countessPlayer}'s Countess and won the challenge.
                    ${discardedMessage}
                    ${currentPlayer.username} is now guessing ${countessPlayer}'s active card.`})

                socket.emit("clearDrawStates");

                io.to(currentPlayer.id).emit("assassinGuessActiveCard");
            };

            setActionChosenPlayer("");
        };
    });

    socket.on("loseChallengeChoseCard", (data) => {
        const challengePlayer = findUserById(socket.id);
        let discardedMessage = `${challengePlayer.username} discarded ${data.chosenCard}.`
        let playerDiscardMessage = `You discarded ${data.chosenCard}.`
        if(data.chosenCard === "Saboteur") {
            insertCard(data.chosenCard);
            shuffleDeck();
            io.in(data.password).emit("updateRemainingCards", getRemainingCards());

            discardedMessage = `${challengePlayer.username} shuffled ${data.chosenCard} back into the deck.`
            playerDiscardMessage = `You shuffled ${data.chosenCard} back into the deck.`

            console.log(`${challengePlayer.username} lost the challenge and shuffled ${data.chosenCard} back into the deck.`);
        } else {
            discardCard(data.chosenCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());

            console.log(`${challengePlayer.username} lost the challenge and discarded ${data.chosenCard}.`);
        };

        removePlayerCard(socket.id, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());

        let currentPlayer = getUsers()[getPlayerTurnIndex()];
        if(data.opponentAction === "Countess") {
            currentPlayer = findUserByUsername(getActionChosenPlayer());
        }

        if(getPlayerCards()[socket.id].length === 0) {
            setPlayerActiveCard(socket.id, "");
            socket.emit("updateActiveCard", "");

            const winner = eliminatePlayer(socket.id);
            if(winner) {
                incrementWins(winner.id);
                io.in(data.password).emit("updateNumberOfWins", getNumberOfWins());
                io.in(data.password).emit("loseScreen", {winner: winner});
                io.to(winner.id).emit("winScreen");

                console.log(`${winner.username} has won.`);
            } else {
                io.in(data.password).emit("updateHistory", `${challengePlayer.username} challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                    ${discardedMessage}
                    ${challengePlayer.username} was eliminated from the game.
                    ${currentPlayer.username} now has the choice to replace their ${data.opponentAction} with a new card.`);
                socket.emit("notPlayerTurn", {history: `You challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                    ${playerDiscardMessage}
                    You have been eliminated from the game.
                    ${currentPlayer.username} now has the choice to replace their ${data.opponentAction} with a new card.`})

                if(data.opponentAction !== "Countess") {
                    io.to(currentPlayer.id).emit("challengeWonDrawCard", {drawnCard: drawCard()});
                } else {
                    io.to(currentPlayer.id).emit("challengeCountessWonDrawCard", {drawnCard: drawCard()});
                };

                console.log(`${challengePlayer.username} was eliminated from the game.`);
            };
        } else {
            setPlayerPermanentCard(socket.id, "");
            socket.emit("updatePermanentCard", "");
            setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
            socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

            io.in(data.password).emit("updateHistory", `${challengePlayer.username} challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                ${discardedMessage}
                ${currentPlayer.username} now has the choice to replace their ${data.opponentAction} with a new card.`);
            socket.emit("notPlayerTurn", {history: `You challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                ${playerDiscardMessage}
                ${currentPlayer.username} now has the choice to replace their ${data.opponentAction} with a new card.`})

            if(data.opponentAction !== "Countess") {
                io.to(currentPlayer.id).emit("challengeWonDrawCard", {drawnCard: drawCard()});
            } else {
                io.to(currentPlayer.id).emit("challengeCountessWonDrawCard", {drawnCard: drawCard()});
            };
        };            
    });

    socket.on("challengeWonDrawCard", (data) => {
        if(data.chosenCard !== data.opponentAction) {
            updatePlayerCard(socket.id, data.opponentAction, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());

            if(getPlayersActiveCards()[socket.id] === data.opponentAction) {
                setPlayerActiveCard(socket.id, data.chosenCard);
                socket.emit("updateActiveCard", data.chosenCard);

                console.log(`${findUserById(socket.id).username} won the challenge and replaced their active card with ${data.chosenCard}.`);
            } else {
                setPlayerPermanentCard(socket.id, data.chosenCard);
                socket.emit("updatePermanentCard", data.chosenCard);

                console.log(`${findUserById(socket.id).username} won the challenge and replaced their permanent card with ${data.chosenCard}.`);
            };

            insertCard(data.opponentAction);
            shuffleDeck();
            io.in(data.password).emit("updateRemainingCards", getRemainingCards());
        } else {
            insertCard(data.drawnCard);
            shuffleDeck();
            io.in(data.password).emit("updateRemainingCards", getRemainingCards());

            console.log(`${findUserById(socket.id).username} won the challenge and did not replace their cards.`);
        };
        
        const currentPlayer = getUsers()[getPlayerTurnIndex()];
        const chosenPlayer = findUserByUsername(getActionChosenPlayer());
        switch (data.opponentAction) {
            case "Assassin":
                const chosenPlayerId = findUserByUsername(getActionChosenPlayer()).id;
                if(getEliminatedPlayers()[chosenPlayerId]) {
                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} who challenged.
                        ${getActionChosenPlayer()} lost the challenge and has been eliminated from the game.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} who challenged.
                        ${getActionChosenPlayer()} lost the challenge and has been eliminated from the game.
                        It is your turn.`});

                    socket.emit("clearDrawStates");
                    io.in(data.password).emit("clearOpponentAction");
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} and was challenged by ${data.challengePlayer}.
                        ${currentPlayer.username} had an Assassin and won the challenge.
                        ${currentPlayer.username} is now guessing ${getActionChosenPlayer()}'s active card.`})
                    io.to(currentPlayer.id).emit("assassinGuessActiveCard");
                };
                break;

            case "Countess":
                socket.emit("clearDrawStates");
                io.to(currentPlayer.id).emit("clearDrawStates");
                io.in(data.password).emit("clearPlayersWaiting");
                io.in(data.password).emit("clearOpponentAction");

                nextPlayerIndex();
                io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} who called Countess.
                    ${getActionChosenPlayer()}'s Countess was challenged by ${data.challengePlayer}.
                    ${getActionChosenPlayer()} revealed a Countess and won the challenge.
                    It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                    `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} who called Countess. ${getActionChosenPlayer()}'s Countess was challenged by ${data.challengePlayer}.
                    ${getActionChosenPlayer()} revealed a Countess and won the challenge.
                    It is your turn.`});
                break;

            case "Prophet":
                const deck = getDeck();
                if(getRemainingCards() !== 1) {
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Prophet and was challenged by ${data.challengePlayer}.
                        ${currentPlayer.username} had a Prophet and won the challenge.
                        ${currentPlayer.username} is now looking at the top two cards in the deck.`});

                    io.to(currentPlayer.id).emit("prophetSeeCards", {history: `You used Prophet and won the challenge.`, topCard: deck[0], secondCard: deck[1]});
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Prophet and was challenged by ${data.challengePlayer}.
                        ${currentPlayer.username} had a Prophet and won the challenge.
                        ${currentPlayer.username} is now looking at the last card in the deck.`});

                    io.to(currentPlayer.id).emit("prophetSeeCards", {history: `You used Prophet and won the challenge. There is only one card left in the deck.`, topCard: deck[0]});
                }
                break;

            case "Archmage":
                if(getEliminatedPlayers()[chosenPlayer.id]) {
                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} who challenged.
                        ${getActionChosenPlayer()} lost the challenge and has been eliminated from the game.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} who challenged.
                        ${getActionChosenPlayer()} lost the challenge and has been eliminated from the game.
                        It is your turn.`});

                    socket.emit("clearDrawStates");
                    io.in(data.password).emit("clearOpponentAction");
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} and was challenged by ${data.challengePlayer}.
                        ${currentPlayer.username} had an Archmage and won the challenge.
                        ${currentPlayer.username} and ${getActionChosenPlayer()} have swapped active cards.`});

                    const playerActiveCard = getPlayersActiveCards()[currentPlayer.id];
                    const opponentActiveCard = getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id];

                    setPlayerActiveCard(currentPlayer.id, opponentActiveCard);
                    setPlayerActiveCard(findUserByUsername(getActionChosenPlayer()).id, playerActiveCard);
                    io.to(currentPlayer.id).emit("updateActiveCard", getPlayersActiveCards()[currentPlayer.id]);
                    io.to(findUserByUsername(getActionChosenPlayer()).id).emit("updateActiveCard", getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id]);
                    
                    updatePlayerCard(currentPlayer.id, playerActiveCard, opponentActiveCard);
                    updatePlayerCard(findUserByUsername(getActionChosenPlayer()).id, opponentActiveCard, playerActiveCard);
                    io.in(data.password).emit("updatePlayerCards", getPlayerCards());

                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} and was challenged by ${data.challengePlayer}.
                        ${currentPlayer.username} had an Archmage and won the challenge.
                        ${currentPlayer.username} and ${getActionChosenPlayer()} have swapped active cards.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} used Archmage on ${getActionChosenPlayer()} and was challenged by ${data.challengePlayer}.
                        ${currentPlayer.username} had an Archmage and won the challenge.
                        ${currentPlayer.username} and ${getActionChosenPlayer()} have swapped active cards.
                        It is your turn.`})
                };
                break;

            case "Rogue":
                if(getEliminatedPlayers()[chosenPlayer.id]) {
                    nextPlayerIndex();
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} who challenged.
                        ${getActionChosenPlayer()} lost the challenge and has been eliminated from the game.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} who challenged.
                        ${getActionChosenPlayer()} lost the challenge and has been eliminated from the game.
                        It is your turn.`});

                    socket.emit("clearDrawStates");
                    io.in(data.password).emit("clearOpponentAction");
                } else {
                    for(let id in getEliminatedPlayers()) {
                        if(!getEliminatedPlayers()[id] && findUserByUsername(getActionChosenPlayer()).id !== id && currentPlayer.id !== id) {
                            io.to(id).emit("rogueSeeActiveCard", {history: `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} and won the challenge against ${data.challengePlayer}.
                                ${getActionChosenPlayer()}'s active card is:`,
                                topCard: getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id], 
                                chosenPlayer: getActionChosenPlayer()});
                        } else if(findUserByUsername(getActionChosenPlayer()).id === id) {
                            io.to(id).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue on you and won the challenge against ${data.challengePlayer}. 
                                The other players are looking at your active card.`});
                        } else if(currentPlayer.id === id) {
                            io.to(id).emit("rogueSeeActiveCard", {history: `You used Rogue on ${getActionChosenPlayer()} won the challenge against ${data.challengePlayer}.
                                ${getActionChosenPlayer()}'s active card is:`,
                                topCard: getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id], 
                                chosenPlayer: getActionChosenPlayer()});
                        } else {
                            io.to(id).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} and won the challenge against ${data.challengePlayer}. 
                                ${getActionChosenPlayer()}'s active card is ${getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id]}.`});
                        };
                    };
                };

                break;

            default:
                console.log("Error in challengeWonDrawCard.");
        };

        setActionChosenPlayer("");
    });

    //listening for players who want to play again
    socket.on("playAgain", (data) => {
        setUsersPlayAgain(socket.id);
        if(getNumberOfUsersPlayAgain() === getNumberOfPlayers()) {
            resetPlayersCards();
            resetDeckOfCards();
            resetUsersGameStates();

            io.in(data.password).emit("clearGameStates");

            initialiseDeck(getNumberOfPlayers());
            shuffleDeck();
            initialisePlayerCards(getUsers());
            initialiseEliminatedPlayers();
            initialisePlayersPassedChallenge();
            initialiseUsersPlayAgain();

            io.in(data.password).emit("initialiseGame", {playerCards: getPlayerCards(), remainingCards: getRemainingCards(), discardPile: getDiscardPile()});

            console.log(`${findUserById(socket.id).username} wants to play again. All players haved pressed play again.`);
            console.log("Users:");
            console.log(getUsers());
            console.log(`Number of players: ${getNumberOfPlayers()}
            Player turn: ${getPlayerTurnIndex()}`);
            console.log("Eliminated Players:");
            console.log(getEliminatedPlayers());
            console.log("Players pass challenge:");
            console.log(getPlayersPassedChallenge());
            console.log(`ActionChosenPlayer: ${getActionChosenPlayer()}`);
            console.log("Users play again:");
            console.log(getUsersPlayAgain());
            console.log(`Number of users play again: ${getNumberOfUsersPlayAgain()}`);
            console.log("Number of Wins:");
            console.log(getNumberOfWins());
            
            console.log("Player Permanent Cards:");
            console.log(getPlayersPermanentCards());
            console.log("Player Active Cards:");
            console.log(getPlayersActiveCards());

            console.log("Deck:");
            console.log(getDeck());
            console.log(`Remaining cards: ${getRemainingCards()}`);
            console.log("Player Cards:");
            console.log(getPlayerCards());
            console.log("Discard Pile:");
            console.log(getDiscardPile());           
        } else {
            for(let id in getUsersPlayAgain()) {
                if(getUsersPlayAgain()[id]) {
                    io.to(id).emit("updatePlayAgainButton", {message: `Waiting on ${getNumberOfPlayers()-getNumberOfUsersPlayAgain()} players`})
                }
            }

            console.log(`${findUserById(socket.id).username} wants to play again. Waiting on ${getNumberOfPlayers()-getNumberOfUsersPlayAgain()} players.`);
        };
    });

    //listening for client disconnect
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
        const foundUser = removeUser(socket.id);
        if(Object.keys(foundUser).length !== 0) {
            io.in(foundUser.password).emit("playerLeft", getUsers());
            io.in(foundUser.password).emit("clientReset");

            fullResetUsers();
            fullResetDeckOfCards();
            resetPlayersCards();
        }
    });
});

server.listen(PORT, () => {
    console.log(`LISTENING ON PORT ${PORT}`);
});