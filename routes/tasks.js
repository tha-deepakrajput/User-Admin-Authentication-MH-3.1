const express = require('express');
const Task = require('../models/Task');
const { authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.post('/', async (req, res) => {
  const { title, description } = req.body;
  try {
    const task = new Task({
      title,
      description,
      userId: req.user.userId
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/user', authorizeRoles('user'), async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authorizeRoles('admin'), async (req, res) => {
  try {
    const tasks = await Task.find().populate('userId', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;