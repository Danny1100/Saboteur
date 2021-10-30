import React from 'react';

import './CardInfo.css';

const CardInfo = (props) => {
    return (
        <div id="cardInfo">
            <span className="discardPile">
                <h3>Discarded Cards:</h3>
                {props.discardPile && Object.keys(props.discardPile).map((characterCard, index) => {
                    return <p key={index}>{`${characterCard}: ${props.discardPile[characterCard]}`}</p>
                })}
            </span>

            <span className="remainingCardSlots">
                <h3>Remaining Card Slots:</h3>
                {props.users && props.users.map((user, index) => {
                    return <p key={index}>{`${user.username}: ${props.playerCards[user.id].length}`}</p>
                })}
            </span>

            <span className="remainingCards">
                <h3>Remaining Cards:</h3>
                <h3>{props.remainingCards}</h3>
            </span>
        </div>
    );
};

export default CardInfo;