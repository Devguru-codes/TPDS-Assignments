const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const app = express();
const port = 5004; // Avoid conflicts
const JWT_SECRET = "your_jwt_secret_key";

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Future56*",
  database: "streaming_db",
});

db.connect((err) => {
  if (err) console.error("Error connecting to MySQL:", err);
  else console.log("Connected to MySQL");
});

// Register user
app.post("/register", async (req, res) => {
  const { username, password, preferences } = req.body;
  if (!username || !password || !preferences) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (username, password, preferences) VALUES (?, ?, ?)",
    [username, hashedPassword, preferences],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Username exists or database error" });
      res.json({ message: "User registered" });
    }
  );
});

// Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err || results.length === 0)
        return res.status(401).json({ error: "Invalid credentials" });
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ error: "Invalid credentials" });
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({ token, username, preferences: user.preferences });
    }
  );
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

// Get all content with pagination and search
app.get("/content", (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;
  const query =
    "SELECT * FROM content WHERE title LIKE ? OR description LIKE ? LIMIT ? OFFSET ?";
  db.query(
    query,
    [`%${search}%`, `%${search}%`, parseInt(limit), parseInt(offset)],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      db.query(
        "SELECT COUNT(*) as total FROM content WHERE title LIKE ? OR description LIKE ?",
        [`%${search}%`, `%${search}%`],
        (err, countResult) => {
          if (err) return res.status(500).json({ error: "Database error" });
          res.json({ content: results, total: countResult[0].total });
        }
      );
    }
  );
});

// Get recommended content
app.get("/content/recommended", authenticateToken, async (req, res) => {
  db.query(
    "SELECT preferences FROM users WHERE id = ?",
    [req.user.userId],
    async (err, userResult) => {
      if (err || userResult.length === 0)
        return res.status(500).json({ error: "User not found" });
      const userPreferences = userResult[0].preferences;
      db.query("SELECT id, genre FROM content", async (err, content) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (content.length === 0) {
          return res.json([]);
        }

        try {
          const response = await axios.post("http://localhost:5005/recommend", {
            user_preferences: userPreferences,
            content,
          });
          const recommendedIds = response.data;

          if (!recommendedIds || recommendedIds.length === 0) {
            return res.json([]);
          }

          db.query(
            "SELECT * FROM content WHERE id IN (?)",
            [recommendedIds],
            (err, results) => {
              if (err) return res.status(500).json({ error: "Database error" });
              res.json(results);
            }
          );
        } catch (err) {
          console.error("Error with AI recommendation:", err.message);
          // If Python service is not available, return empty array
          res.json([]);
        }
      });
    }
  );
});

// Add to watchlist
app.post("/watchlist", authenticateToken, (req, res) => {
  const { content_id } = req.body;
  if (!content_id)
    return res.status(400).json({ error: "Content ID required" });
  db.query(
    "INSERT INTO watchlist (user_id, content_id) VALUES (?, ?)",
    [req.user.userId, content_id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Added to watchlist" });
    }
  );
});

// Get watchlist
app.get("/watchlist", authenticateToken, (req, res) => {
  db.query(
    "SELECT c.* FROM watchlist w JOIN content c ON w.content_id = c.id WHERE w.user_id = ?",
    [req.user.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(results);
    }
  );
});

// Remove from watchlist
app.delete("/watchlist/:content_id", authenticateToken, (req, res) => {
  const { content_id } = req.params;
  db.query(
    "DELETE FROM watchlist WHERE user_id = ? AND content_id = ?",
    [req.user.userId, content_id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Removed from watchlist" });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
