import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getKey, getTransactionNum } from '../graphql/queries';
import { updateTransactionNum } from '../graphql/mutations';
import { logout } from "../store/reducer";
import { API } from 'aws-amplify'
import forge from "node-forge";
import axios from "axios";

const Wallet = () => {
  const [publicKey, setPublicKey] = useState(""); 
  const [recipientUserName, setRecipientUserName] = useState("");
  const [amount, setAmount] = useState(0);
  let nodes: {uri: string, address: string, x: number, y: number}[] = useSelector((state: any) => state.store).nodes;
  let login: boolean = useSelector((state: any) => state.store).login;
  const dispatch = useDispatch();

  useEffect(() => {
    if(localStorage.getItem("username")){
      (Array.from(document.getElementsByClassName('wallet-div') as HTMLCollectionOf<HTMLElement>))[0].style.display = "block";
      (Array.from(document.getElementsByClassName('amount') as HTMLCollectionOf<HTMLElement>))[0].innerHTML = localStorage.getItem("amount");
      dispatch(logout(false));
    }
  }, [login]);

  const handlePublicKey = e => {
    setPublicKey(e.target.value);
  };

  const handleRecipientUserName = e => {
    setRecipientUserName(e.target.value);
  };

  const handleAmount = e => {
    setAmount(e.target.value);
  };

  const handleLogout = () => {
    (Array.from(document.getElementsByClassName('wallet-div') as HTMLCollectionOf<HTMLElement>))[0].style.display = "none";
    localStorage.removeItem('username');
    localStorage.removeItem('amount');
    dispatch(logout(true));
  }

  const handleReLogin = (myKey) => {
    const nodesTotal = nodes.length
    if(nodesTotal){
      let i = 0;
      const reLoginReqs = () => {
        axios.post(nodes[i].uri+"/wallet-login",{
          key: myKey
        }).then((resp) => {
          if(resp.data.status){
            localStorage.setItem('amount', resp.data.amount);
            (Array.from(document.getElementsByClassName('amount') as HTMLCollectionOf<HTMLElement>))[0].innerHTML = localStorage.getItem("amount");
            //Logged in sucessfully, then kill interval.
          }
          else{
            //if the node didn't registered this wallet successfully or something went wrong, then try next node.
            i++;
            if(i<nodesTotal)
              reLoginReqs();
            else
              alert("There are no responding nodes.")
          }
        })
        .catch(() => {
          //if node didn't respond anything or something went wrong, then try next node.
          i++;
          if(i<nodesTotal)
            reLoginReqs();
          else
            alert("There are no responding nodes.")
        });
      }
      reLoginReqs()
      //if node is not responding, then pass on new node.
    }
    else
      alert("There is no connected node. Please refresh the page.")
  }
  
  const handleTransfer = async () => {
    try{
      const nodesTotal = nodes.length
      if(nodesTotal){
        //getting my private key (my wallets address)
        const myKeyResp: any = await API.graphql({
          query: getKey,
          variables: { id: localStorage.getItem("username") }
        });
        //getting my transactionNum data to encrypt with.
        const myTransactionResp: any = await API.graphql({
          query: getTransactionNum,
          variables: { id: localStorage.getItem("username") }
        });
        //getting recipient private key (recipient wallets address)
        const recipientKeyResp: any = await API.graphql({
          query: getKey,
          variables: { id: recipientUserName }
        });

        let pubKey;
        try{
          pubKey = forge.pki.publicKeyFromPem(publicKey);
        }
        catch(e){
          alert("Wrong key format.")
        }

        const encryptText = pubKey.encrypt(forge.util.encodeUtf8("legit-start-"+myTransactionResp.data.getTransactionNum.transactionNum));
        const receiver = recipientKeyResp.data.getKey.key
        const sender = myKeyResp.data.getKey.key
        let i = 0;
        const tranferReqs = () => {
          axios.post(nodes[i].uri+"/transfer",{
            senderKey: sender,
            receiverKey: receiver,
            amount: amount,
            password: encryptText
          })
          .then((resp) => {
            if(resp.data.status){
              const encryptText = pubKey.encrypt(forge.util.encodeUtf8("legit-approve"));
              //approve transactions registered on nodes.
              nodes.forEach((node) => {
                axios.put(node.uri+"/transaction-approve",{  
                  sender: sender,
                  receiver: receiver,
                  amount: amount,
                  password: encryptText,
                  nodeKey: resp.data.nodeKey
                });
              });
              alert("Trasfer successfull.");
              //updating transaction num with logged in crederentials.
              const updateDetails = {
                id: localStorage.getItem("username"),
                transactionNum: myTransactionResp.data.getTransactionNum.transactionNum + 1
              };
              API.graphql({ 
                query: updateTransactionNum, 
                variables: { input: updateDetails }
              });
              //Doing re-login for amount refresh.
              handleReLogin(sender);
            }
            else 
              alert(resp.data.message)
          })
          .catch((error) => {
            console.log(error);
            //if the node didn't respond anything or have not recorded your every transaction, then try next node.
            i++;
            if(i<nodesTotal)
              tranferReqs();
            else
              alert("There are no responding nodes.")
          });
        }
        tranferReqs();
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

  return (
    <div>
      <div className="ui container wallet-container">
        <div className="wallet-div">
          <button onClick={handleLogout} className="btn btn-logout">
           X
          </button>

          <h3 className="wallet-header">Your amount = <span className="amount"></span></h3><br/>

          <label>Enter recipient user name :</label>
          <input type="text"
            placeholder="Recipient User Name"
            value={recipientUserName}
            onChange={handleRecipientUserName}
          /> &nbsp; &nbsp; <br/><br/>

          <label>Enter amount :</label>
          <input className="input-amount"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={handleAmount}
          /> &nbsp; &nbsp; <br/><br/>

          <label>Enter your key :</label>
          <input className="input-key"
            type="text"
            placeholder="public Key"
            value={publicKey}
            onChange={handlePublicKey}
          /> &nbsp; &nbsp; <br/><br/><br/><br/> 

          <button onClick={handleTransfer} className="btn btn-transfer">
            Transfer
          </button> <br/><br/>  <br/><br/> 
        </div>
      </div>
    </div>
  );
};

export default Wallet;
