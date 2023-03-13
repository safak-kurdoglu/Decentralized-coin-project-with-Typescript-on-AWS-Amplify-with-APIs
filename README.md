# Decentralized-coin-project-with-Typescript-on-AWS-Amplify-with-APIs

This is Decentralized coin project(without consensus) and main website deployed on AWS Amplify with APIs.

It is shortly explained on : https://www.youtube.com/watch?v=NKhc8B5SJls&ab_channel=safakkurdoglu

To run the program on your local computer, at the coin folder, you have to type "amplify init". 

Then do "amplify add api" that is graphql with amazon incognito authentication and update schema.graphql with,

shema.graphql :

type Node @model @auth(rules: [{ allow: public, provider: apiKey, operations: [create, read]},  { allow: groups, groups: ["Admin"]}]) {
  id: ID!  #uri
  x: Float!
  y: Float! 
}

type Key @model @auth(rules: [{ allow: public, provider: apiKey, operations: [read]}, { allow: private, provider: userPools, operations: [create, read]}]) {
  id: ID!  #username
  key: String!
}

type TransactionNum @model @auth(rules: [{ allow: owner, provider: userPools, operations: [create, read, update]}]) {
  id: ID!  #usermame
  transactionNum: Int!
}


Then again do "amplify add api", that is rest api and unprotected, and change index.js with ,

index.js :

const key = "your appsync apiKey";

exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }, 
        body: JSON.stringify(key),
    };
};



After all, type "amplify push" and then copy aws-exports.js file to admin/src folder.
