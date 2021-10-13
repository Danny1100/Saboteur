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
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div>
                            <MainInterface
                                history={props.history}
                                permanentCard={props.permanentCard}
                                activeCard={props.activeCard}
                            />

                            <div className="actions" style={{position: "fixed", left: "0", bottom: "0", width: "100%"}}>
                                <button style={{margin: "2%", marginRight: "25%"}} onClick={props.drawAction}>Draw</button>
                                <button style={{margin: "2%", marginLeft: "25%"}} onClick={props.executeAction}>Execute</button>
                            </div>                            
                        </div>                                         

                    </div>
                );

            case "notPlayerTurn":
                return (
                    <div id="notPlayerTurn">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
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
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <h2 style={{paddingTop: "8%"}}>Choose a player to execute:</h2>
                        <div>
                            {props.users && props.users.map((user, index) => {
                                if(user.id !== props.id && props.playerCards[user.id].length === 2) {
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
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <h2 style={{paddingTop: "4%"}}>Try to guess {props.chosenPlayer}'s permanent card and active card:</h2>
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

            case "executeFailedChooseCardToLose":
                return (
                    <div id="executeFailedChooseCardToLose">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div style={{paddingTop: "10%"}}>
                            <h2>Execute Failed. You have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <span key={index} style={{margin: "3%"}} onChange={props.chooseCard}>
                                            <input type="radio" value={card} name="executeFailedChooseCardToLose"></input>
                                            <label>{card}</label>
                                        </span>
                                    );
                                } else {
                                    return "error in executeFailedChooseCardToLose";
                                }
                            })}
                        </div>
                        <button style={{margin: "3%"}} onClick={props.executeFailedLoseCard}>Confirm</button>
                    </div>
                );


            case "executeSuccessChooseCardToLose":
                return (
                    <div id="executeSuccessChooseCardToLose">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div style={{paddingTop: "10%"}}>
                            <h2>You were successfully executed. You have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <span key={index} style={{margin: "3%"}} onChange={props.chooseCard}>
                                            <input type="radio" value={card} name="executeSuccessChooseCardToLose"></input>
                                            <label>{card}</label>
                                        </span>
                                    );
                                } else {
                                    return "error in executeSuccessChooseCardToLose";
                                }
                            })}
                        </div>
                        <button style={{margin: "3%"}} onClick={props.executeSuccessLoseCard}>Confirm</button>
                    </div>
                );               
            
            case "executeSuccessChooseCardToDraw":
                return (
                    <div id="executeSuccessChooseCardToDraw">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div className="myCards">
                            <h2>Choose a card to be your active card:</h2>
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.drawnCard} name="executeSuccessChooseCardToDraw"></input>
                                <label>{props.drawnCard}</label>
                                <h3>Drawn card</h3>
                            </span>
                            <span style={{display: "inline-block", margin: "7%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.activeCard} name="executeSuccessChooseCardToDraw"></input>
                                <label>{props.activeCard}</label>
                                <h3>Previous Card</h3>
                            </span>
                        </div>
                        <button onClick={props.executeSuccessDrawCard}>Confirm</button>
                    </div>
                );


            case "drawActionChooseCardToDraw":
                return (
                    <div id="drawActionChooseCardToDraw">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div className="myCards">
                            <h2>Choose a card to be your active card:</h2>
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.drawnCard} name="drawActionChooseCardToDraw"></input>
                                <label>{props.drawnCard}</label>
                                <h3>Drawn card</h3>
                            </span>
                            <span style={{display: "inline-block", margin: "7%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.activeCard} name="drawActionChooseCardToDraw"></input>
                                <label>{props.activeCard}</label>
                                <h3>Previous Card</h3>
                            </span>
                        </div>
                        <button onClick={props.confirmNewCard}>Confirm</button>
                    </div>
                );

            case "chooseCharacterAction":
                return (
                    <div id="chooseCharacterAction"> 
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div>
                            <MainInterface
                                history={props.history}
                                permanentCard={props.permanentCard}
                                activeCard={props.activeCard}
                            />

                            <div className="actions" style={{position: "fixed", left: "0", bottom: "0", width: "100%"}}>
                                <button style={{margin: "5%"}} onClick={props.assassinAction}>Assassin</button>
                                <button style={{margin: "5%"}} onClick={props.prophetAction}>Prophet</button>
                                <button style={{margin: "5%"}} onClick={props.archmageAction}>Archmage</button>
                                <button style={{margin: "5%"}} onClick={props.rogueAction}>Rogue</button>
                            </div>                            
                        </div>                                         

                    </div>
                );

            case "assassinChoosePlayer":
                return (
                    <div id="assassinChoosePlayer">
                    <CardInfo
                        discardPile={props.discardPile}
                        remainingCards={props.remainingCards}
                        users={props.users}
                        playerCards={props.playerCards}
                    />
                    <h2 style={{paddingTop: "8%"}}>Choose a player to use Assassin on:</h2>
                    <div>
                        {props.users && props.users.map((user, index) => {
                            if(user.id !== props.id && props.playerCards[user.id].length !== 0) {
                                return (
                                    <div key={index} style={{margin: "3%"}}>
                                        <input type="radio" value={user.username} name="assassinChoosePlayer" onChange={props.choosePlayer}></input>
                                        <label>{user.username}</label>                                            
                                    </div>
                                );
                            } else {
                                return "";
                            };
                        })}
                    </div>
                    <button onClick={props.assassinConfirm}>Confirm</button>
                </div>
                );

            case "assassinGuessActiveCard":
                return (
                    <div id="assassinGuessActiveCard">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <h2 style={{paddingTop: "4%"}}>Guess {props.chosenPlayer}'s active card:</h2>
                        <div style={{margin: "3%"}}>
                            {props.characterCards.map((characterCard, index) => {
                                return (
                                    <div key={index}>
                                        <input type="radio" value={characterCard} name="assassinGuessActiveCard" onChange={props.chooseCard}></input>
                                        <label>{characterCard}</label>                                            
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={props.assassinGuessActiveCard}>Confirm</button>
                    </div>
                );

            case "prophetSeeCards":
                return (
                    <div id="prophetSeeCards">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <h2 style={{paddingTop: "2%", whiteSpace: "pre-line"}}>{props.history}</h2>
                        <div className="myCards">
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}}>
                                <h2>{props.topCard}</h2>
                                <h3>Top Card</h3>
                            </span>
                            {
                                props.secondCard ? (
                                    <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}}>
                                        <h2>{props.secondCard}</h2>
                                        <h3>Second Card</h3>
                                    </span>
                                )
                                :
                                ""
                            }
                        </div>
                        <button style={{margin: "3%"}} onClick={props.prophetFinishSeeingCards}>Confirm</button>
                    </div>
                );

            case "archmageDrawCards":
                return (
                    <div id="archmageDrawCards">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div className="myCards">
                            <h2>Choose a card to be your active card:</h2>
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.topCard} name="archmageChooseCard"></input>
                                <label>{props.topCard}</label>
                                <h3>Top card</h3>
                            </span>
                            {
                                props.secondCard ? (
                                    <span style={{display: "inline-block", margin: "7%"}} onChange={props.chooseCard}>
                                        <input type="radio" value={props.secondCard} name="archmageChooseCard"></input>
                                        <label>{props.secondCard}</label>
                                        <h3>Second Card</h3>
                                    </span>
                                )
                                :
                                ""
                            }
                        </div>
                        <button onClick={props.archmageChoseCard}>Confirm</button>
                    </div>
                );

            case "rogueChoosePlayer":
                return (
                    <div id="rogueChoosePlayer">
                        <CardInfo
                        discardPile={props.discardPile}
                        remainingCards={props.remainingCards}
                        users={props.users}
                        playerCards={props.playerCards}
                    />
                    <h2 style={{paddingTop: "8%"}}>Choose a player to use Rogue on:</h2>
                    <div>
                        {props.users && props.users.map((user, index) => {
                            if(user.id !== props.id && props.playerCards[user.id].length !== 0) {
                                return (
                                    <div key={index} style={{margin: "3%"}}>
                                        <input type="radio" value={user.username} name="rogueChoosePlayer" onChange={props.choosePlayer}></input>
                                        <label>{user.username}</label>                                            
                                    </div>
                                );
                            } else {
                                return "";
                            };
                        })}
                    </div>
                    <button onClick={props.rogueConfirm}>Confirm</button>
                    </div>
                );

            case "rogueSeeActiveCard":
                return (
                    <div id="rogueSeeActiveCard">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <h2 style={{paddingTop: "2%", whiteSpace: "pre-line"}}>{props.history}</h2>
                        <div className="myCards">
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}}>
                                <h2>{props.topCard}</h2>
                                <h3>{`${props.chosenPlayer}'s Active Card`}</h3>
                            </span>
                        </div>
                        <button style={{margin: "3%"}} onClick={props.rogueFinishSeeingCard}>Confirm</button>
                    </div>
                );


            case "challengeAction":
                return (
                    <div id="challengeAction">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />                        
                        <MainInterface
                            history={props.history}
                            permanentCard={props.permanentCard}
                            activeCard={props.activeCard}
                        />
                        <div className="challengeActions" style={{position: "fixed", left: "0", bottom: "0", width: "100%"}}>
                            <button style={{margin: "2%", marginRight: "25%"}} onClick={props.challengeAction}>Challenge</button>
                            <button style={{margin: "2%", marginLeft: "25%"}} onClick={props.challengePass}>Pass</button>
                        </div>
                    </div>
                );

            case "countessAction":
                return (
                    <div id="countessAction">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />                        
                        <MainInterface
                            history={props.history}
                            permanentCard={props.permanentCard}
                            activeCard={props.activeCard}
                        />
                        <div className="countessActions" style={{position: "fixed", left: "0", bottom: "0", width: "100%"}}>
                            <button style={{margin: "2%", marginRight: "15%"}} onClick={props.challengeAction}>Challenge</button>
                            <button style={{margin: "2%", marginLeft: "10%", marginRight: "10%"}} onClick={props.countessAction}>Countess</button>
                            <button style={{margin: "2%", marginLeft: "15%"}} onClick={props.challengePass}>Pass</button>
                        </div>
                    </div>
                );

            case "challengeWait":
                return (
                    <div id="challengeWait">
                      <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />                        
                        <MainInterface
                            history={props.history}
                            permanentCard={props.permanentCard}
                            activeCard={props.activeCard}
                        />
                        <h3>
                            {props.playersWaiting === 1 ? "Waiting on 1 player" : `Waiting on ${props.playersWaiting} players`}
                        </h3>  
                    </div>
                );

            case "challengeReveal":
                return (
                    <div id="challengeReveal">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div style={{paddingTop: "10%"}}>
                            <h2>You used {props.opponentAction} on {props.chosenPlayer} and {props.challengePlayer} has challenged you. Choose a card to reveal.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <span key={index} style={{margin: "3%"}} onChange={props.chooseCard}>
                                            <input type="radio" value={card} name="challengeReveal"></input>
                                            <label>{card}</label>
                                        </span>
                                    );
                                } else {
                                    return "error in challengeReveal";
                                }
                            })}
                        </div>
                        <button style={{margin: "3%"}} onClick={props.challengeReveal}>Confirm</button>
                    </div>
                );

            case "challengeCountessReveal":
                return (
                    <div id="challengeCountessReveal">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div style={{paddingTop: "10%"}}>
                            <h2>{props.history}</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <span key={index} style={{margin: "3%"}} onChange={props.chooseCard}>
                                            <input type="radio" value={card} name="challengeReveal"></input>
                                            <label>{card}</label>
                                        </span>
                                    );
                                } else {
                                    return "error in challengeCountessReveal";
                                }
                            })}
                        </div>
                        <button style={{margin: "3%"}} onClick={props.challengeCountessReveal}>Confirm</button>
                    </div>
                );

            case "loseChallenge":
                return (
                    <div id="loseChallenge">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div style={{paddingTop: "10%"}}>
                            <h2>You lost the challenge and have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <span key={index} style={{margin: "3%"}} onChange={props.chooseCard}>
                                            <input type="radio" value={card} name="loseChallenge"></input>
                                            <label>{card}</label>
                                        </span>
                                    );
                                } else {
                                    return "error in loseChallenge";
                                }
                            })}
                        </div>
                        <button style={{margin: "3%"}} onClick={props.loseChallenge}>Confirm</button>
                    </div>
                );

            case "loseCountessChallenge":
                return (
                    <div id="loseCountessChallenge">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div style={{paddingTop: "10%"}}>
                            <h2>You lost the challenge and have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <span key={index} style={{margin: "3%"}} onChange={props.chooseCard}>
                                            <input type="radio" value={card} name="loseCountessChallenge"></input>
                                            <label>{card}</label>
                                        </span>
                                    );
                                } else {
                                    return "error in loseCountessChallenge";
                                }
                            })}
                        </div>
                        <button style={{margin: "3%"}} onClick={props.loseCountessChallenge}>Confirm</button>
                    </div>
                ); 

            case "challengeWonDrawCard":
                return (
                    <div id="challengeWonDrawCard">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div className="myCards">
                            <h2>You won the challenge. Choose a card to be your active card:</h2>
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.drawnCard} name="challengeWonDrawCard"></input>
                                <label>{props.drawnCard}</label>
                                <h3>Drawn card</h3>
                            </span>
                            <span style={{display: "inline-block", margin: "7%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.opponentAction} name="challengeWonDrawCard"></input>
                                <label>{props.opponentAction}</label>
                                <h3>Previous Card</h3>
                            </span>
                        </div>
                        <button onClick={props.challengeWonDrawCard}>Confirm</button>
                    </div>
                );

            case "challengeCountessWonDrawCard":
                return (
                    <div id="challengeCountessWonDrawCard">
                        <CardInfo
                            discardPile={props.discardPile}
                            remainingCards={props.remainingCards}
                            users={props.users}
                            playerCards={props.playerCards}
                        />
                        <div className="myCards">
                            <h2>You won the challenge. Choose a card to be your active card:</h2>
                            <span style={{display: "inline-block", margin: "7%", paddingTop: "15%"}} onChange={props.chooseCard}>
                                <input type="radio" value={props.drawnCard} name="challengeWonDrawCard"></input>
                                <label>{props.drawnCard}</label>
                                <h3>Drawn card</h3>
                            </span>
                            <span style={{display: "inline-block", margin: "7%"}} onChange={props.chooseCard}>
                                <input type="radio" value="Countess" name="challengeWonDrawCard"></input>
                                <label>Countess</label>
                                <h3>Previous Card</h3>
                            </span>
                        </div>
                        <button onClick={props.challengeCountessWonDrawCard}>Confirm</button>
                    </div>
                );

            case "loseScreen":
                return (
                    <div id="loseScreen">
                        <h2>{props.history}</h2>
                        <button>Play Again</button>
                    </div>
                );

            case "winScreen":
                return (
                    <div id="winScreen">
                        <h2>Congratulations! You won!</h2>
                        <button>Play Again</button>
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