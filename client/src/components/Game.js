import React from 'react';
import CardInfo from './CardInfo';
import MainInterface from './MainInterface';

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
                                            <input type="radio" value={card} name="selectPermanentCard"></input>
                                            <label>{card}</label>
                                        </span>
                                    )
                                } else {
                                    return "error in selectPermanentCard";
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
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                        />                                         
                        <MainInterface
                            history={props.history}
                            permanentCard={props.permanentCard}
                            activeCard={props.activeCard}
                        />

                        <div className="actions" style={{position: "fixed", left: "0", bottom: "0", width: "100%"}}>
                            <button style={{margin: "5%"}} onClick={props.drawAction}>Draw</button>
                            <button style={{margin: "5%"}} onClick={props.executeAction}>Execute</button>
                        </div>
                        
                    </div>
                );


            case "notPlayerTurn":
                return (
                    <div id="notPlayerTurn">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                        />                        
                        <MainInterface
                            history={props.history}
                            permanentCard={props.permanentCard}
                            activeCard={props.activeCard}
                        />
                    </div>
                );
            

            case "executeChoosePlayer":
                return (
                    <div id="executeChoosePlayer">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                        />
                        <h2 style={{paddingTop: "12%"}}>Choose a player to execute:</h2>
                        <div>
                            {props.users && props.users.map((user, index) => {
                                if(user.id !== props.id) {
                                    return (
                                        <div key={index} style={{margin: "3%"}}>
                                            <input type="radio" value={user.username} name="executeChoosePlayer" onChange={props.choosePlayer}></input>
                                            <label>{user.username}</label>                                            
                                        </div>
                                    );
                                } else {
                                    return "";
                                };
                            })}
                        </div>
                        <button onClick={props.executeChooseCards}>Confirm</button>
                    </div>
                );


            case "executeChooseCards":
                return (
                    <div id="executeChooseCards">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                        />
                        <h2 style={{paddingTop: "12%"}}>Try to guess {props.chosenPlayer}'s permanent card and active card:</h2>
                        <div>
                            <span style={{display: "inline-block", margin: "3%"}}>
                                <h3>Permanent Card:</h3>
                                {props.characterCards.map((characterCard, index) => {
                                    return (
                                        <div key={index}>
                                            <input type="radio" value={characterCard} name="executeChoosePermanentCard" onChange={props.executeChoosePermanentCard}></input>
                                            <label>{characterCard}</label>                                            
                                        </div>
                                    );
                                })}
                            </span>

                            <span style={{display: "inline-block", margin: "3%"}}>
                                <h3>Active Card:</h3>
                                {props.characterCards.map((characterCard, index) => {
                                    return (
                                        <div key={index}>
                                            <input type="radio" value={characterCard} name="executeChooseActiveCard" onChange={props.executeChooseActiveCard}></input>
                                            <label>{characterCard}</label>                                            
                                        </div>
                                    );
                                })}
                            </span>
                        </div>
                        <button onClick={props.executeConfirm}>Confirm</button>
                    </div>
                ); 

            case "chooseCardToLose":
                return (
                    <div id="chooseCardToLose">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                        />
                        <div style={{paddingTop: "12%"}}>
                            <h2>Execute Failed. You have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <span key={index} style={{margin: "3%"}} onChange={props.chooseCard}>
                                            <input type="radio" value={card} name="chooseCardToLose"></input>
                                            <label>{card}</label>
                                        </span>
                                    );
                                } else {
                                    return "error in chooseCardToLose";
                                }
                            })}
                        </div>
                        <button style={{margin: "3%"}} onClick={props.executeLoseCard}>Confirm</button>
                    </div>
                );

            default:
                return <p>Something went wrong. Check the displayGameState hook.</p>
        };
    };

    return (
        <div id="game">
            {renderGame()}
        </div>
    );
};

export default Game;