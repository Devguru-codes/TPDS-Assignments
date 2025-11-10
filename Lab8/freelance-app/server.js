const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 5002;
const JWT_SECRET = 'abcd';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// In-memory storage
let users = [
  { id: 1, username: 'john_doe', password: '$2b$10$YZ5yZKx7qhLx.Kg8vR8N9OqKvFGx8VYZcJ4B3K5H9Y6xH7qL' },
  { id: 2, username: 'jane_smith', password: '$2b$10$YZ5yZKx7qhLx.Kg8vR8N9OqKvFGx8VYZcJ4B3K5H9Y6xH7qL' }
];
let projects = [
  { id: 1, title: 'Website Redesign', description: 'Need a modern website design with responsive layout', budget: 1500, user_id: 1, username: 'john_doe' },
  { id: 2, title: 'Mobile App Development', description: 'Build a cross-platform mobile app for e-commerce', budget: 5000, user_id: 1, username: 'john_doe' }
];
let bids = [
  { id: 1, project_id: 1, user_id: 2, username: 'jane_smith', amount: 1200 },
  { id: 2, project_id: 1, user_id: 2, username: 'jane_smith', amount: 1400 }
];

let nextUserId = 3;
let nextProjectId = 3;
let nextBidId = 3;

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: nextUserId++, username, password: hashedPassword };
  users.push(newUser);
  res.json({ message: 'User registered successfully' });
});

// Login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, username: user.username });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get all projects
app.get('/projects', (req, res) => {
  res.json(projects);
});

// Add a new project
app.post('/projects', authenticateToken, (req, res) => {
  const { title, description, budget } = req.body;
  if (!title || !description || !budget || budget <= 0) {
    return res.status(400).json({ error: 'All fields are required, and budget must be positive' });
  }
  const newProject = {
    id: nextProjectId++,
    title,
    description,
    budget: parseFloat(budget),
    user_id: req.user.userId,
    username: req.user.username
  };
  projects.push(newProject);
  res.json(newProject);
});

// Add a bid to a project
app.post('/bids', authenticateToken, (req, res) => {
  const { project_id, amount } = req.body;
  if (!project_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Project ID and positive bid amount are required' });
  }
  const newBid = {
    id: nextBidId++,
    project_id: parseInt(project_id),
    user_id: req.user.userId,
    username: req.user.username,
    amount: parseFloat(amount)
  };
  bids.push(newBid);
  res.json(newBid);
});

// Get bids for a project
app.get('/bids/:project_id', (req, res) => {
  const projectBids = bids.filter(b => b.project_id === parseInt(req.params.project_id));
  res.json(projectBids);
});

// Delete a project
app.delete('/projects/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  projects = projects.filter(p => !(p.id === id && p.user_id === req.user.userId));
  bids = bids.filter(b => b.project_id !== id);
  res.json({ message: 'Project deleted' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});