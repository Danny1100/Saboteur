const users = [];
const numberOfPlayers = 5;

const addUser = (id, username, password) => {
    if(password !== "svge") {
        return {error: "Incorrect Password"};
    };
    if(getRoomFull()) {
        return {error: "Room Full"};
    };
    sameUsername = false;
    samePlayer = false;
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
    const newUser = {id, username};
    users.push(newUser);
    return { users };
};

const getRoomFull = () => {
    if(users.length < numberOfPlayers) {
        return false;
    }
    return true;
};

// const getUsers = () => {
//     return users;
// };

module.exports = { addUser };
