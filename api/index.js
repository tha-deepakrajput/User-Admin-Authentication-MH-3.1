const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello from Vercel Serverless!');
});

module.exports.handler = serverless(app);



// // api/index.js
// const express = require('express');
// const app = express();

// // Your middlewares and routes here, like before

// app.get('/', (req, res) => {
//   res.render('index');  // or any view you need
// });

// // Export a function that Vercel can run
// module.exports = app;
