import React from 'react';

import './Homepage.css';

const Homepage = (props) => {
    return (
        <div id="homepage">
            <h1>Saboteur</h1>
            <input className="joinInput"
                id= "usernameInput"
                type="text" 
                placeholder="Username" 
                onChange={(event) => {
                    props.setUsername(event.target.value);
            }}/>
            <br></br>
            <input className = "joinInput"
                id= "passwordInput"
                type="text" 
                placeholder="Password" 
                onChange={(event) => {
                    props.setPassword(event.target.value);
            }}/>
            <br></br>
            <button className="blueButton" onClick={props.joinRoom}>Join Room</button>
            <br></br>
            <p>{props.numberOfPlayers === 0 ? "Enter a Name and the Password to join a room" : `This lobby has ${props.numberOfPlayers} players`}</p>
            <h3>{props.numberOfPlayers === 0 ? "" : "Players"}</h3>
            <div>{props.users.map((user) => {return <p key={user.username}>{user.username}</p>})}</div>
            <br></br>
            <a href='https://inspiring-mccarthy-f87e02.netlify.app' target="_blank" rel="noopener noreferrer">Click here to read the rules</a>
            <div className="bottomBar">
                <button className="blueButton" onClick={props.startGame}>Start Game</button>
            </div>
        </div>
    );
};

export default Homepage;