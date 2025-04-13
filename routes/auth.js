const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Router : 
const router = express.Router();

// To Register
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body; 

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// To Login : 
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isPassMatched = await bcrypt.compare(password, user.password);
        
        if (!isPassMatched) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );
        res.json({ token });
    }
    catch (err) {
        res.json({ message: err.message });
    }
});

module.exports = router;