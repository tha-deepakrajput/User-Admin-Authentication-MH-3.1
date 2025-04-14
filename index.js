const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const { authenticateJWT } = require("./middleware/auth");
const connectDB = require("./config/Db");

dotenv.config();

const port = process.env.PORT || 10000;
const app = express();

// MODELS : 
const User = require("./models/User");
const Task = require("./models/Task");
const { authorizeRoles } = require("./middleware/auth");

// MIDDLEWARE : 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.set("view engine", "ejs");
// app.set("views", path.resolve("./views"));
app.set("views", path.join(__dirname, "views"));

// CONNECT TO MONGODB : 
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/tasks", authenticateJWT, taskRoutes);

const checkAuth = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.redirect("/login");
        }
        req.user = user;
        next();
    });
}

// ROUTES : 
app.get('/', (req, res) => {
    res.render("register");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const isUserExist = await User.findOne({ email });

        if (isUserExist) {
            return res.status(400).send("User already exist with this email");
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashed });
        await user.save();
        res.redirect("/login");
    }
    catch (err) {
        res.status(500).send("Server error during registration");
    }
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send("Invalid credentials");
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });

    // REDIRECT BASED ON ROLE : 
    if (user.role === 'admin') {
        return res.redirect("/admin/dashboard");
    }
    else {
        return res.redirect("/user/dashboard");
    }
});

app.get("/user/dashboard", checkAuth, authorizeRoles("user"), async (req, res) => {
    const tasks = await Task.find({ userId: req.user.id });
    res.render("userDashboard", { user: req.user, tasks });
});

app.get("/admin/dashboard", checkAuth, authorizeRoles("admin"), async (req, res) => {
    const tasks = await Task.find().populate("userId", "name email");
    res.render("adminDashboard", { user: req.user, tasks });
});

app.post("/tasks", checkAuth, async (req, res) => {
    const { title, description } = req.body;
    await Task.create({ title, description, userId: req.user.id });

    // REDIRECT TO THE CORRECT DASHBOARD : 
    if (req.user.role === "admin") {
        return res.redirect("/admin/dashboard");
    }
    else {
        return res.redirect("/user/dashboard");
    }
});

app.listen(PORT, () => console.log(`Server started at PORT: ${port}`));