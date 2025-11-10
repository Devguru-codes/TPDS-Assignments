const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const port = 5003;
const JWT_SECRET = "your_jwt_secret_key";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "client")));

// In-memory storage
let users = [
  { id: 1, username: "alice", password: "$2b$10$YZ5yZKx7qhLx.Kg8vR8N9OqKvFGx8VYZcJ4B3K5H9Y6xH7qL", skills: "JavaScript, React, Node.js" },
  { id: 2, username: "bob", password: "$2b$10$YZ5yZKx7qhLx.Kg8vR8N9OqKvFGx8VYZcJ4B3K5H9Y6xH7qL", skills: "Python, Django, Machine Learning" }
];

let jobs = [
  { id: 1, title: "Frontend Developer", description: "Build modern web apps", skills_required: "JavaScript, React, CSS", user_id: 1, username: "alice" },
  { id: 2, title: "Backend Developer", description: "Create robust APIs", skills_required: "Node.js, Express, MongoDB", user_id: 1, username: "alice" },
  { id: 3, title: "Data Scientist", description: "Analyze and visualize data", skills_required: "Python, Machine Learning, TensorFlow", user_id: 2, username: "bob" }
];

let applications = [];

let nextUserId = 3;
let nextJobId = 4;
let nextAppId = 1;

// Register a new user
app.post("/register", async (req, res) => {
  const { username, password, skills } = req.body;
  if (!username || !password || !skills) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: nextUserId++, username, password: hashedPassword, skills };
  users.push(newUser);
  res.json({ message: "User registered successfully" });
});

// Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, username, skills: user.skills });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Get all jobs with pagination and search
app.get("/jobs", (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;
  
  let filteredJobs = jobs;
  if (search) {
    filteredJobs = jobs.filter(j => 
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const paginatedJobs = filteredJobs.slice(offset, offset + parseInt(limit));
  res.json({ jobs: paginatedJobs, total: filteredJobs.length });
});

// Get AI-recommended jobs (using simple keyword matching)
app.get("/jobs/recommended", authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(500).json({ error: "User not found" });
  }
  
  const userSkills = user.skills.toLowerCase().split(",").map(s => s.trim());
  
  // Calculate match score for each job
  const jobScores = jobs.map(job => {
    const jobSkills = job.skills_required.toLowerCase().split(",").map(s => s.trim());
    const matchCount = userSkills.filter(skill => 
      jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
    ).length;
    return { ...job, score: matchCount };
  });
  
  // Sort by score and return top 3
  const recommendedJobs = jobScores
    .filter(job => job.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  res.json(recommendedJobs);
});

// Add a new job
app.post("/jobs", authenticateToken, (req, res) => {
  const { title, description, skills_required } = req.body;
  if (!title || !description || !skills_required) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const user = users.find(u => u.id === req.user.userId);
  const newJob = {
    id: nextJobId++,
    title,
    description,
    skills_required,
    user_id: req.user.userId,
    username: user.username
  };
  jobs.push(newJob);
  res.json(newJob);
});

// Apply to a job
app.post("/applications", authenticateToken, (req, res) => {
  const { job_id } = req.body;
  if (!job_id) {
    return res.status(400).json({ error: "Job ID is required" });
  }
  const job = jobs.find(j => j.id === parseInt(job_id));
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  // Check if already applied
  const alreadyApplied = applications.find(a => a.job_id === parseInt(job_id) && a.user_id === req.user.userId);
  if (alreadyApplied) {
    return res.status(400).json({ error: "Already applied to this job" });
  }
  const user = users.find(u => u.id === req.user.userId);
  const newApplication = {
    id: nextAppId++,
    job_id: parseInt(job_id),
    user_id: req.user.userId,
    username: user.username
  };
  applications.push(newApplication);
  res.json(newApplication);
});

// Get applications for a job
app.get("/applications/:job_id", authenticateToken, (req, res) => {
  const { job_id } = req.params;
  const jobApplications = applications.filter(a => a.job_id === parseInt(job_id));
  res.json(jobApplications);
});

// Delete a job
app.delete("/jobs/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const jobIndex = jobs.findIndex(j => j.id === parseInt(id) && j.user_id === req.user.userId);
  if (jobIndex === -1) {
    return res.status(404).json({ error: "Job not found or unauthorized" });
  }
  // Remove associated applications
  applications = applications.filter(a => a.job_id !== parseInt(id));
  // Remove the job
  jobs.splice(jobIndex, 1);
  res.json({ message: "Job deleted" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
