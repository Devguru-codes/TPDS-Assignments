const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

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