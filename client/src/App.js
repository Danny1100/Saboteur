import './App.css';
import io from 'socket.io-client';
import { useState, useEffect } from 'react';

let socket;

function App() {
  //initialise socket state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  //might need current user, room state (i.e. display homepage/lobby/game), roomFull?                            ?????????????????????

  //initialise socket on startup and cleanup once finished
  useEffect(() => {
    socket = io.connect("http://localhost:3001");

    //cleanup on component unmount
    return function cleanup() {
      socket.disconnect();
      //shut down connnection instance
      socket.off();
    };
    
  }, []);

  useEffect(() => {
    socket.on("joinError", (error) => {
      alert(error);
    })

    socket.on("playerJoined", (users) => {
      setUsers(users);
      console.log(users);
    });
  }, []);

  //Function to join a room
  const joinRoom = () => {
    if(username !== "" && password !== "") {
      socket.emit("joinRoom", {username: username, password: password});
    } else {
      alert("Enter a valid Username and Password");
    };
  };


  return (
    <div className="App">
      <input 
      type="text" 
      placeholder="Username" 
      onChange={(event) => {
        setUsername(event.target.value);
      }}/>
      <br></br>
      <input 
      type="text" 
      placeholder="Password" 
      onChange={(event) => {
        setPassword(event.target.value);
      }}/>
      <br></br>
      <button onClick={joinRoom}>Join Room</button>
      <h3>Players:</h3>
      <div>{users.map((user) => {return <p>{user.username}</p>})}</div>
      <br></br>
      <button>Start Game</button>
    </div>
  );
}

export default App;
