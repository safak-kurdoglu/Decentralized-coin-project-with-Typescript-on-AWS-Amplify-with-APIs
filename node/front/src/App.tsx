import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [username, setUsername] = useState("");
  let connectionCheckInterval: any;

  useEffect(() => {
    checkConnection();
    connectionCheckInterval = setInterval(checkConnection, 100000);
  }, []);

  const handleUserName = e => {
    setUsername(e.target.value);
  };

  const checkConnection = async () => {
    axios.get("http://localhost:3000/check-node-status")
    .then((resp) => {
      if(resp.data.status){
        (Array.from(document.getElementsByClassName('node-div') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
        (Array.from(document.getElementsByClassName('dot') as HTMLCollectionOf<HTMLElement>))[0].style.backgroundColor = "green";
        (Array.from(document.getElementsByClassName('connection') as HTMLCollectionOf<HTMLElement>))[0].innerHTML = "Connected.";
      }
      else{
        clearInterval(connectionCheckInterval);
        (Array.from(document.getElementsByClassName('node-div') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
        (Array.from(document.getElementsByClassName('dot') as HTMLCollectionOf<HTMLElement>))[0].style.backgroundColor = "#bbb";
        (Array.from(document.getElementsByClassName('connection') as HTMLCollectionOf<HTMLElement>))[0].innerHTML = "Disconnected.";
      }
    })
    .catch((error: any) => {
      console.log(error.message + "\nCause = " + error.response.data);
    });
  }

  const handleBecomeNode = () => {  
    navigator.geolocation.getCurrentPosition((pos) => {
      axios.post("http://localhost:3000/become-node",{
        username: username,
        x: pos.coords.longitude,
        y: pos.coords.latitude
      })
      .then((resp) => {
        if(resp.data.status){
          alert("New node on the network");
          (Array.from(document.getElementsByClassName('node-div') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
          (Array.from(document.getElementsByClassName('dot') as HTMLCollectionOf<HTMLElement>))[0].style.backgroundColor = "green";
          (Array.from(document.getElementsByClassName('connection') as HTMLCollectionOf<HTMLElement>))[0].innerHTML = "Connected.";
        }else  
          alert(resp.data.message) //error message coming from the main server.
      })
      .catch((error: any) => {
        console.log(error.message + "\nCause = " + error.response.data);
      });
    });
  }

  return (
    <div>
      <div className="ui container node-container">
        <span className="dot"></span>
        <p className="connection">Not Connected.</p>

        <div className="node-div">
          <input className="input input-username"
            type="text"
            placeholder="username"
            value={username}
            onChange={handleUserName}
          /> &nbsp; &nbsp;

          <button onClick={handleBecomeNode} className="btn btn-node">
            Became Transaction Node
          </button>
        </div>
      </div>
    </div>
  );
}
