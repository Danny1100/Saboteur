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

  //states/variables for displaying different values on webpage
  const characterCards = ["Assassin", "Countess", "Prophet", "Archmage", "Rogue", "Saboteur"];
  const [confirmButtonMessage, setConfirmButtonMessage] = useState("Confirm");
  const [history, setHistory] = useState("");
  const [displayGameState, setDisplayGameState] = useState("selectPermanentCard");

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
    } else {
      setDisplayGameState("assassinChoosePlayer");
    }
  };

  const assassinConfirm = () => {
    alert("worked");
    setChosenPlayer("");
  };

  const prophetAction = () => {

  };

  const archmageAction = () => {

  };

  const rogueAction = () => {

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

        characterCards={characterCards}
        confirmButtonMessage={confirmButtonMessage}
        history={history}
        displayGameState={displayGameState}

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
        prophetAction={prophetAction}
        archmageAction={archmageAction}
        rogueAction={rogueAction}
        />
      )}
    </div>
  );
}

export default App;
