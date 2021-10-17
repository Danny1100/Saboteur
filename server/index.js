const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { addUser, findUserById, findUserByUsername, getUsers, removeUser, getNumberOfPlayers, getPlayerTurnIndex, initialiseEliminatedPlayers, nextPlayerIndex, eliminatePlayer, initialisePlayersPassedChallenge, updatePlayersPassedChallenge, calculatePlayersWaiting, getPlayersPassedChallenge, resetPlayersPassedChallenge, setActionChosenPlayer, getActionChosenPlayer, getEliminatedPlayers } = require('./users');
const { initialiseDeck, shuffleDeck, initialisePlayerCards, getPlayerCards, getRemainingCards, getDiscardPile, discardCard, removePlayerCard, drawCard, updatePlayerCard, insertCard, getDeck } = require('./deckOfCards');
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
                io.in(data.password).emit("loseScreen", {winner: winner});
                io.to(winner.id).emit("winScreen");
            } else {
                nextPlayerIndex();

                if(data.chosenCard === "Saboteur") {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${playerName} failed to execute and has been eliminated from the game. They shuffled ${data.chosenCard} back into the deck.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} failed to execute and has been eliminated from the game. 
                        They shuffled ${data.chosenCard} back into the deck.
                        It is your turn.`});
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${playerName} failed to execute and has been eliminated from the game. They discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} failed to execute and has been eliminated from the game. They discarded ${data.chosenCard}.
                        It is your turn.`});
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
            } else {
                io.in(data.password).emit("notPlayerTurn", {history: 
                    `${playerName} has lost a card slot due to failed execute. They discarded ${data.chosenCard}.
                    It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${playerName} has lost a card slot due to failed execute. They discarded ${data.chosenCard}.
                    It is your turn.`});  
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
        } else {
            io.in(data.password).emit("updateHistory", `${playerName} was successfully executed and lost a card slot. They discarded ${data.chosenCard}. They now have the choice to draw a new card.`);
        };
        
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

    socket.on("archmageAction", () => {
        for(let id in getEliminatedPlayers()) {
            if(!getEliminatedPlayers()[id]) {
                io.to(id).emit("challengeAction", {player: findUserById(socket.id), characterAction: "Archmage"});
            } else {
                io.to(id).emit("notPlayerTurn", {history: `${findUserById(socket.id).username} is using Archmage. Waiting to see if other players will challenge.`});
            };
        };

        updatePlayersPassedChallenge(socket.id);
        socket.emit("updateHistory", `You are using Archmage. Waiting to see if other players will challenge.`)
        socket.emit("challengeWait", {playersWaiting: calculatePlayersWaiting()});
    });

    socket.on("archmageChoseCard", (data) => {
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("clearDrawStates");
        io.in(data.password).emit("clearPlayersWaiting");
        io.in(data.password).emit("clearOpponentAction");

        insertCard(data.activeCard);
        if(data.chosenCard === data.topCard) {
            insertCard(data.secondCard);
        } else {
            insertCard(data.topCard);
        }
        shuffleDeck();

        updatePlayerCard(socket.id, data.activeCard, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());
        io.in(data.password).emit("updateRemainingCards", getRemainingCards());
        setPlayerActiveCard(socket.id, data.chosenCard);
        socket.emit("updateActiveCard", data.chosenCard);

        nextPlayerIndex();
        const currentPlayer = findUserById(socket.id);
        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage and drew a new active card.
            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} used Archmage and drew a new active card.
            It is your turn.`});
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
    });

    socket.on("rogueFinishSeeingCard", (data) => {
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("clearDrawStates");
        io.in(data.password).emit("clearPlayersWaiting");
        io.in(data.password).emit("clearOpponentAction");
        resetPlayersPassedChallenge();

        nextPlayerIndex();
        const currentPlayer = findUserById(socket.id);
        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue and looked at ${data.chosenPlayer}'s active card.
            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: `${currentPlayer.username} used Rogue and looked at ${data.chosenPlayer}'s active card.
            It is your turn.`});
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
                    if(getRemainingCards() !== 1) {
                        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage and was not challenged.
                            ${currentPlayer.username} is looking at the top two cards in the deck and choosing one of them to be their active card.
                            The unchosen card as well as ${currentPlayer.username}'s previous active card will be shuffled back into the deck.`});

                        const topCard = drawCard();
                        const secondCard = drawCard();
                        io.to(currentPlayer.id).emit("archmageDrawCards", {topCard: topCard, secondCard: secondCard});
                    } else {
                        io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage and was not challenged.
                            ${currentPlayer.username} will replace their current active card with the last card in the deck.
                            ${currentPlayer.username}'s previous active card will be shuffled back into the deck.`});

                        const topCard = drawCard();
                        io.to(currentPlayer.id).emit("archmageDrawCards", {topCard: topCard});
                    }
                    break;

                case "Rogue":
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} and was not challenged.
                        ${currentPlayer.username} is now looking at ${getActionChosenPlayer()}'s active card.`});
                    io.to(currentPlayer.id).emit("rogueSeeActiveCard", {history: `You used Rogue on ${getActionChosenPlayer()} and weren't challenged.`,
                        topCard: getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id]});
                    break;

                default:
                    console.log("Error in challengePass.");
            };

            setActionChosenPlayer("");

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
        io.in(data.password).emit("clearPlayersWaiting");
        resetPlayersPassedChallenge();

        const currentPlayer = getUsers()[getPlayerTurnIndex()];
        const challengePlayer = findUserById(socket.id);
        if(data.opponentAction === "Assassin" || data.opponentAction === "Rogue") {
            io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used ${data.opponentAction} on ${getActionChosenPlayer()} and was challenged by ${challengePlayer.username}.
                ${currentPlayer.username} is now going to reveal a card.`})
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
            io.to(currentPlayer.id).emit("challengeReveal", {challengePlayer: challengePlayer, action: data.opponentAction});
        };
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
                    if(data.opponentAction === "Assassin" || data.opponentAction === "Rogue") {
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
                    } else {
                        io.in(data.password).emit("notPlayerTurn", {history: 
                            `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. 
                            ${playerName} has been eliminated from the game.
                            ${playerName} discarded ${data.chosenCard}.
                            It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                        io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                            `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. 
                            ${playerName} has been eliminated from the game.
                            ${playerName} discarded ${data.chosenCard}.
                            It is your turn.`});
                    };                 
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
                        ${playerName} discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${playerName} used ${data.opponentAction} on ${data.chosenPlayer} but was challenged by ${data.challengePlayer} and lost. 
                        ${playerName} discarded ${data.chosenCard}.
                        It is your turn.`}); 
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: 
                        `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. 
                        ${playerName} discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${playerName} used ${data.opponentAction} but was challenged by ${data.challengePlayer} and lost. 
                        ${playerName} discarded ${data.chosenCard}.
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
        } else {
            discardCard(data.chosenCard);
            io.in(data.password).emit("updateDiscardPile", getDiscardPile());

            removePlayerCard(socket.id, data.chosenCard);
            io.in(data.password).emit("updatePlayerCards", getPlayerCards());

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
                        `${currentPlayer.username} used Assassin on ${countessPlayer} who called Countess.
                        ${challengePlayer} challenged ${countessPlayer}'s Countess and won the challenge.
                        ${countessPlayer} has been eliminated from the game.
                        ${countessPlayer} discarded ${data.chosenCard}.
                        It is ${getUsers()[getPlayerTurnIndex()].username}'s turn.`});
                    io.to(getUsers()[getPlayerTurnIndex()].id).emit("playerTurn", {history: 
                        `${currentPlayer.username} used Assassin on ${countessPlayer} who called Countess.
                        ${challengePlayer} challenged ${countessPlayer}'s Countess and won the challenge.
                        ${countessPlayer} has been eliminated from the game.
                        ${countessPlayer} discarded ${data.chosenCard}.
                        It is your turn.`});                 
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
                    ${countessPlayer} discarded ${data.chosenCard}.
                    ${currentPlayer.username} is now guessing ${countessPlayer}'s active card.`})

                socket.emit("clearDrawStates");

                io.to(currentPlayer.id).emit("assassinGuessActiveCard");
            };

            setActionChosenPlayer("");
        };
    });

    socket.on("loseChallengeChoseCard", (data) => {
        discardCard(data.chosenCard);
        io.in(data.password).emit("updateDiscardPile", getDiscardPile());

        removePlayerCard(socket.id, data.chosenCard);
        io.in(data.password).emit("updatePlayerCards", getPlayerCards());

        let currentPlayer = getUsers()[getPlayerTurnIndex()];
        if(data.opponentAction === "Countess") {
            currentPlayer = findUserByUsername(getActionChosenPlayer());
        }
        const challengePlayer = findUserById(socket.id);

        if(getPlayerCards()[socket.id].length === 0) {
            setPlayerActiveCard(socket.id, "");
            socket.emit("updateActiveCard", "");

            const winner = eliminatePlayer(socket.id);
            if(winner) {
                io.in(data.password).emit("loseScreen", {winner: winner});
                io.to(winner.id).emit("winScreen");
            } else {
                io.in(data.password).emit("updateHistory", `${challengePlayer.username} challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                    ${challengePlayer.username} discarded ${data.chosenCard}.
                    ${challengePlayer.username} was eliminated from the game.
                    ${currentPlayer.username} now has the choice to replace their ${data.opponentAction} with a new card.`);
                socket.emit("notPlayerTurn", {history: `You challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                    You discarded ${data.chosenCard}.
                    You have been eliminated from the game.
                    ${currentPlayer.username} now has the choice to replace their ${data.opponentAction} with a new card.`})

                if(data.opponentAction !== "Countess") {
                    io.to(currentPlayer.id).emit("challengeWonDrawCard", {drawnCard: drawCard()});
                } else {
                    io.to(currentPlayer.id).emit("challengeCountessWonDrawCard", {drawnCard: drawCard()});
                };
            };
        } else {
            setPlayerPermanentCard(socket.id, "");
            socket.emit("updatePermanentCard", "");
            setPlayerActiveCard(socket.id, getPlayerCards()[socket.id][0]);
            socket.emit("updateActiveCard", getPlayerCards()[socket.id][0]);

            io.in(data.password).emit("updateHistory", `${challengePlayer.username} challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                ${challengePlayer.username} discarded ${data.chosenCard}.
                ${currentPlayer.username} now has the choice to replace their ${data.opponentAction} with a new card.`);
            socket.emit("notPlayerTurn", {history: `You challenged ${currentPlayer.username}'s ${data.opponentAction} and lost. 
                You discarded ${data.chosenCard}.
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
            } else {
                setPlayerPermanentCard(socket.id, data.chosenCard);
                socket.emit("updatePermanentCard", data.chosenCard);
            };

            insertCard(data.opponentAction);
            shuffleDeck();
            io.in(data.password).emit("updateRemainingCards", getRemainingCards());
        } else {
            insertCard(data.drawnCard);
            shuffleDeck();
            io.in(data.password).emit("updateRemainingCards", getRemainingCards());
        };
        
        const currentPlayer = getUsers()[getPlayerTurnIndex()];
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
                    `${currentPlayer.username} used Assassin on ${getActionChosenPlayer()} who called Countess.
                    ${getActionChosenPlayer()}'s Countess was challenged by ${data.challengePlayer}.
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
                if(getRemainingCards() !== 1) {
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage and won the challenge.
                        ${currentPlayer.username} is looking at the top two cards in the deck and choosing one of them to be their active card.
                        The unchosen card as well as ${currentPlayer.username}'s previous active card will be shuffled back into the deck.`});

                    const topCard = drawCard();
                    const secondCard = drawCard();
                    io.to(currentPlayer.id).emit("archmageDrawCards", {topCard: topCard, secondCard: secondCard});
                } else {
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Archmage and won the challenge.
                        ${currentPlayer.username} will replace their current active card with the last card in the deck.
                        ${currentPlayer.username}'s previous active card will be shuffled back into the deck.`});

                    const topCard = drawCard();
                    io.to(currentPlayer.id).emit("archmageDrawCards", {topCard: topCard});
                }
                break;

            case "Rogue":
                const chosenPlayer = findUserByUsername(getActionChosenPlayer());
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
                    io.in(data.password).emit("notPlayerTurn", {history: `${currentPlayer.username} used Rogue on ${getActionChosenPlayer()} and was challenged by ${data.challengePlayer}.
                        ${currentPlayer.username} had a Rogue and won the challenge.
                        ${currentPlayer.username} is now looking at ${getActionChosenPlayer()}'s active card.`})
                    io.to(currentPlayer.id).emit("rogueSeeActiveCard", {history: `You used Rogue on ${getActionChosenPlayer()} and won the challenge.`,
                        topCard: getPlayersActiveCards()[findUserByUsername(getActionChosenPlayer()).id]});
                };
                break;

            default:
                console.log("Error in challengeWonDrawCard.");
        };

        setActionChosenPlayer("");
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