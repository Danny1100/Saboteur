import React from 'react';

const CardInfo = (props) => {
    return (
        <div style={{paddingLeft: "0.5%", paddingRight: "0.5%", borderStyle: "solid"}}>
            <span className="discardPile" style={{float: "left", display: "inline-block"}}>
                <h3>Discarded Cards:</h3>
                {props.discardPile && Object.keys(props.discardPile).map((characterCard, index) => {
                    return <p key={index} style={{margin: "0.2%", textAlign: "left"}}>{`${characterCard}:${props.discardPile[characterCard]}`}</p>
                })}
            </span>

            <span className="remainingCardSlots" style={{display: "inline-block"}}>
                <h3>Remaining Card Slots:</h3>
                {props.playerCards && Object.keys(props.playerCards).map((id, index) => {
                    return <p key={index}>{`${id}: ${props.playerCards[id].length}`}</p>
                })}
            </span>

            <span className="remainingCards" style={{float: "right", display: "inline-block"}}>
                <h3>Remaining Cards:</h3>
                <h3>{props.remainingCards}</h3>
            </span>
        </div>
    );
};

export default CardInfo;