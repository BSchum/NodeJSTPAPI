const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = express();
const bodyParser = require('body-parser');

var mongoDB = 'mongodb://127.0.0.1/ProjectDB';
mongoose.Promise = global.Promise;

require('./config.js');
app.use(bodyParser.json());
app.use('/', require('./route'));

app.listen(process.env.PORT, function() {
  console.log('Server is responding on: '+ process.env.PORT);
});
