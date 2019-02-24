const PORT = process.argv[2] || 7654;

const express = require('express');
const app = express();
const path = require('path');
const request = require('request');
const bodyParser = require('body-parser');
const fs = require('fs');
const uuid = require('uuid/v1');

app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/public/html/index.html');
});

app.post('/api/countFillerWords/', function (req, res) {
   request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url: `http://localhost:5000/api/countFillerWords/`,
      body: `text=${req.body.text}`
   }, function (error, response, body) {
      if (error) console.log(error);
      res.send(response);
   });
});

app.post('/api/highlightFillerWords/', function (req, res) {
   request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url: `http://localhost:5000/api/highlightFillerWords/`,
      body: `text=${req.body.text}`
   }, function (error, response, body) {
      if (error) console.log(error);
      res.send(response);
   });
});

app.post('/api/textSimilarity/', function (req, res) {
   request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url: `http://localhost:5000/api/textSimilarity/`,
      body: `text=${req.body.text}&source=${req.body.source}`
   }, function (error, response, body) {
      if (error) console.log(error);
      res.send(response);
   });
});

app.post('/api/all/', function (req, res) {
   request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url: `http://localhost:5000/api/all/`,
      body: `text=${req.body.text}&source=${req.body.source}`
   }, function (error, response, body) {
      if (error) console.log(error);
      res.send(response);
   });
});

app.post('/api/publish', function (req, res) {
   const title = req.body.title;
   const filename = title.toLowerCase().replace(/\W/g, '-') + '-' + Math.floor(Math.random() * 1000) + '.md';
   const script = req.body.script;
   fs.writeFile(__dirname + '/../publishly-texts/' + filename, `# ${title}\n\n${script}`, function(err) {
      if (err) console.log(err);
      exec(`cd /Users/bent/Documents/programming/publishly-texts/ && git add -A && git commit -m 'Published ${title}' && git push`, function (e, stdout, stderr) {
         console.log(stdout);
         console.log(stderr);
         res.send('Success!');
      });
   });
});

var multer  = require('multer');
var upload = multer({ dest: __dirname + '/public/uploads/' });
var type = upload.single('data');
var exec = require('child_process').exec;

app.post('/image/', type, function (req, res) {
   res.setHeader("Access-Control-Allow-Origin", "*");
   const id = uuid();
   // console.log(req.body.image);
   let json = {
      "payload": { 
         "image": {
               "imageBytes": req.body.image.split(',')[1]
            }
         }
   }
   console.log('HIT');
   fs.writeFile(__dirname + '/public/uploads/' + id + "-req.json.no-demon", JSON.stringify(json), function(err) {
      if (err) console.log(err);
      exec(`export GOOGLE_APPLICATION_CREDENTIALS=/Users/bent/gcloud/Hacklahoma-2019-cd5a0529ed91.json && curl -X POST -H "Content-Type: application/json" \
              -H "Authorization: Bearer $(/Users/bent/Downloads/google-cloud-sdk/bin/gcloud auth application-default print-access-token)" \
              https://automl.googleapis.com/v1beta1/projects/unique-alpha-231216/locations/us-central1/models/ICN5714687271522123938:predict -d @/Users/bent/Documents/programming/hackutd-2019/public/uploads/${id}-req.json.no-demon`, function(e, stdout, stderr) {
         console.log(stdout);
         console.log(stderr);
         let data = JSON.parse(stdout);
         let type = data.payload[0].displayName;
         res.send(JSON.stringify({uploaded: true, classification: type}));
      });
   });
});

app.listen(PORT, function () {
   console.log(`Listening on port ${PORT}`);
});
