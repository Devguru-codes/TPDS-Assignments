const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");
const http = require("http");
const axios = require("axios");
const cloudinary = require("cloudinary").v2; // ⬅️ NEW
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const port = 5005;
const JWT_SECRET = "your_jwt_secret_key";
const mongoUrl = "mongodb://localhost:27017";
const dbName = "social_db";

// 🔐 CORS + JSON
app.use(cors());
app.use(express.json());

// 🌩️ Cloudinary config (fill these!)
cloudinary.config({
  cloud_name: "a",
  api_key: "a",
  api_secret: "a-a",
});

let db;

// 🟣 Connect to Mongo
MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// 🟣 Socket.IO
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

// --------------------------------------------------
// AUTH
// --------------------------------------------------

// Register user
app.post("/register", async (req, res) => {
  const { username, password, bio } = req.body;
  if (!username || !password || !bio)
    return res.status(400).json({ error: "All fields required" });

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await db.collection("users").insertOne({
      username,
      password: hashedPassword,
      bio,
      created_at: new Date(),
    });
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
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { userId: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, username: user.username, bio: user.bio });
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

// --------------------------------------------------
// POSTS (text)
// --------------------------------------------------

// Create post (with sentiment microservice)
app.post("/posts", authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content required" });

  try {
    // 👇 your current Python service for sentiment
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
    console.error("POST /posts error:", err.message);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get posts (with pagination)
app.get("/posts", async (req, res) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");
  const skip = (page - 1) * limit;

  try {
    const posts = await db
      .collection("posts")
      .find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("posts").countDocuments();
    res.json({ posts, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --------------------------------------------------
// SOCIAL GRAPH (follow / like text-posts)
// --------------------------------------------------

// Follow user
app.post("/follow", authenticateToken, async (req, res) => {
  const { followee_id } = req.body;
  if (!followee_id)
    return res.status(400).json({ error: "Followee ID required" });

  try {
    await db.collection("follows").insertOne({
      follower_id: req.user.userId,
      followee_id: new ObjectId(followee_id),
      created_at: new Date(),
    });

    io.emit("new_follow", {
      follower_id: req.user.userId,
      followee_id,
    });

    res.json({ message: "Followed user" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Like post (text post)
app.post("/like", authenticateToken, async (req, res) => {
  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: "Post ID required" });

  try {
    await db.collection("likes").insertOne({
      user_id: req.user.userId,
      post_id: new ObjectId(post_id),
      created_at: new Date(),
    });

    io.emit("new_like", { post_id, user_id: req.user.userId });
    res.json({ message: "Post liked" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --------------------------------------------------
// 🔥 LAB 12 ADDITIONS
// 1) Photo upload (Cloudinary)
// 2) Stories (24h)
// 3) Like photo
// --------------------------------------------------

// Upload Photo (feed)
app.post("/upload-photo", authenticateToken, async (req, res) => {
  const { image_base64, caption = "", filter = "none" } = req.body;
  if (!image_base64)
    return res.status(400).json({ error: "Image (base64) required" });

  try {
    // upload to Cloudinary
    const result = await cloudinary.uploader.upload(image_base64, {
      folder: "social_app",
      transformation: filter !== "none" ? { effect: filter } : {},
    });

    const photo = await db.collection("photos").insertOne({
      user_id: req.user.userId,
      image_url: result.secure_url,
      caption,
      filter: filter !== "none" ? filter : null,
      likes: [],
      comments: [],
      created_at: new Date(),
    });

    // broadcast to all connected clients
    io.emit("new_photo", {
      photoId: photo.insertedId,
      caption,
      image_url: result.secure_url,
      user_id: req.user.userId,
    });

    res.json({ message: "Photo uploaded", url: result.secure_url });
  } catch (err) {
    console.error("UPLOAD PHOTO ERROR:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Upload Story (24h expiry)
app.post("/upload-story", authenticateToken, async (req, res) => {
  const { image_base64 } = req.body;
  if (!image_base64)
    return res.status(400).json({ error: "Image (base64) required" });

  try {
    const result = await cloudinary.uploader.upload(image_base64, {
      folder: "stories",
    });

    await db.collection("stories").insertOne({
      user_id: req.user.userId,
      image_url: result.secure_url,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    io.emit("new_story", {
      user_id: req.user.userId,
      image_url: result.secure_url,
    });

    res.json({ message: "Story posted" });
  } catch (err) {
    console.error("UPLOAD STORY ERROR:", err.message);
    res.status(500).json({ error: "Story upload failed" });
  }
});

// Get active stories
app.get("/stories", authenticateToken, async (req, res) => {
  try {
    const stories = await db
      .collection("stories")
      .find({ expires_at: { $gt: new Date() } })
      .sort({ created_at: -1 })
      .toArray();

    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

// Like photo (not text post)
app.post("/like-photo", authenticateToken, async (req, res) => {
  const { photo_id } = req.body;
  if (!photo_id) return res.status(400).json({ error: "Photo ID required" });

  try {
    await db
      .collection("photos")
      .updateOne(
        { _id: new ObjectId(photo_id) },
        { $addToSet: { likes: req.user.userId } }
      );

    io.emit("photo_liked", {
      photo_id,
      user_id: req.user.userId,
    });

    res.json({ message: "Liked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to like photo" });
  }
});

// --------------------------------------------------
// USERS
// --------------------------------------------------

// Get all users (no passwords)
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --------------------------------------------------
// ANALYTICS
// --------------------------------------------------
app.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const postCount = await db
      .collection("posts")
      .countDocuments({ user_id: req.user.userId });

    const followerCount = await db
      .collection("follows")
      .countDocuments({ followee_id: req.user.userId });

    // all post IDs from this user
    const userPosts = await db
      .collection("posts")
      .find({ user_id: req.user.userId })
      .toArray();

    const likeCount = await db.collection("likes").countDocuments({
      post_id: { $in: userPosts.map((p) => p._id) },
    });

    res.json({ postCount, followerCount, likeCount });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
server.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
