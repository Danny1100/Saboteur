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
            <h3>Players:</h3>
            <div>{props.users.map((user) => {return <p>{user.username}</p>})}</div>
            <br></br>
            <button>Start Game</button>
        </div>
    );
};

export default Homepage;