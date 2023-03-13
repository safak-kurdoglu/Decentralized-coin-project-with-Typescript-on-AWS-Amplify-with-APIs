
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify'
import Wallet from "./containers/Wallet";
import Header from "./containers/Header";
import '@aws-amplify/ui/dist/styles.css';
import "./App.css";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const App = () => {
  
  return ( 
    <div className="App">
      <Router>
        <Header/>
        <Routes>
          <Route path="/" element={<Wallet />} />
          <Route>404 Not Found!</Route>
        </Routes>
      </Router> 
    </div>
  ); 
}

export default withAuthenticator(App);
