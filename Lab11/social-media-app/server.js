const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");
const http = require("http");
const axios = require("axios");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
const port = 5005;
const JWT_SECRET = "your_jwt_secret_key";
const mongoUrl = "mongodb://localhost:27017";
const dbName = "social_db";

app.use(cors());
app.use(express.json());

let db;
MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Socket.IO for real-time analytics
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

// Register user
app.post("/register", async (req, res) => {
  const { username, password, bio } = req.body;
  if (!username || !password || !bio)
    return res.status(400).json({ error: "All fields required" });
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await db
      .collection("users")
      .insertOne({ username, password: hashedPassword, bio });
    res.json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: "Username exists or database error" });
  }
});

// Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  const user = await db.collection("users").findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user._id, username }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token, username, bio: user.bio });
});

// Middleware for JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Create post
app.post("/posts", authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });
  try {
    const sentimentResponse = await axios.post(
      "http://localhost:5006/sentiment",
      { content }
    );
    const result = await db.collection("posts").insertOne({
      user_id: req.user.userId,
      content,
      created_at: new Date(),
      sentiment: sentimentResponse.data.sentiment,
    });
    io.emit("new_post", {
      postId: result.insertedId,
      content,
      sentiment: sentimentResponse.data.sentiment,
    });
    res.json({ message: "Post created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get posts (with pagination)
app.get("/posts", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  try {
    const posts = await db
      .collection("posts")
      .find()
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    const total = await db.collection("posts").countDocuments();
    res.json({ posts, total });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Follow user
app.post("/follow", authenticateToken, async (req, res) => {
  const { followee_id } = req.body;
  if (!followee_id)
    return res.status(400).json({ error: "Followee ID required" });
  try {
    await db
      .collection("follows")
      .insertOne({ follower_id: req.user.userId, followee_id });
    io.emit("new_follow", { follower_id: req.user.userId, followee_id });
    res.json({ message: "Followed user" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Like post
app.post("/like", authenticateToken, async (req, res) => {
  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: "Post ID required" });
  try {
    await db
      .collection("likes")
      .insertOne({ user_id: req.user.userId, post_id });
    io.emit("new_like", { post_id, user_id: req.user.userId });
    res.json({ message: "Post liked" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Get all users
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } }) // exclude passwords
      .toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});


// Get analytics (e.g., post likes, follower count)
app.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const postCount = await db
      .collection("posts")
      .countDocuments({ user_id: req.user.userId });
    const followerCount = await db
      .collection("follows")
      .countDocuments({ followee_id: req.user.userId });
    const likeCount = await db
      .collection("likes")
      .countDocuments({
        post_id: {
          $in: (
            await db
              .collection("posts")
              .find({ user_id: req.user.userId })
              .toArray()
          ).map((p) => p._id),
        },
      });
    res.json({ postCount, followerCount, likeCount });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

server.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
