const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

let events = [];

// Get all events
app.get('/events', (req, res) => {
  res.json(events);
});

// Add a new event
app.post('/events', (req, res) => {
  const event = {
    id: events.length + 1,
    title: req.body.title,
    date: req.body.date,
    description: req.body.description,
  };
  events.push(event);
  res.json(event);
});

// Filter events by date
app.get('/events/filter', (req, res) => {
  const { date } = req.query;
  if (date) {
    const filteredEvents = events.filter(event => event.date === date);
    res.json(filteredEvents);
  } else {
    res.json(events);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});