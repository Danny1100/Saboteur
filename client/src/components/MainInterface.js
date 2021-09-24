import React from 'react';

const MainInterface = (props) => {
    return (
        <div>
            <div className="history" style={{paddingTop: "12%"}}>{props.history}</div>

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
        </div>        
    );
};

export default MainInterface;