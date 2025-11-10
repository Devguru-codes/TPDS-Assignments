const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// In-memory storage for recipes
let recipes = [
  {
    id: 1,
    name: 'Chocolate Chip Cookies',
    ingredients: '2 cups flour\n1 cup butter\n1 cup sugar\n2 eggs\n2 cups chocolate chips',
    instructions: '1. Preheat oven to 350°F\n2. Mix butter and sugar\n3. Add eggs and mix well\n4. Add flour gradually\n5. Fold in chocolate chips\n6. Bake for 12 minutes'
  },
  {
    id: 2,
    name: 'Spaghetti Carbonara',
    ingredients: '400g spaghetti\n200g bacon\n3 eggs\n1 cup parmesan cheese\nBlack pepper',
    instructions: '1. Cook spaghetti according to package\n2. Fry bacon until crispy\n3. Beat eggs with cheese\n4. Mix hot pasta with egg mixture\n5. Add bacon and pepper\n6. Serve immediately'
  }
];

let nextId = 3;

// Get all recipes
app.get('/recipes', (req, res) => {
  res.json(recipes);
});

// Add a new recipe
app.post('/recipes', (req, res) => {
  const { name, ingredients, instructions } = req.body;
  if (!name || !ingredients || !instructions) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  const newRecipe = {
    id: nextId++,
    name,
    ingredients,
    instructions
  };
  recipes.push(newRecipe);
  res.json(newRecipe);
});

// Delete a recipe
app.delete('/recipes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  recipes = recipes.filter(recipe => recipe.id !== id);
  res.json({ message: 'Recipe deleted' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});