const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

let count = 0;

// Get current count
app.get('/count', (req, res) => {
  res.json({ count });
});

// Update count
app.post('/count', (req, res) => {
  count = req.body.count;
  res.json({ count });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});