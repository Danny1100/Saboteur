import React from 'react';
import CardInfo from './CardInfo';
import MainInterface from './MainInterface';
import './Game.css';

import assassinCard from '../assets/Assassin Card.png';
import countessCard from '../assets/Countess Card.png';
import prophetCard from '../assets/Prophet Card.png';
import archmageCard from '../assets/Archmage Card.png';
import rogueCard from '../assets/Rogue Card.png';
import saboteurCard from '../assets/Saboteur Card.png';


const Game = (props) => {

    const characterCardImages = {Assassin: assassinCard, Countess: countessCard, Prophet: prophetCard, Archmage: archmageCard, Rogue: rogueCard, Saboteur: saboteurCard};

    const renderGame = () => {
        switch(props.displayGameState) {

            case "selectPermanentCard":
                return (
                    <div id="selectPermanentCard">
                        <h2>Choose a Permanent Card:</h2>
                        <div className="selectPermanentCardContainer">
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <label className="selectPermanentCardLabel" key={index}>
                                            <input id={"chosenPermanentCard"+index} type="radio" value={card} name="selectPermanentCardInput" onChange={props.selectPermanentCard}></input>
                                            <span className="selectPermanentCardSpan">
                                                <img src={characterCardImages[card]} alt={card}/>
                                            </span>
                                        </label>
                                    )
                                } else {
                                    return "error in selectPermanentCard";
                                }
                            })}
                        </div>
                        <br></br>
                        <p>{props.permanentCard === "" ? "" : 
                            `You have selected ${props.permanentCard} as your permanent card. ${props.activeCard} will be your active card.`}
                        </p>
                        <div className="bottomBar">
                            <button id="confirmPermanentCardButton" className="blueButton" onClick={props.submitPermanentCard}>{props.confirmButtonMessage}</button>
                        </div>
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
                                permanentCard={characterCardImages[props.permanentCard]}
                                activeCard={characterCardImages[props.activeCard]}
                            />

                            <div className="bottomBar">
                                <button id="drawButton" className="blueButton" onClick={props.drawAction}>Draw</button>
                                <button id="executeButton" className="redButton" onClick={props.executeAction}>Execute</button>
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
                            permanentCard={characterCardImages[props.permanentCard]}
                            activeCard={characterCardImages[props.activeCard]}
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
                        <h2>Choose a player to execute:</h2>
                        <div>
                            {props.users && props.users.map((user, index) => {
                                if(user.id !== props.id && props.playerCards[user.id].length === 2) {
                                    return (
                                        <label className="choosePlayer" key={index}>
                                            <input type="radio" value={user.username} name="executeChoosePlayer" onChange={props.choosePlayer}></input>
                                            <div className="radioButton">
                                                <h3>{user.username}</h3>
                                            </div>
                                        </label>
                                    );
                                } else {
                                    return "";
                                };
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.executeChooseCards}>Confirm</button>
                        </div>
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
                        <h2>Try to guess {props.chosenPlayer}'s permanent card and active card:</h2>
                        <div>
                            <span className="executeChooseCardsSpan">
                                <h3>Permanent Card:</h3>
                                {props.characterCards.map((characterCard, index) => {
                                    return (
                                        <label className="guessCard" key={index}>
                                            <input type="radio" value={characterCard} name="executeChoosePermanentCard" onChange={props.executeChoosePermanentCard}></input>
                                            <div className="radioButton">
                                                <p>{characterCard}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </span>

                            <span className="executeChooseCardsSpan">
                                <h3>Active Card:</h3>
                                {props.characterCards.map((characterCard, index) => {
                                    return (
                                        <label className="guessCard" key={index}>
                                            <input type="radio" value={characterCard} name="executeChooseActiveCard" onChange={props.executeChooseActiveCard}></input>
                                            <div className="radioButton">
                                                <p>{characterCard}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </span>
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.executeConfirm}>Confirm</button> 
                        </div>
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
                        <div>
                            <h2>Execute Failed. You have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <label className="executeChooseCard" key={index}>
                                            <input type="radio" value={card} name="executeFailedChooseCardToLose" onChange={props.chooseCard}></input>
                                            <span className="executeChooseCardSpan">
                                                <img src={characterCardImages[card]} alt={card}/>
                                            </span>
                                        </label>
                                    );
                                } else {
                                    return "error in executeFailedChooseCardToLose";
                                }
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.executeFailedLoseCard}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>You were successfully executed. You have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <label className="executeChooseCard" key={index}>
                                            <input type="radio" value={card} name="executeSuccessChooseCardToLose" onChange={props.chooseCard}></input>
                                            <span className="executeChooseCardSpan">
                                                <img src={characterCardImages[card]} alt={card}/>
                                            </span>
                                        </label>
                                    );
                                } else {
                                    return "error in executeSuccessChooseCardToLose";
                                }
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.executeSuccessLoseCard}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>Choose a card to be your active card:</h2>
                                <label className="chooseCard">
                                    <input type="radio" value={props.drawnCard} name="executeSuccessChooseCardToDraw" onChange={props.chooseCard}></input>
                                    <span className="chooseCardSpan">
                                        <img src={characterCardImages[props.drawnCard]} alt={props.drawnCard}/>
                                    </span>
                                    <h2>Drawn card</h2>
                                </label>
                                <label className="chooseCard">
                                    <input type="radio" value={props.activeCard} name="executeSuccessChooseCardToDraw" onChange={props.chooseCard}></input>
                                    <span className="chooseCardSpan">
                                        <img src={characterCardImages[props.activeCard]} alt={props.activeCard}/>
                                        <h2>Previous card</h2>
                                    </span>
                                </label>                                                 
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.executeSuccessDrawCard}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>Choose a card to be your active card:</h2>
                            <label className="chooseCard">
                                <input type="radio" value={props.drawnCard} name="drawActionChooseCardToDraw" onChange={props.chooseCard}></input>
                                <span className="chooseCardSpan">
                                    <img src={characterCardImages[props.drawnCard]} alt={props.drawnCard}/>
                                </span>
                                <h2>Drawn card</h2>
                            </label>
                            <label className="chooseCard">
                                <input type="radio" value={props.activeCard} name="drawActionChooseCardToDraw" onChange={props.chooseCard}></input>
                                <span className="chooseCardSpan">
                                    <img src={characterCardImages[props.activeCard]} alt={props.activeCard}/>
                                    <h2>Previous card</h2>
                                </span>
                            </label>
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.confirmNewCard}>Confirm</button>
                        </div>
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
                                permanentCard={characterCardImages[props.permanentCard]}
                                activeCard={characterCardImages[props.activeCard]}
                            />

                            <div className="bottomBar">
                                <button className="assassinButton" onClick={props.assassinAction}>Assassin</button>
                                <button className="prophetButton" onClick={props.prophetAction}>Prophet</button>
                                <button className="archmageButton" onClick={props.archmageAction}>Archmage</button>
                                <button className="rogueButton" onClick={props.rogueAction}>Rogue</button>
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
                    <h2>Choose a player to use Assassin on:</h2>
                    <div>
                        {props.users && props.users.map((user, index) => {
                            if(user.id !== props.id && props.playerCards[user.id].length !== 0) {
                                return (
                                    <label className="choosePlayer" key={index}>
                                        <input type="radio" value={user.username} name="assassinChoosePlayer" onChange={props.choosePlayer}></input>
                                        <div className="radioButton">
                                            <h3>{user.username}</h3>
                                        </div>
                                    </label>
                                );
                            } else {
                                return "";
                            };
                        })}
                    </div>
                    <div className="bottomBar">
                        <button className="blueButton" onClick={props.assassinConfirm}>Confirm</button>
                    </div>
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
                        <h2>Guess {props.chosenPlayer}'s active card:</h2>
                        <div>
                            {props.characterCards.map((characterCard, index) => {
                                return (
                                    <label id="assassinGuessCard" key={index}>
                                        <input type="radio" value={characterCard} name="assassinGuessActiveCard" onChange={props.chooseCard}></input>
                                        <div className="radioButton">
                                            <p>{characterCard}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.assassinGuessActiveCard}>Confirm</button>
                        </div>
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
                        <h2>{props.history}</h2>
                        <div>
                            <span className="prophetCards">
                            <img src={characterCardImages[props.topCard]} alt="Top Card"/>
                                <h2>Top Card</h2>
                            </span>
                            {
                                props.secondCard ? (
                                    <span className="prophetCards">
                                        <img src={characterCardImages[props.secondCard]} alt="Second Card"/>
                                        <h2>Second Card</h2>
                                    </span>
                                )
                                :
                                ""
                            }
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.prophetFinishSeeingCards}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>You used Archmage. Choose a card to be your active card:</h2>
                            <label className="chooseCard">
                                <input type="radio" value={props.topCard} name="archmageChooseCard" onChange={props.chooseCard}></input>
                                <span className="chooseCardSpan">
                                    <img src={characterCardImages[props.topCard]} alt={props.topCard}/>
                                </span>
                                <h2>Top Card</h2>
                            </label>
                            {
                                props.secondCard ? (
                                    <label className="chooseCard">
                                        <input type="radio" value={props.secondCard} name="archmageChooseCard" onChange={props.chooseCard}></input>
                                        <span className="chooseCardSpan">
                                            <img src={characterCardImages[props.secondCard]} alt={props.secondCard}/>
                                        </span>
                                        <h2>Second Card</h2>
                                    </label>
                                )
                                :
                                ""
                            }
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.archmageChoseCard}>Confirm</button>
                        </div>
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
                    <h2>Choose a player to use Rogue on:</h2>
                    <div>
                        {props.users && props.users.map((user, index) => {
                            if(user.id !== props.id && props.playerCards[user.id].length !== 0) {
                                return (
                                    <label className="choosePlayer" key={index}>
                                    <input type="radio" value={user.username} name="rogueChoosePlayer" onChange={props.choosePlayer}></input>
                                        <div className="radioButton">
                                            <h3>{user.username}</h3>
                                        </div>
                                    </label>

                                );
                            } else {
                                return "";
                            };
                        })}
                    </div>
                    <div className="bottomBar">
                        <button className="blueButton" onClick={props.rogueConfirm}>Confirm</button>
                    </div>
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
                        <h2>{props.history}</h2>
                        <div>
                            <span className="rogueCard">
                                <img src={characterCardImages[props.topCard]} alt={props.topCard}/>
                                <h2>{`${props.chosenPlayer}'s Active Card`}</h2>
                            </span>
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.rogueFinishSeeingCard}>Confirm</button>
                        </div>
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
                            permanentCard={characterCardImages[props.permanentCard]}
                            activeCard={characterCardImages[props.activeCard]}
                        />
                        <div className="bottomBar">
                            <button id="challengeButton" className="redButton" onClick={props.challengeAction}>Challenge</button>
                            <button id="passButton" className="blueButton" onClick={props.challengePass}>Pass</button>
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
                            permanentCard={characterCardImages[props.permanentCard]}
                            activeCard={characterCardImages[props.activeCard]}
                        />
                        <div className="bottomBar">
                            <button className="redButton" onClick={props.challengeAction}>Challenge</button>
                            <button className="countessButton" onClick={props.countessAction}>Countess</button>
                            <button className="blueButton" onClick={props.challengePass}>Pass</button>
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
                            permanentCard={characterCardImages[props.permanentCard]}
                            activeCard={characterCardImages[props.activeCard]}
                        />
                        <div className="bottomBar">
                            <h2 className="challengeWaitPlayers">{props.playersWaiting === 1 ? "Waiting on 1 player" : `Waiting on ${props.playersWaiting} players`}</h2>  
                        </div>
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
                        <div>
                            <h2>{props.history}</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <label className="chooseCard" key={index}>
                                            <input type="radio" value={card} name="challengeReveal" onChange={props.chooseCard}></input>
                                            <span className="chooseCardSpan">
                                                <img src={characterCardImages[card]} alt={card}/>
                                            </span>
                                        </label>
                                    );
                                } else {
                                    return "error in challengeReveal";
                                }
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.challengeReveal}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>{props.history}</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <label className="chooseCard" key={index}>
                                            <input type="radio" value={card} name="challengeReveal" onChange={props.chooseCard}></input>
                                            <span className="chooseCardSpan">
                                                <img src={characterCardImages[card]} alt={card}/>
                                            </span>
                                        </label>
                                    );
                                } else {
                                    return "error in challengeCountessReveal";
                                }
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.challengeCountessReveal}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>You lost the challenge and have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <label className="chooseCard" key={index}>
                                            <input type="radio" value={card} name="loseChallenge" onChange={props.chooseCard}></input>
                                            <span className="chooseCardSpan">
                                                <img src={characterCardImages[card]} alt={card}/>
                                            </span>
                                        </label>
                                    );
                                } else {
                                    return "error in loseChallenge";
                                }
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.loseChallenge}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>You lost the challenge and have lost a card slot. Choose a card to discard.</h2>
                            {props.playerCards[props.id] && props.playerCards[props.id].map((card, index) => {
                                if(card) {
                                    return (
                                        <label className="chooseCard" key={index}>
                                            <input type="radio" value={card} name="loseCountessChallenge" onChange={props.chooseCard}></input>
                                            <span className="chooseCardSpan">
                                                <img src={characterCardImages[card]} alt={card}/>
                                            </span>
                                        </label>
                                    );
                                } else {
                                    return "error in loseCountessChallenge";
                                }
                            })}
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.loseCountessChallenge}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>You won the challenge. Choose a card to be your active card:</h2>
                            <label className="chooseCard">
                                <input type="radio" value={props.drawnCard} name="challengeWonDrawCard" onChange={props.chooseCard}></input>
                                <span className="chooseCardSpan">
                                    <img src={characterCardImages[props.drawnCard]} alt={props.drawnCard}/>
                                </span>
                                <h2>Drawn card</h2>
                            </label>
                            <label className="chooseCard">
                                <input type="radio" value={props.opponentAction} name="challengeWonDrawCard" onChange={props.chooseCard}></input>
                                <span className="chooseCardSpan">
                                    <img src={characterCardImages[props.opponentAction]} alt={props.opponentAction}/>
                                </span>
                                <h2>Previous card</h2>
                            </label>
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.challengeWonDrawCard}>Confirm</button>
                        </div>
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
                        <div>
                            <h2>You won the challenge. Choose a card to be your active card:</h2>
                            <label className="chooseCard">
                                <input type="radio" value={props.drawnCard} name="challengeWonDrawCard" onChange={props.chooseCard}></input>
                                <span className="chooseCardSpan">
                                    <img src={characterCardImages[props.drawnCard]} alt={props.drawnCard}/>
                                </span>
                                <h2>Drawn card</h2>
                            </label>
                            <label className="chooseCard">
                                <input type="radio" value="Countess" name="challengeWonDrawCard" onChange={props.chooseCard}></input>
                                <span className="chooseCardSpan">
                                    <img src={characterCardImages["Countess"]} alt="Countess"/>
                                </span>
                                <h2>Previous card</h2>
                            </label>
                        </div>
                        <div className="bottomBar">
                            <button className="blueButton" onClick={props.challengeCountessWonDrawCard}>Confirm</button>
                        </div>
                    </div>
                );

            case "loseScreen":
                return (
                    <div className="endScreen">
                        <h2>{props.history}</h2>
                        <h2>Total Wins:</h2>
                        {props.users && props.users.map((user, index) => {
                            return <h3 key={index}>{`${user.username}: ${props.numberOfWins[user.id]}`}</h3>
                        })}
                        <div className="bottomBar">
                            <button id="playAgainButton" className="blueButton" onClick={props.playAgain}>{props.playAgainButton}</button>
                        </div>
                    </div>
                );

            case "winScreen":
                return (
                    <div id="winScreen" className="endScreen">
                        <h2>Congratulations! You won!</h2>
                        <h2>Total Wins:</h2>
                        {props.users && props.users.map((user, index) => {
                            return <h3 key={index}>{`${user.username}: ${props.numberOfWins[user.id]}`}</h3>
                        })}
                        <div className="bottomBar">
                            <button id="playAgainButton" className="blueButton" onClick={props.playAgain}>{props.playAgainButton}</button>
                        </div>
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