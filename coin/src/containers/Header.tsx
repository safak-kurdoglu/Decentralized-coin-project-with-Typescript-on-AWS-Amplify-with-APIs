import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createKey, createTransactionNum } from '../graphql/mutations';
import { assign, login } from "../store/reducer";
import { listNodes, getKey } from '../graphql/queries';
import { API } from 'aws-amplify';
import { Link } from "react-router-dom";
import awsExports from "../aws-exports";
import axios from "axios";
import forge from "node-forge"

const Header = () => {
  const [nodes, setNodes] = useState([]);
  const [username, setUsername] = useState("");
  
  let logout: boolean = useSelector((state: any) => state.store).logout;
  const dispatch = useDispatch();

  useEffect(() => {
    const headers = { "content-type": "application/json", "x-api-key": awsExports["aws_appsync_apiKey"] };
    const graphqlQuery = { "query": listNodes };
    axios({ url: awsExports["aws_appsync_graphqlEndpoint"], method: 'post', headers: headers, data: graphqlQuery })
    .then((resp) => {
      console.log(resp);
      const nodesModel = resp.data.data.listNodes.items;
      let nodes: {uri: string, x: number, y: number}[] = [];
      nodesModel.forEach((nodeModel) => {
        const node: {uri: string, x: number, y: number} = {uri: nodeModel.id, x:nodeModel.x, y: nodeModel.y}
        nodes.push(node);
      });
      setNodes(nodes);
      dispatch(assign(nodes));

      //if user gives location, then sort nodes by distance.
      navigator.geolocation.getCurrentPosition((pos) => {
        const sortedNodes: object[] = sortNodes(nodes, pos.coords.longitude, pos.coords.latitude);
        setNodes(sortedNodes);
        dispatch(assign(sortedNodes));
      });
    })
    .catch((error: any) => {
      console.log(error);
    });
  }, []);
  
  useEffect(() => {
    if(logout){
      (Array.from(document.getElementsByClassName('btn-show-login') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
      (Array.from(document.getElementsByClassName('btn-show-create') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block"; 
      dispatch(login(false));
    }else if(localStorage.getItem("username")){
      (Array.from(document.getElementsByClassName('btn-show-login') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
      (Array.from(document.getElementsByClassName('btn-show-create') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none"; 
    }
  }, [logout]);

  const handleShowCreate = () => {
    (Array.from(document.getElementsByClassName('create-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
    (Array.from(document.getElementsByClassName('login-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
  }

  const handleShowLogin = () => {
    (Array.from(document.getElementsByClassName('login-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
    (Array.from(document.getElementsByClassName('create-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
  }

  const handleUsername = e => {
    setUsername(e.target.value);
  };

  const handleLogin = async () => {
    try{
      const nodesTotal = nodes.length
      if(nodesTotal){
        //getting private key.
        const keyResp: any = await API.graphql({
          query: getKey,
          variables: { id: username }
        });

        let i = 0;
        //doing wallet login with private key.
        const loginReqs = () => {
          axios.post(nodes[i].uri+"/wallet-login",{
            key: keyResp.data.getKey.key
          })
          .then((resp) => {
            if(resp.data.status){
              alert("Logged in successfully.");
              localStorage.setItem('username', username);
              localStorage.setItem('amount', resp.data.amount);
              (Array.from(document.getElementsByClassName('btn-show-login') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
              (Array.from(document.getElementsByClassName('btn-show-create') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
              (Array.from(document.getElementsByClassName('login-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
              dispatch(login(true));
            }
            else{
              //if the node didn't registered this wallet successfully or something went wrong, then try next node.
              i++;
              if(i<nodesTotal)
                loginReqs();
              else
                alert("There are no responding nodes.")
            }
          })
          .catch(() => {
            //if node didn't respond anything or something went wrong, then try next node.
            i++;
            if(i<nodesTotal)
              loginReqs();
            else
              alert("There are no responding nodes.")
          });
        }
          loginReqs();
      }
      else
        alert("There is no connected node. Please refresh the page.")
    }
    catch(error){
      //graphql error
      alert(error.errors[0].message);
      console.log(error.errors[0]);
    }
  }
 
  const handleCreateWallet = async () => {
    try{
      const nodesTotal = nodes.length
      if(nodesTotal){
        var pki = forge.pki;
        var rsa = forge.pki.rsa;
        var keypair = rsa.generateKeyPair({bits: 1024});
        var pubKeyPEM = (pki.publicKeyToPem(keypair.publicKey)).replaceAll("\r\n", "  ").trim();
        var privKeyPEM = (pki.privateKeyToPem(keypair.privateKey)).replaceAll("\r\n", "  ").trim();

        //registering username
        await API.graphql({ 
          query: createKey, 
          variables: { input: {id : username, key: privKeyPEM} }
        });
        //registering transactionNum
        await API.graphql({ 
          query: createTransactionNum, 
          variables: { input: {id : username, transactionNum: 0} }
        });

        let i = 0;
        const createWalletReqs = () => {
          axios.post(nodes[i].uri+"/new-wallet",{
            key: privKeyPEM
          }).then(() => {
            alert("Your username = "+username +"\nYour secret key = "+pubKeyPEM);
            (Array.from(document.getElementsByClassName('create-wallet') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
          })
          .catch(() => {
            //if node didn't respond anything or something went wrong, then try next node.
            i++;
            if(i<nodesTotal)
              createWalletReqs();
            else
              alert("There are no responding nodes.")
          });
        }
        createWalletReqs();
      }
      else
        alert("There is no connected node. Please refresh the page.")
    }
    catch(error){
      //graphql error
      alert(error.errors[0].message);
      console.log(error.errors[0]);
    }
  }

  const sortNodes = (nodes: object[], x: number, y: number) => {
    let items: object[] = [];
    nodes.forEach((node) => {
      items.push(node);
    });

    return quickSort(items, 0, items.length-1, x, y);
  }

  function swap(items, leftIndex, rightIndex){
    let temp = items[leftIndex];
    items[leftIndex] = items[rightIndex];
    items[rightIndex] = temp;
  }

  function partition(items, left, right, x, y) {
    let pivot = items[Math.floor((right + left) / 2)]; //middle element
    let pivotDistance = (Math.pow(pivot.x-x, 2) + Math.pow(pivot.y-y, 2));
    let  i = left; //left pointer
    let  j = right; //right pointer
    while (i <= j) {
        while ((Math.pow(items[i].x-x, 2) + Math.pow(items[i].y-y, 2))  < pivotDistance) {
            i++;
        }
        while ((Math.pow(items[j].x-x, 2) + Math.pow(items[j].y-y, 2))  > pivotDistance) {
            j--;
        }
        if (i <= j) {
            swap(items, i, j); //sawpping two elements
            i++;
            j--;
        }
    }
    return i;
  }

  function quickSort(items, left, right, x, y) {
    let index;
    if (items.length > 1) {
        index = partition(items, left, right, x, y); //index returned from partition
        if (left < index - 1) { //more elements on the left side of the pivot
            quickSort(items, left, index - 1, x, y);
        }
        if (index < right) { //more elements on the right side of the pivot
            quickSort(items, index, right, x, y);
        }
    }
    return items;
  }

  return (
    <div className="ui fixed menu">
      <div className="ui container center navbar">
        <Link to={`/`}>
          <h2>Shila</h2>
        </Link>

        <button onClick={handleShowLogin} className="btn btn-show-login">
          Login With Wallet
        </button>

        <button onClick={handleShowCreate} className="btn btn-show-create">
          Create New Wallet
        </button>
        
        <div className="create-wallet">
          <input className="input input-username"
            type="text"
            placeholder="username"
            value={username}
            onChange={handleUsername}
          /> &nbsp; &nbsp;
          <button onClick={handleCreateWallet} className="btn btn-create-wallet">
            Create
          </button>
        </div>

        <div className="login-wallet">
          <input className="input input-username"
            type="text"
            placeholder="username"
            value={username}
            onChange={handleUsername}
          /> &nbsp; &nbsp;
          <button onClick={handleLogin} className="btn btn-login">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
