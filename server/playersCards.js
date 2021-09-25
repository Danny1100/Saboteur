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

const setPlayerPermanentCard = (id, data) => {
    playersPermanentCards[id] = data;
};

const setPlayerActiveCard = (id, data) => {
    playersActiveCards[id] = data;
};

module.exports = { initialisePlayersPermanentCards, initialisePlayersActiveCards, getPlayersPermanentCards, getPlayersActiveCards, setPlayerPermanentCard, setPlayerActiveCard };