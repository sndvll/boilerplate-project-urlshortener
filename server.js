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
/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

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

// routes
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', (req, res) => {
  const url = req.body.url;
  if(!url.match(URL_REGEX)) {
    res.json(errors.invalidUrl);
  }
  const stripedUrl = url.replace(/^https?:\/\//, '');
  dns.lookup(stripedUrl, (err) => {
    if (err) {
      res.json(errors.invalidHost);
    } else {
      Url.findOne({original: url}, (err, result) => {
        if(err) {
          res.json(errors.general);
        } else if (result) {
          res.json({original_url: url, short_url: `${appUrl}/link/${result.route}`})
        } else {
          //CREATE AND PERSIST HERE!
          res.json({original_url: url, short_url: `${appUrl}/link/1`});
        }
      });
    }
  });
});


app.listen(port, function () {
  console.log('Node.js listening on port: ' + port);
});