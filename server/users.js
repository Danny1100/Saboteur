const users = [];
const globalPassword = "svge";
const numberOfPlayers = 3;
var playerTurnIndex = 0;
const eliminatedPlayers = {};
var numberOfEliminatedPlayers = 0;


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

const nextPlayerIndex = () => {
    while(true) {
        console.log("updating playerTurnIndex");
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
            console.log(`player: ${eliminatedPlayers[userId]}`);
            if(!eliminatedPlayers[userId]) {
                return findUserById(userId);
            };
        };
    };
};


module.exports = { addUser, findUserById, findUserByUsername, getUsers, removeUser, getNumberOfPlayers, getPlayerTurnIndex, initialiseEliminatedPlayers, nextPlayerIndex, eliminatePlayer };
