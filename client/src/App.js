import './App.css';
import io from 'socket.io-client';
import { useState, useEffect } from 'react';

let socket;

function App() {
  //initialise socket state
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
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
    if(username !== "" && roomId !== "") {
      socket.emit("joinRoom", {username: username, roomId: roomId});
    } else {
      alert("Enter a valid Username/Room ID");
    };
  };


  return (
    <div className="App">
      <button>Create Room</button>
      <br></br>  
      <input 
      type="text" 
      placeholder="Username" 
      onChange={(event) => {
        setUsername(event.target.value);
      }}/>

      <input 
      type="text" 
      placeholder="Room ID" 
      onChange={(event) => {
        setRoomId(event.target.value);
      }}/>
      <button onClick={joinRoom}>Join Room</button>
      <div>{JSON.stringify(users)}</div>
    </div>
  );
}

export default App;
