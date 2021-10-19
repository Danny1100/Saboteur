import './App.css';
import io from 'socket.io-client';
import { useState, useEffect } from 'react';
import Homepage from './components/Homepage';
import Game from './components/Game';

let socket;

function App() {
  //initialise socket state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [numberOfPlayers, setNumberOfPlayers] = useState(0);

  //initialise socket on startup and cleanup once finished
  useEffect(() => {
    socket = io.connect("http://localhost:3001");

    //cleanup on component unmount
    return function cleanup() {
      socket.disconnect();
      //shut down connnection instance
      socket.off();
    };
    
  }, []);

  //takes care of players joining and leaving
  useEffect(() => {
    socket.on("joinError", (error) => {
      alert(error);
    })

    socket.on("playerJoined", (data) => {
      setUsers(data.users);
      setNumberOfPlayers(data.numberOfPlayers);
    });

    socket.on("playerLeft", (users) => {
      setUsers(users);
    });
  }, []);

  //Function to join a room
  const joinRoom = () => {
    if(username !== "" && password !== "") {
      socket.emit("joinRoom", {username: username, password: password});
    } else {
      alert("Enter a valid Username and Password");
    };
  };

  //Function to start the game
  const startGame = () => {
    if(users.length !== numberOfPlayers) {
      alert(`Need ${numberOfPlayers} players. This lobby currently only has ${users.length}.`);
    } else if(numberOfPlayers === 0) {
      alert("You need to join a room to start a game");
    } else {
      socket.emit("startGame", password);
    };
  };




  //initialise game state
  const [showGame, setShowGame] = useState(false);
  const [playerCards, setPlayerCards] = useState({});
  const [remainingCards, setRemainingCards] = useState(0);
  const [discardPile, setDiscardPile] = useState({});
  const [permanentCard, setPermanentCard] = useState("");
  const [activeCard, setActiveCard] = useState("");

  //temporary states for the execute and draw card actions
  const [chosenPlayer, setChosenPlayer] = useState("");
  const [chosenCard, setChosenCard] = useState("");
  const [chosenPermanentCard, setChosenPermanentCard] = useState("");
  const [chosenActiveCard, setChosenActiveCard] = useState("");
  const [drawnCard, setDrawnCard] = useState("");
  const [opponentAction, setOpponentAction] = useState("");
  const [challengePlayer, setChallengePlayer] = useState("");
  const [topCard, setTopCard] = useState("");
  const [secondCard, setSecondCard] = useState("");

  //states/variables for displaying different values on webpage
  const characterCards = ["Assassin", "Countess", "Prophet", "Archmage", "Rogue", "Saboteur"];
  const [confirmButtonMessage, setConfirmButtonMessage] = useState("Confirm");
  const [history, setHistory] = useState("");
  const [displayGameState, setDisplayGameState] = useState("selectPermanentCard");
  const [playersWaiting, setPlayersWaiting] = useState(0);

  //listens for game updates
  useEffect(() => {
    //initial game setup
    socket.on("initialiseGame", (data) => {
      setShowGame(true);
      setPlayerCards(data.playerCards);
      setRemainingCards(data.remainingCards);
      setDiscardPile(data.discardPile);
    });

    //general update functions
    socket.on("updateHistory", (data) => {
      setHistory(data);
    });

    socket.on("updateDiscardPile", (data) => {
      setDiscardPile(data);
    });

    socket.on("updateRemainingCards", (data) => {
      setRemainingCards(data);
    });

    socket.on("updatePlayerCards", (data) => {
      setPlayerCards(data);
    });

    socket.on("updatePermanentCard", (data) => {
      setPermanentCard(data);
    });

    socket.on("updateActiveCard", (data) => {
      setActiveCard(data);
    });

    socket.on("updatePlayersWaiting", (data) => {
      setPlayersWaiting(data);
    });

    //choosing permanent card at start of game
    socket.on("waitingOnPlayerSubmitPermanentCard", (data) => {
      if(data === 1) {
        setConfirmButtonMessage("Waiting on 1 player");
      } else {
        setConfirmButtonMessage(`Waiting on ${data} players`);
      }
    });

    //player turn functions
    socket.on("notPlayerTurn", (data) => {
      setDisplayGameState("notPlayerTurn");
      setHistory(data.history);
    });

    socket.on("playerTurn", (data) => {
      setDisplayGameState("playerTurn");
      setHistory(data.history);
    })

    //execute functions
    socket.on("executeFailed", () => {
      setDisplayGameState("executeFailedChooseCardToLose");
    });

    socket.on("executeSuccess", () => {
      setDisplayGameState("executeSuccessChooseCardToLose");
    });

    socket.on("clearExecuteStates", () => {
      setChosenPlayer("");
      setChosenCard("");
      setChosenPermanentCard("");
      setChosenActiveCard("");
    });

    socket.on("executeSuccessChooseCardToDraw", (data) => {
      setDisplayGameState("executeSuccessChooseCardToDraw");
      setChosenCard("");
      setDrawnCard(data.drawnCard);
    });

    //draw functions
    socket.on("drawActionChooseCardToDraw", (data) => {
      setDisplayGameState("drawActionChooseCardToDraw");
      setDrawnCard(data.drawnCard);
    });

    socket.on("chooseCharacterAction", () => {
      setDisplayGameState("chooseCharacterAction");
    });

    socket.on("clearDrawStates", () => {
      setChosenPlayer("");
      setChosenCard("");
      setDrawnCard("");
      setChallengePlayer("");
      setTopCard("");
      setSecondCard("");
    });

    //character Actions
    socket.on("assassinGuessActiveCard", () => {
      setDisplayGameState("assassinGuessActiveCard");
    });

    socket.on("prophetSeeCards", (data) => {
      setHistory(data.history);
      if(data.secondCard) {
        setTopCard(data.topCard);
        setSecondCard(data.secondCard);
      } else {
        setTopCard(data.topCard);
      }
      setDisplayGameState("prophetSeeCards");
    });

    socket.on("archmageDrawCards", (data) => {
      if(data.secondCard) {
        setTopCard(data.topCard);
        setSecondCard(data.secondCard);
      } else {
        setTopCard(data.topCard);
      };
      setDisplayGameState("archmageDrawCards");
    });

    socket.on("rogueSeeActiveCard", (data) => {
      setHistory(data.history);
      setTopCard(data.topCard);
      setDisplayGameState("rogueSeeActiveCard");
    });

    //challenge actions
    socket.on("challengeAction", (data) => {
      setDisplayGameState("challengeAction");
      if(data.characterAction === "Assassin" || data.characterAction === "Rogue") {
        setHistory(`${data.player.username} is using ${data.characterAction} on ${data.chosenPlayer}. Would you like to challenge this action?`);
      } else if(data.characterAction === "Countess") {
        setHistory(`${data.currentPlayer.username} used Assassin on ${data.player.username}.
          ${data.player.username} called Countess to block the assassination.
          Would you like to challenge ${data.player.username}'s Countess?`)
      } else {
        setHistory(`${data.player.username} is using ${data.characterAction}. Would you like to challenge this action?`);
      };

      setOpponentAction(data.characterAction);
    });

    socket.on("countessAction", (data) => {
      setDisplayGameState("countessAction");
      setHistory(`${data.player.username} is using Assassin on you. Would you like to challenge or call Countess against this action?`);
    });

    socket.on("challengeWait", (data) => {
      setDisplayGameState("challengeWait");
      setPlayersWaiting(data.playersWaiting);
    });

    socket.on("challengeReveal", (data) => {
      if(data.action !== "Countess") {
        setDisplayGameState("challengeReveal");
      } else {
        setDisplayGameState("challengeCountessReveal");
      };

      setChallengePlayer(data.challengePlayer.username);
    });

    socket.on("loseChallenge", () => {
      setDisplayGameState("loseChallenge");
    });

    socket.on("loseCountessChallenge", () => {
      setDisplayGameState("loseCountessChallenge");
    });

    socket.on("challengeWonDrawCard", (data) => {
      setDisplayGameState("challengeWonDrawCard");
      setDrawnCard(data.drawnCard);
    });

    socket.on("challengeCountessWonDrawCard", (data) => {
      setDisplayGameState("challengeCountessWonDrawCard");
      setDrawnCard(data.drawnCard);
    });

    socket.on("clearPlayersWaiting", () => {
      setPlayersWaiting(0);
    });

    socket.on("clearOpponentAction", () => {
      setOpponentAction("");
    });

    //game over screens
    socket.on("loseScreen", (data) => {
      setDisplayGameState("loseScreen");
      setHistory(`${data.winner.username} won. Better luck next time!`)
    });

    socket.on("winScreen", (data) => {
      setDisplayGameState("winScreen");
    });
  }, []);


  //selecting and submitting permanent card function at beginning of game
  const selectPermanentCard = (event) => {
    setPermanentCard(event.target.value);
    if(playerCards[socket.id][0] === event.target.value) {
      setActiveCard(playerCards[socket.id][1]);
    } else {
      setActiveCard(playerCards[socket.id][0]);
    };
  };

  const submitPermanentCard = () => {
    if(permanentCard === "") {
      alert("Please choose a card to be your permanent card");
    } else {
      socket.emit("submitPermanentCard", {permanentCard: permanentCard, activeCard: activeCard, password: password});
      document.getElementById("confirmPermanentCardButton").disabled = 'disabled';
    };
  };


  //execute and draw functions
  const choosePlayer = (event) => {
    setChosenPlayer(event.target.value);
  }

  const chooseCard = (event) => {
    setChosenCard(event.target.value);
  };

  const executeAction = () => {
    let validPlayer = false;
    for(let id in playerCards) {
      if(id !== socket.id && playerCards[id].length === 2) {
        validPlayer = true;
      };
    };
    if(validPlayer) {
      setDisplayGameState("executeChoosePlayer");
    } else {
      alert("No other players have 2 card slots. You cannot execute.");
    };
  };

  const executeChooseCards = () => {
    if(chosenPlayer === "") {
      alert("Please select a player to execute");
    } else {
      setDisplayGameState("executeChooseCards");
    }
  }

  const executeChoosePermanentCard = (event) => {
    setChosenPermanentCard(event.target.value);
  };

  const executeChooseActiveCard = (event) => {
    setChosenActiveCard(event.target.value);
  };

  const executeConfirm = () => {
    if(chosenPermanentCard === "" || chosenActiveCard === "") {
      alert("Please choose a permanent and active card")
    } else {
      socket.emit("executeConfirm", {chosenPlayer: chosenPlayer, chosenPermanentCard: chosenPermanentCard, chosenActiveCard: chosenActiveCard, password: password});
    };
  };

  const executeFailedLoseCard = () => {
    if(chosenCard === "") {
      alert("Please choose a card to discard");
    } else {
      socket.emit("executeFailedLoseCard", {chosenCard: chosenCard, password: password});
    };
  };

  const executeSuccessLoseCard = () => {
    if(chosenCard === "") {
      alert("Please choose a card to discard");
    } else {
      socket.emit("executeSuccessLoseCard", {chosenCard: chosenCard, password: password});
    };
  };

  const executeSuccessDrawCard = () => {
    if(chosenCard === "") {
      alert("Please choose a card to keep");
    } else {
      socket.emit("executeSuccessDrawCard", {password: password, chosenCard: chosenCard, drawnCard: drawnCard, activeCard: activeCard});
      setDrawnCard("");
    };
  };

  const drawAction = () => {
    socket.emit("drawAction", {password: password});
  };

  const confirmNewCard = () => {
    if(chosenCard === "") {
      alert("Please choose a card to be your active card.");
    } else if((drawnCard === "Saboteur"  || activeCard === "Saboteur") && chosenCard !== "Saboteur") {
      alert("You cannot discard the Saboteur off of a draw action.");
    } else {
      socket.emit("confirmNewCard", {password: password, chosenCard: chosenCard, drawnCard: drawnCard, activeCard: activeCard});
      setDrawnCard("");
      setChosenCard("");
    }
  };

  //character action functions
  const assassinAction = () => {
    if(permanentCard === "Countess" || activeCard === "Countess") {
      alert("You cannot use Assassin if you hold a Countess");
    } else if( (permanentCard === "Saboteur" && activeCard === "Assassin") || (activeCard === "Saboteur" && permanentCard === "Assassin") ) {
      alert("You cannot use Assassin since you hold a Saboteur");
    } else {
      setDisplayGameState("assassinChoosePlayer");
    }
  };

  const assassinConfirm = () => {
    if(chosenPlayer === "") {
      alert("Please choose a player to use Assassin on.");
    } else {
      socket.emit("assassinChosePlayer", {password: password, chosenPlayer: chosenPlayer});
    }
  };

  const assassinGuessActiveCard = () => {
    if(chosenCard === "") {
      alert("Please choose a card");
    } else {
      socket.emit("assassinGuessActiveCard", {password: password, chosenPlayer: chosenPlayer, chosenCard: chosenCard});
      setChosenCard("");
      setChosenPlayer("");
    }
  };

  const countessAction = () => {
    if( (permanentCard === "Saboteur" && activeCard === "Countess") || (activeCard === "Saboteur" && permanentCard === "Countess") ) {
      alert("You cannot use Countess since you hold a Saboteur");
    } else {
      socket.emit("countessAction", {password: password});
    };
  };

  const prophetAction = () => {
    if( (permanentCard === "Saboteur" && activeCard === "Prophet") || (activeCard === "Saboteur" && permanentCard === "Prophet") ) {
      alert("You cannot use Prophet since you hold a Saboteur");
    } else {
      socket.emit("prophetAction");
    };
  };

  const prophetFinishSeeingCards = () => {
    socket.emit("prophetFinishSeeingCards", {password: password});
  };

  const archmageAction = () => {
    if( (permanentCard === "Saboteur" && activeCard === "Archmage") || (activeCard === "Saboteur" && permanentCard === "Archmage") ) {
      alert("You cannot use Archmage since you hold a Saboteur");
    } else {
      socket.emit("archmageAction");
    };
  };

  const archmageChoseCard = () => {
    socket.emit("archmageChoseCard", {password: password, chosenCard: chosenCard, activeCard: activeCard, topCard: topCard, secondCard: secondCard});
  };

  const rogueAction = () => {
    if( (permanentCard === "Saboteur" && activeCard === "Rogue") || (activeCard === "Saboteur" && permanentCard === "Rogue") ) {
      alert("You cannot use Rogue since you hold a Saboteur");
    } else {
      setDisplayGameState("rogueChoosePlayer");
    };
  };

  const rogueConfirm = () => {
    if(chosenPlayer === "") {
      alert("Please choose a player to use Rogue on.");
    } else {
      socket.emit("rogueChosePlayer", {password: password, chosenPlayer: chosenPlayer});
    }
  };

  const rogueFinishSeeingCard = () => {
    socket.emit("rogueFinishSeeingCard", {password: password, chosenPlayer: chosenPlayer});
  };

  //challenge functions
  const challengePass = () => {
    socket.emit("challengePass", {password: password, opponentAction: opponentAction});
  };

  const challengeAction = () => {
    socket.emit("challengeAction", {password: password, opponentAction: opponentAction});
  };

  const challengeReveal = () => {
    socket.emit("challengeReveal", {password: password, chosenPlayer: chosenPlayer, challengePlayer:challengePlayer, chosenCard: chosenCard, opponentAction: opponentAction});
  };

  const challengeCountessReveal = () => {
    socket.emit("challengeCountessReveal", {password: password, challengePlayer: challengePlayer, chosenCard: chosenCard});
  };

  const loseChallenge = () => {
    socket.emit("loseChallengeChoseCard", {password: password, chosenCard: chosenCard, opponentAction: opponentAction});
  };

  const loseCountessChallenge = () => {
    socket.emit("loseChallengeChoseCard", {password: password, chosenCard: chosenCard, opponentAction: "Countess"});
  };

  const challengeWonDrawCard = () => {
    socket.emit("challengeWonDrawCard", {password: password, chosenCard: chosenCard, drawnCard: drawnCard, opponentAction: opponentAction, challengePlayer: challengePlayer});
  };

  const challengeCountessWonDrawCard = () => {
    socket.emit("challengeWonDrawCard", {password: password, chosenCard: chosenCard, drawnCard: drawnCard, opponentAction: "Countess", challengePlayer: challengePlayer});
  };



  
  return (
    <div className="App">
      {!showGame ? (
        <Homepage 
        setUsername={setUsername}
        setPassword={setPassword}
        users={users}
        numberOfPlayers={numberOfPlayers}
        joinRoom={joinRoom}
        startGame={startGame}/>
      ) 
      : 
      (
        <Game
        id={socket.id}
        users={users}
        playerCards={playerCards}
        remainingCards={remainingCards}
        discardPile={discardPile}
        permanentCard={permanentCard}
        activeCard={activeCard}
        chosenPlayer={chosenPlayer}
        drawnCard={drawnCard}
        opponentAction={opponentAction}
        topCard={topCard}
        secondCard={secondCard}

        characterCards={characterCards}
        confirmButtonMessage={confirmButtonMessage}
        history={history}
        displayGameState={displayGameState}
        playersWaiting={playersWaiting}
        challengePlayer={challengePlayer}

        selectPermanentCard={selectPermanentCard}
        submitPermanentCard={submitPermanentCard}

        choosePlayer={choosePlayer}
        chooseCard={chooseCard}
        executeAction={executeAction}
        executeChooseCards={executeChooseCards}
        executeChoosePermanentCard={executeChoosePermanentCard}
        executeChooseActiveCard={executeChooseActiveCard}
        executeConfirm={executeConfirm}
        executeFailedLoseCard={executeFailedLoseCard}
        executeSuccessLoseCard={executeSuccessLoseCard}
        executeSuccessDrawCard={executeSuccessDrawCard}

        drawAction={drawAction}
        confirmNewCard={confirmNewCard}

        assassinAction={assassinAction}
        assassinConfirm={assassinConfirm}
        assassinGuessActiveCard={assassinGuessActiveCard}
        countessAction={countessAction}
        prophetAction={prophetAction}
        prophetFinishSeeingCards={prophetFinishSeeingCards}
        archmageAction={archmageAction}
        archmageChoseCard={archmageChoseCard}
        rogueAction={rogueAction}
        rogueConfirm={rogueConfirm}
        rogueFinishSeeingCard={rogueFinishSeeingCard}

        challengePass={challengePass}
        challengeAction={challengeAction}
        challengeReveal={challengeReveal}
        challengeCountessReveal={challengeCountessReveal}
        loseChallenge={loseChallenge}
        loseCountessChallenge={loseCountessChallenge}
        challengeWonDrawCard={challengeWonDrawCard}
        challengeCountessWonDrawCard={challengeCountessWonDrawCard}
        />
      )}
    </div>
  );
}

export default App;
