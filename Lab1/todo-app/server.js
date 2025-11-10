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

// Get all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await executeQuery('SELECT id, text FROM lab1_todos ORDER BY created_at DESC');
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Add a new todo
app.post('/todos', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const result = await executeQuery('INSERT INTO lab1_todos (text) VALUES (?)', [text.trim()]);
    const newTodo = {
      id: result.insertId,
      text: text.trim()
    };
    res.json(newTodo);
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({ error: 'Failed to add todo' });
  }
});

// Delete a todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const result = await executeQuery('DELETE FROM lab1_todos WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted', id });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
