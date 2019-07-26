'use strict';

const express = require('express');
const mongoose = require('mongoose');

const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const dns = require('dns');

// Basic Configuration 
const port = process.env.PORT || 3000;
const appUrl = process.env.APP_URL || 'http://localhost:' + port;
mongoose.connect(process.env.MONGO_URI +'/test?retryWrites=true&w=majority', { useNewUrlParser: true }).catch(err => console.log(err));

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(process.cwd() + '/public'));

// Mongo stuff
const urlSchema = mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  route: Number
});
const Url = mongoose.model('Url', urlSchema);

// constants
const URL_REGEX = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
const errors = {
  invalidUrl: {error: 'invalid URL'},
  invalidHost: {error: 'invalid Hostname'},
  general: {error: 'Something wnt south...'}
};


// handlers
const postHandler = (req, res) => {
  const url = req.body.url;
  if(!url.match(URL_REGEX)) {
    handleError(res, errors.invalidUrl);
    return;
  }
  const stripedUrl = url.replace(/^https?:\/\//, '');
  dns.lookup(stripedUrl, (err) => {
    if (err) {
      handleError(res, errors.invalidHost);
    } else {
      Url.findOne({original: url}, (err, result) => {
        if(err) {
          handleError(res, errors.general);
        } else if (result) {
          handleIfFound(res, url, result);
        } else {
          handleCreation(res, url)
        }
      });
    }
  });
}

const handleCreation = (res, url) => {
  Url.count({}, (err, count) => {
    if(err) {
      handleError(res, errors.general);
    }
    console.log(count);
  });
  res.json({original_url: url, short_url: `${appUrl}/link/1`});
}

const handleError = (res, err) => res.json(err);
const handleIfFound = (res, url, result) => res.json({original_url: url, short_url: `${appUrl}/link/${result.route}`});


// routes
app.get('/',(req, res) => res.sendFile(process.cwd() + '/views/index.html'));
app.post('/api/shorturl/new', postHandler);

app.listen(port, function () {
  console.log('Node.js listening on port: ' + port);
});