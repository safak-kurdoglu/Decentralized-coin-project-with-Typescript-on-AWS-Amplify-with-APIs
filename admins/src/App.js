import { withAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify'
import { API } from 'aws-amplify'
import '@aws-amplify/ui/dist/styles.css';
import "./App.css";
import axios from 'axios';
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const App = () => {

  const removeNode = (uri) => {
    API.graphql({ 
      query: `mutation DeleteNode(
                $input: DeleteNodeInput!
                $condition: ModelNodeConditionInput
              ) {
                deleteNode(input: $input, condition: $condition) {
                  id
                  x
                  y
                  createdAt
                  updatedAt
                }
              }`, 
              variables: { input: { id: uri } }
    });

    return;
  }
  
  const removeOfflineNodes = async () => { 
    try {             
      const apiKey = (await axios("your-rest-api-url")).data;
      const headers = { "content-type": "application/json", "x-api-key": apiKey };
      const graphqlQuery = { "query": `query ListNodes(
                                         $filter: ModelNodeFilterInput
                                         $limit: Int
                                         $nextToken: String
                                       ) {
                                         listNodes(filter: $filter, limit: $limit, nextToken: $nextToken) {
                                           items {
                                             id
                                             x
                                             y
                                           }
                                           nextToken
                                         }
                                       }`
      }
      
      const resp = await axios({ url: "your-graphql-api-url", 
                                 method: 'post', 
                                 headers: headers, 
                                 data: graphqlQuery 
      })
      const allNodes = resp.data.data.listNodes.items;
      allNodes.forEach(node => {
        axios.get(node.id + '/check-connection').catch(() => { removeNode(node.id); });
      });
    } 
    catch(error){  
      alert("something went wrong");
      console.log(error);
    }
  }

  return ( 
    <div className="App">
      <button onClick={removeOfflineNodes} className="btn btn-remove">
        removeOfflineNodes
      </button>
    </div>
  ); 
}

export default withAuthenticator(App);
