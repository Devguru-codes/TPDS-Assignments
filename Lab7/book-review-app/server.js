const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 5001; // Different port to avoid conflicts with previous labs

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// In-memory storage for reviews
let reviews = [
  {
    id: 1,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    rating: 5,
    review_text: 'A timeless classic that explores themes of racial injustice and moral growth. The characters are unforgettable, especially Atticus Finch. A must-read for everyone.'
  },
  {
    id: 2,
    title: '1984',
    author: 'George Orwell',
    rating: 5,
    review_text: 'A chilling dystopian novel that remains incredibly relevant today. Orwell\'s vision of a totalitarian future is both terrifying and thought-provoking.'
  },
  {
    id: 3,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    rating: 4,
    review_text: 'Beautiful prose and a fascinating look at the American Dream. The symbolism is rich and the story is both tragic and captivating.'
  }
];

let nextId = 4;

// Get all reviews
app.get('/reviews', (req, res) => {
  res.json(reviews);
});

// Get reviews filtered by rating
app.get('/reviews/filter', (req, res) => {
  const { rating } = req.query;
  if (rating) {
    const filteredReviews = reviews.filter(review => review.rating === parseInt(rating));
    res.json(filteredReviews);
  } else {
    res.json([]);
  }
});

// Add a new review
app.post('/reviews', (req, res) => {
  const { title, author, rating, review_text } = req.body;
  if (!title || !author || !rating || !review_text || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'All fields are required, and rating must be between 1 and 5' });
    return;
  }
  const newReview = {
    id: nextId++,
    title,
    author,
    rating: parseInt(rating),
    review_text
  };
  reviews.push(newReview);
  res.json(newReview);
});

// Update a review
app.put('/reviews/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, author, rating, review_text } = req.body;
  if (!title || !author || !rating || !review_text || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'All fields are required, and rating must be between 1 and 5' });
    return;
  }
  const index = reviews.findIndex(review => review.id === id);
  if (index !== -1) {
    reviews[index] = { id, title, author, rating: parseInt(rating), review_text };
    res.json(reviews[index]);
  } else {
    res.status(404).json({ error: 'Review not found' });
  }
});

// Delete a review
app.delete('/reviews/:id', (req, res) => {
  const id = parseInt(req.params.id);
  reviews = reviews.filter(review => review.id !== id);
  res.json({ message: 'Review deleted' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});