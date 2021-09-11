const users = [];
const globalPassword = "svge";
const numberOfPlayers = 2;

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

const getRoomFull = () => {
    if(users.length < numberOfPlayers) {
        return false;
    }
    return true;
};

const getNumberOfPlayers = () => {
    return numberOfPlayers;
};

module.exports = { addUser, getUsers, removeUser, getNumberOfPlayers };
