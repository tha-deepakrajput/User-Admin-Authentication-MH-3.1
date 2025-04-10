// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Models
const User = require('./models/User');
const Task = require('./models/Task');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'));

// Middleware to decode JWT from cookies
const checkAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next();
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

// Routes
app.get('/', checkAuth, async (req, res) => {
  let tasks = [];
  if (req.user && req.user.role === 'user') {
    tasks = await Task.find({ userId: req.user.id });
  }
  res.render('index', { user: req.user, tasks });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();
  res.redirect('/');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send('Invalid credentials');
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/');
});

app.post('/tasks', checkAuth, async (req, res) => {
  if (!req.user || req.user.role !== 'user') return res.status(403).send('Forbidden');
  const { title, description } = req.body;
  await Task.create({ title, description, userId: req.user.id });
  res.redirect('/');
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
