require('dotenv').config();
const express = require('express');
const app = express();
const cors = require("cors");
const routes = require('./routes/route'); 

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cors()); 
app.use('', routes);

app.listen(3000, () => console.log('server is running..'));

module.exports = app; //for testing