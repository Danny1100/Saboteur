import React from 'react';

const Game = (props) => {

    const renderGame = () => {
        switch(props.displayGameState) {

            case "selectPermanentCard":
                return (
                    <div id="selectPermanentCard">
                        <h3>Choose a Permanent Card:</h3>
                        <div>
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


            case "playerTurn":
                return (
                    <div id="playerTurn">
                        <div className="discardPile" style={{float: "left"}}>
                            <h3>Discarded Cards:</h3>
                            {props.discardPile && Object.keys(props.discardPile).map((characterCard) => {
                                return <p style={{margin: "0.2%", textAlign: "left"}}>{`${characterCard}:${props.discardPile[characterCard]}`}</p>
                            })}
                        </div>

                        <div className="remainingCards" style={{float: "right"}}>
                            <h3>Remaining Cards:</h3>
                            <h3>{props.remainingCards}</h3>
                        </div>

                        <div className="history" style={{paddingTop: "12%"}}>It is your turn</div>

                        <div className="myCards">
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}}>
                                <h2>{props.activeCard}</h2>
                                <h3>Active Card</h3>
                            </span>
                            <span style={{display: "inline-block", margin: "7%"}}>
                                <h2>{props.permanentCard}</h2>
                                <h3>Permanent Card</h3>
                            </span>
                        </div>

                        <div className="actions" style={{position: "fixed", left: "0", bottom: "0", width: "100%"}}>
                            <button style={{margin: "5%"}}>Draw</button>
                            <button style={{margin: "5%"}}>Execute</button>
                        </div>
                        
                    </div>
                );


            case "notPlayerTurn":
                return (
                    <div id="notPlayerTurn">
                        <div className="discardPile" style={{float: "left"}}>
                            <h3>Discarded Cards:</h3>
                            {props.discardPile && Object.keys(props.discardPile).map((characterCard) => {
                                return <p style={{margin: "0.2%", textAlign: "left"}}>{`${characterCard}:${props.discardPile[characterCard]}`}</p>
                            })}
                        </div>

                        <div className="remainingCards" style={{float: "right"}}>
                            <h3>Remaining Cards:</h3>
                            <h3>{props.remainingCards}</h3>
                        </div>

                        <div className="history" style={{paddingTop: "12%"}}>Placeholder</div>

                        <div className="myCards">
                            <span style={{display: "inline-block", margin: "5%"}}>
                                <h2>{props.activeCard}</h2>
                                <h3>Active Card</h3>
                            </span>
                            <span style={{display: "inline-block", margin: "5%"}}>
                                <h2>{props.permanentCard}</h2>
                                <h3>Permanent Card</h3>
                            </span>
                        </div>
                    </div>
                );

        };
    };

    return (
        <div id="game">
            {renderGame()}
        </div>
    );
};

export default Game;