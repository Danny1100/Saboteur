import React from 'react';

const CardInfo = (props) => {
    return (
        <div>
            <div className="discardPile" style={{float: "left"}}>
                <h3>Discarded Cards:</h3>
                {props.discardPile && Object.keys(props.discardPile).map((characterCard, index) => {
                    return <p key={index} style={{margin: "0.2%", textAlign: "left"}}>{`${characterCard}:${props.discardPile[characterCard]}`}</p>
                })}
            </div>

            <div className="remainingCards" style={{float: "right"}}>
                <h3>Remaining Cards:</h3>
                <h3>{props.remainingCards}</h3>
            </div>
        </div>
    );
};

export default CardInfo;