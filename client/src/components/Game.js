import React from 'react';

const Game = (props) => {
    return (
        <div>
            <div id="selectPermanantCard">
                <h3>Choose a Permanent Card:</h3>
                {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                    if(card) {
                        return (
                            <span key={index} onChange={props.selectPermanentCard}>
                                <input type="radio" value={card} name="playerCards"></input>
                                <label>{card}</label>
                            </span>
                        )
                    } else {
                        return "";
                    }
                })}
            </div>
            <br></br>
            <p>You have selected {props.permanentCard} as your permanent card. {props.activeCard} will be your active card.</p>
            <button id="confirmPermanentCardButton" onClick={props.submitPermanentCard}>{props.confirmButtonMessage}</button>
        </div>
    );
};

export default Game;