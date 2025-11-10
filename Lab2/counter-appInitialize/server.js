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

// Get current count
app.get('/count', async (req, res) => {
  try {
    const result = await executeQuery('SELECT value FROM lab2_counter WHERE id = 1');
    const count = result.length > 0 ? result[0].value : 0;
    res.json({ count });
  } catch (error) {
    console.error('Error fetching count:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// Update count
app.post('/count', async (req, res) => {
  try {
    const { count } = req.body;
    if (typeof count !== 'number' || isNaN(count)) {
      return res.status(400).json({ error: 'Invalid count value' });
    }

    await executeQuery('UPDATE lab2_counter SET value = ? WHERE id = 1', [count]);
    res.json({ count });
  } catch (error) {
    console.error('Error updating count:', error);
    res.status(500).json({ error: 'Failed to update count' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
