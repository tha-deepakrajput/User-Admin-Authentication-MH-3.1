const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello from Vercel Serverless!');
});

module.exports.handler = serverless(app);
