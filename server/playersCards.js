const playersActiveCards = {};
const playersPermanentCards = {};

const initialisePlayersPermanentCards = (id, data) => {
    playersPermanentCards[id] = data.permanentCard;
};

const initialisePlayersActiveCards = (id, data) => {
    playersActiveCards[id] = data.activeCard;
};

const getPlayersPermanentCards = () => {
    return playersPermanentCards;
};

const getPlayersActiveCards = () => {
    return playersActiveCards;
};

module.exports = { initialisePlayersPermanentCards, initialisePlayersActiveCards, getPlayersPermanentCards, getPlayersActiveCards };