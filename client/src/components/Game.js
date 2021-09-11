import React from 'react';

const Game = (props) => {
    return (
        <div>
            <h3>Choose a Permanent Card:</h3>
            <div>
                {props.playerCards[props.id] && props.playerCards[props.id].map((card) => {return <button>{card}</button>})}
            </div>
            <br></br>
            <button>Confirm</button>
        </div>
    );
};

export default Game;