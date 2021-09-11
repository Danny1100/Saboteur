import React from 'react';

const Homepage = (props) => {
    return (
        <div>
            <input 
                type="text" 
                placeholder="Username" 
                onChange={(event) => {
                    props.setUsername(event.target.value);
            }}/>
            <br></br>
            <input 
                type="text" 
                placeholder="Password" 
                onChange={(event) => {
                    props.setPassword(event.target.value);
            }}/>
            <br></br>
            <button onClick={props.joinRoom}>Join Room</button>
            <br></br>
            <p>{props.numberOfPlayers === 0 ? "Enter a Name and the Password to join a room" : `This lobby needs ${props.numberOfPlayers} players to start the game`}</p>
            <h3>Players:</h3>
            <div>{props.users.map((user) => {return <p key={user.username}>{user.username}</p>})}</div>
            <br></br>
            <button onClick={props.startGame}>Start Game</button>
        </div>
    );
};

export default Homepage;