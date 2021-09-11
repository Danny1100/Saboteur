const deck = [];
const discarded = {Assassin: 0, Countess: 0, Prophet: 0, Archmage: 0, Rogue: 0};
const characterCards = ["Assassin", "Countess", "Prophet", "Archmage", "Rogue", "Saboteur"];
var remainingCards = 0;

const playerCards = {};

//deck functions
const initialiseDeck = (numberOfPlayers) => {
    for(let i = 0; i < characterCards.length-1; i++) {
        for(let j = 0; j <= numberOfPlayers; j++) {
            deck.push(characterCards[i]);
            remainingCards++;
        };
    };
    deck.push(characterCards[5]);
    remainingCards++;

    return deck;
};

const shuffleDeck = () => {
    for(let i = deck.length-1; i > 0; i--) {
        const newIndex = Math.floor(Math.random() * i+1);
        const oldValue = deck[newIndex];
        deck[newIndex] = deck[i];
        deck[i] = oldValue;
    };

    return deck;
};

const getDeck = () => {
    return deck;
};


//card functions
const drawCard = () => {
    remainingCards--;
    return deck.shift();
};

const getRemainingCards = () => {
    return remainingCards;
}

//player card functions i.e. handles each individual player's cards
const initialisePlayerCards = (users) => {
    users.forEach((user) => {
        playerCards[user.id] = [];
    });
    
    for(let i = 0; i < 2; i++) {
        for(let id in playerCards) {
            playerCards[id].push(drawCard());
        };
    };

    return playerCards;
};

const getPlayerCards = () => {
    return playerCards;
};

module.exports = { initialiseDeck, shuffleDeck, getDeck, getRemainingCards, initialisePlayerCards, getPlayerCards };