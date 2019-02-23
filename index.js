const PORT = process.argv[2] || 7654;

const express = require('express');
const app = express();
const path = require('path');

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/public/html/index.html');
});

app.listen(PORT, function () {
   console.log(`Listening on port ${PORT}`);
});
