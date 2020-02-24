'use strict';

const express = require('express');
const port = process.env.PORT || 3000;
const app = express();


const fs = require('fs');
// const http = require('http');
const https = require('https');
const privateKey = fs.readFileSync('./certs/2_brender.cn.key', 'utf8');
const certificate = fs.readFileSync('./certs/1_brender.cn_bundle.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };


app.get('/', (req, res) => res.send('Hello World!'));

// your express configuration here

// const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);



httpsServer.listen(port);



// app.listen(port, () => console.log(`App listening on port ${port}!`));