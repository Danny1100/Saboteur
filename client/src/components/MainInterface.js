import React from 'react';
import './MainInterface.css'
import lostCard from '../assets/Lost Card.png';

const MainInterface = (props) => {
    return (
        <div id="mainInterface">
            <div className="history">{props.history}</div>
            <div className="myCards">
                {props.activeCard ? 
                <span className="activeCard">
                    <img src={props.activeCard} alt="Active Card"/>
                    <h2>Active Card</h2>
                </span>
                :
                <span className="activeCard">
                    <img src={lostCard} alt="Active Card"/>
                    <h2>Active Card</h2>
                </span>}

                {props.permanentCard ?
                <span className="permanentCard">
                    <img src={props.permanentCard} alt="Permanent Card"/>
                    <h2>Permanent Card</h2>
                </span>
                :
                <span className="permanentCard">
                    <img src={lostCard} alt="Permanent Card"/>
                    <h2>Permanent Card</h2>
                </span>}
            </div>
        </div>        
    );
};

export default MainInterface;