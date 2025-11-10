const express = require('express');
const cors = require('cors');
const path = require('path');
const { executeQuery, testConnection } = require('./db');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Test database connection on startup
testConnection();

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await executeQuery('SELECT id, name, email FROM lab3_users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add a new user
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await executeQuery('INSERT INTO lab3_users (name, email) VALUES (?, ?)', [name.trim(), email.trim()]);
    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: email.trim()
    };
    res.json(newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add user' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
