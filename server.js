// // server.js
// const express = require('express');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const path = require('path');
// const cookieParser = require('cookie-parser');
// const dotenv = require('dotenv');
// const authRoutes = require("./routes/auth");
// const taskRoutes = require("./routes/tasks");
// const { authenticateJWT } = require("./middleware/auth");
// dotenv.config();

// const app = express();
// const PORT = 5000;

// // Models
// const User = require('./models/User');
// const Task = require('./models/Task');


// // Middleware
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use(cookieParser());
// app.set('view engine', 'ejs');
// app.set('views', path.resolve('./views'));

// // Connect to MongoDB
// // mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'));
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error(err));

// app.use("/api/auth", authRoutes);
// app.use("/api/tasks", authenticateJWT, taskRoutes);


// // Middleware to decode JWT from cookies
// const checkAuth = (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) return next();
//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (!err) req.user = user;
//     next();
//   });
// };

// // Routes
// app.get('/', checkAuth, async (req, res) => {
//   let tasks = [];
//   if (req.user && req.user.role === 'user') {
//     tasks = await Task.find({ userId: req.user.id });
//   }
//   res.render('tasks', { user: req.user, tasks });
// });

// app.get('/register', (req, res) => {
//   res.render('register');
// });

// app.get('/login', (req, res) => {
//   res.render('login');
// });

// // app.get('/admin/tasks', checkAuth, async (req, res) => {
// //   if (!req.user || req.user.role !== 'admin') {
// //     return res.status(403).send('Access denied');
// //   }

// //   try {
// //     const tasks = await Task.find().populate('userId', 'name email');
// //     res.render('admin-tasks', { tasks });
// //   } catch (err) {
// //     res.status(500).send('Error fetching tasks');
// //   }
// // });



// app.get('/', checkAuth, async (req, res) => {
//   let tasks = [];

//   if (req.user) {
//     if (req.user.role === 'admin') {
//       // Admin sees all tasks
//       tasks = await Task.find().populate('userId', 'name email');
//     } else {
//       // Regular user sees only their own tasks
//       tasks = await Task.find({ userId: req.user.id });
//     }
//   }

//   res.render('server', { user: req.user, tasks });
// });





// app.post('/register', async (req, res) => {
//   const { name, email, password } = req.body;
//   const hashed = await bcrypt.hash(password, 10);
//   const user = new User({ name, email, password: hashed });
//   await user.save();
//   res.redirect('/login');
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });
//   if (!user || !(await bcrypt.compare(password, user.password))) {
//     return res.send('Invalid credentials or User is not registered');
//   }
//   const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
//   res.cookie('token', token, { httpOnly: true });
//   res.redirect('/');
// });

// app.post('/tasks', checkAuth, async (req, res) => {
//   if (!req.user || req.user.role !== 'user') return res.status(403).send('Forbidden');
//   const { title, description } = req.body;
//   await Task.create({ title, description, userId: req.user.id });
//   res.redirect('/');
// });

// app.listen(PORT, () => console.log(`Server started at PORT : ${PORT}`));







// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const { authenticateJWT } = require("./middleware/auth");
dotenv.config();

const app = express();

// Models
const User = require('./models/User');
const Task = require('./models/Task');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));


app.use("/api/auth", authRoutes);
app.use("/api/tasks", authenticateJWT, taskRoutes);

// JWT Middleware
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
  } else if (req.user && req.user.role === 'admin') {
    tasks = await Task.find().populate('userId', 'name'); // Optional: populate name
  }

  res.render('admin-tasks', { user: req.user, tasks }); // ✅ user passed here
  // console.log('Decoded User:', req.user);
});


app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed });
  await user.save();
  res.redirect('/login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send('Invalid credentials');
  }
  // console.log('Logging in user:', user); 

  const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/');
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
