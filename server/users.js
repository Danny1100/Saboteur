const users = [];
const globalPassword = "svge";
const numberOfPlayers = 5;
var playerTurnIndex = 0;
const eliminatedPlayers = {};
var numberOfEliminatedPlayers = 0;
const playersPassedChallenge = {};
var actionChosenPlayer = "";
const usersPlayAgain = {};
var numberOfUsersPlayAgain = 0;
const numberOfWins = {};


//user functions
const addUser = (id, username, password) => {
    if(password !== globalPassword) {
        return {error: "Incorrect Password"};
    };
    if(getRoomFull()) {
        return {error: "Room Full"};
    };
    let sameUsername = false;
    let samePlayer = false;
    users.forEach((user) => {
        if(user.username === username) {
            sameUsername = true;
        };
        if(user.id === id) {
            samePlayer = true;
        };
    });
    if(sameUsername) {
        return {error: "Username Taken"};
    };
    if(samePlayer) {
        return {error: "You are already in this room"};
    };
    const newUser = {id, username, password};
    users.push(newUser);
    return { users };
};

const findUserById = (id) => {
    let foundUser = "";
    users.forEach((user) => {
        if(user.id === id) {
            foundUser = user;
        };
    });  
    return foundUser;
};

const findUserByUsername = (username) => {
    let foundUser = "";
    users.forEach((user) => {
        if(user.username === username) {
            foundUser = user;
        };
    });
    return foundUser;
};

const getUsers = () => {
    return users;
};

const removeUser = (id) => {
    let foundUser = {};
    users.forEach((user) => {
        if(user.id === id) {
            foundUser = user;
            users.splice(users.indexOf(user), 1);
        };
    });
    return foundUser;
};


//room functions
const getRoomFull = () => {
    if(users.length < numberOfPlayers) {
        return false;
    }
    return true;
};

const getNumberOfPlayers = () => {
    return numberOfPlayers;
};


//player turn functions
const getPlayerTurnIndex = () => {
    return playerTurnIndex;
};

const initialiseEliminatedPlayers = () => {
    users.map((user) => {
        eliminatedPlayers[user.id] = false;
    });
    return eliminatedPlayers;
};

const getEliminatedPlayers = () => {
    return eliminatedPlayers;
};

const nextPlayerIndex = () => {
    while(true) {
        playerTurnIndex = (playerTurnIndex+1)%numberOfPlayers;
        const id = users[playerTurnIndex].id;
        if(!eliminatedPlayers[id]) {
            break;
        };
    }
    return playerTurnIndex;
};

const eliminatePlayer = (id) => {
    eliminatedPlayers[id] = true;
    numberOfEliminatedPlayers++;

    if(numberOfEliminatedPlayers === numberOfPlayers-1) {
        for(const userId in eliminatedPlayers) {
            if(!eliminatedPlayers[userId]) {
                return findUserById(userId);
            };
        };
    };
};


//functions for calculating players who've passed on the challenge
const initialisePlayersPassedChallenge = () => {
    for(let user of users) {
        playersPassedChallenge[user.id] = false;
    };
    return playersPassedChallenge;
};

const getPlayersPassedChallenge = () => {
    return playersPassedChallenge;
};

const updatePlayersPassedChallenge = (id) => {
    playersPassedChallenge[id] = true;
    return playersPassedChallenge;
};

const calculatePlayersWaiting = () => {
    let count = 0;
    for(let id in playersPassedChallenge) {
        if(playersPassedChallenge[id]) {
            count++;
        };
    };

    return numberOfPlayers - count - numberOfEliminatedPlayers;
};

const resetPlayersPassedChallenge = () => {
    for(let id in playersPassedChallenge) {
        playersPassedChallenge[id] = false;
    };
    return playersPassedChallenge;
};

//functions for actionChosenPlayer variable which keeps track of the opponent who was chosen
const getActionChosenPlayer = () => {
    return actionChosenPlayer;
};

const setActionChosenPlayer = (username) => {
    actionChosenPlayer = username;
    return actionChosenPlayer;
};

//functions for checking and updating how many users want to start another game
const initialiseUsersPlayAgain = () => {
    users.map((user) => {
        usersPlayAgain[user.id] = false;
    });
    return usersPlayAgain;
};

const getUsersPlayAgain = () => {
    return usersPlayAgain;
};

const setUsersPlayAgain = (id) => {
    usersPlayAgain[id] = true;
    numberOfUsersPlayAgain++;
    return usersPlayAgain;
};

const getNumberOfUsersPlayAgain = () => {
    return numberOfUsersPlayAgain;
};

//add to number of wins
const initialiseNumberOfWins = () => {
    for(let user of users) {
        numberOfWins[user.id] = 0;
    };
    return playersPassedChallenge;
}

const getNumberOfWins = () => {
    return numberOfWins;
}

const incrementWins = (id) => {
    numberOfWins[id]++;
    return numberOfWins;
}

//reset function
const resetUsersGameStates = () => {
    playerTurnIndex = 0;

    for(let id in eliminatedPlayers) {
        eliminatedPlayers[id] = false;
    };
    numberOfEliminatedPlayers = 0;

    resetPlayersPassedChallenge();

    actionChosenPlayer = "";

    for(let id in usersPlayAgain) {
        usersPlayAgain[id] = false;
    };
    numberOfUsersPlayAgain = 0;


    console.log(`number of eliminated players: ${numberOfEliminatedPlayers}`);
};


module.exports = { 
    addUser, findUserById, findUserByUsername, getUsers, removeUser, 
    getNumberOfPlayers, 
    getPlayerTurnIndex, initialiseEliminatedPlayers, getEliminatedPlayers, nextPlayerIndex, eliminatePlayer, 
    initialisePlayersPassedChallenge, getPlayersPassedChallenge, updatePlayersPassedChallenge, calculatePlayersWaiting, resetPlayersPassedChallenge,
    getActionChosenPlayer, setActionChosenPlayer,
    initialiseUsersPlayAgain, getUsersPlayAgain, setUsersPlayAgain, getNumberOfUsersPlayAgain,
    initialiseNumberOfWins, getNumberOfWins, incrementWins, 
    resetUsersGameStates };
