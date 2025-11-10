const API_URL = 'http://localhost:5000';

const recipeForm = document.getElementById('recipeForm');
const recipeName = document.getElementById('recipeName');
const recipeIngredients = document.getElementById('recipeIngredients');
const recipeInstructions = document.getElementById('recipeInstructions');
const recipesList = document.getElementById('recipesList');

// Load recipes on page load
document.addEventListener('DOMContentLoaded', loadRecipes);

// Form submission
recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addRecipe();
});

// Load all recipes
async function loadRecipes() {
    try {
        recipesList.innerHTML = '<div class="loading">Loading recipes...</div>';
        
        const response = await fetch(`${API_URL}/recipes`);
        if (!response.ok) throw new Error('Failed to load recipes');
        
        const recipes = await response.json();
        displayRecipes(recipes);
    } catch (error) {
        console.error('Error loading recipes:', error);
        showError('Failed to load recipes. Make sure the server is running on port 5000.');
    }
}

// Add new recipe
async function addRecipe() {
    const name = recipeName.value.trim();
    const ingredients = recipeIngredients.value.trim();
    const instructions = recipeInstructions.value.trim();
    
    if (!name || !ingredients || !instructions) {
        showError('Please fill in all fields!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, ingredients, instructions })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add recipe');
        }
        
        recipeName.value = '';
        recipeIngredients.value = '';
        recipeInstructions.value = '';
        showSuccess('Recipe added successfully! 🎉');
        loadRecipes();
    } catch (error) {
        console.error('Error adding recipe:', error);
        showError(error.message);
    }
}

// Delete recipe
async function deleteRecipe(id) {
    if (!confirm('Are you sure you want to delete this recipe?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/recipes/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete recipe');
        
        showSuccess('Recipe deleted successfully!');
        loadRecipes();
    } catch (error) {
        console.error('Error deleting recipe:', error);
        showError('Failed to delete recipe. Please try again.');
    }
}

// Display recipes
function displayRecipes(recipes) {
    recipesList.innerHTML = '';
    
    if (recipes.length === 0) {
        recipesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🍳</div>
                <p>No recipes yet. Add your first recipe!</p>
            </div>
        `;
        return;
    }
    
    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-header">
                <h3 class="recipe-title">${escapeHtml(recipe.name)}</h3>
                <span class="recipe-id">Recipe #${recipe.id}</span>
            </div>
            
            <div class="recipe-section">
                <h4>🥕 Ingredients</h4>
                <div class="recipe-ingredients">${escapeHtml(recipe.ingredients)}</div>
            </div>
            
            <div class="recipe-section">
                <h4>📝 Instructions</h4>
                <div class="recipe-instructions">${escapeHtml(recipe.instructions)}</div>
            </div>
            
            <div class="recipe-footer">
                <button class="btn btn-delete" onclick="deleteRecipe(${recipe.id})">🗑️ Delete</button>
            </div>
        `;
        recipesList.appendChild(card);
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const formSection = document.querySelector('.form-section');
    formSection.insertBefore(errorDiv, formSection.children[1]);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    const formSection = document.querySelector('.form-section');
    formSection.insertBefore(successDiv, formSection.children[1]);
    
    setTimeout(() => successDiv.remove(), 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
