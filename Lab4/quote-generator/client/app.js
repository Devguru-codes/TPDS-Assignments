const API_URL = 'http://localhost:5000';

const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const newQuoteBtn = document.getElementById('newQuoteBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const favoritesList = document.getElementById('favoritesList');

let currentQuote = null;

// Load favorites on page load
document.addEventListener('DOMContentLoaded', loadFavorites);

// Button event listeners
newQuoteBtn.addEventListener('click', getNewQuote);
favoriteBtn.addEventListener('click', addToFavorites);

// Get a new random quote
async function getNewQuote() {
    try {
        newQuoteBtn.disabled = true;
        newQuoteBtn.textContent = '⏳ Loading...';
        
        const response = await fetch(`${API_URL}/quote`);
        if (!response.ok) throw new Error('Failed to fetch quote');
        
        currentQuote = await response.json();
        displayQuote(currentQuote);
        
        favoriteBtn.disabled = false;
        newQuoteBtn.disabled = false;
        newQuoteBtn.textContent = '✨ New Quote';
    } catch (error) {
        console.error('Error fetching quote:', error);
        showError('Failed to fetch quote. Make sure the server is running on port 5000.');
        newQuoteBtn.disabled = false;
        newQuoteBtn.textContent = '✨ New Quote';
    }
}

// Display quote
function displayQuote(quote) {
    quoteText.textContent = quote.text;
    quoteAuthor.textContent = `— ${quote.author}`;
}

// Add quote to favorites
async function addToFavorites() {
    if (!currentQuote) return;
    
    try {
        const response = await fetch(`${API_URL}/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentQuote)
        });
        
        if (!response.ok) {
            const error = await response.json();
            if (response.status === 400) {
                showError(error.error);
                return;
            }
            throw new Error('Failed to add to favorites');
        }
        
        loadFavorites();
        showSuccess('Added to favorites! ❤️');
    } catch (error) {
        console.error('Error adding to favorites:', error);
        showError('Failed to add to favorites. Please try again.');
    }
}

// Load all favorites
async function loadFavorites() {
    try {
        const response = await fetch(`${API_URL}/favorites`);
        if (!response.ok) throw new Error('Failed to load favorites');
        
        const favorites = await response.json();
        displayFavorites(favorites);
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesList.innerHTML = '<div class="error">Failed to load favorites</div>';
    }
}

// Display favorites list
function displayFavorites(favorites) {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="empty-state">No favorite quotes yet. Add some! 💭</div>';
        return;
    }
    
    favorites.forEach(quote => {
        const card = document.createElement('div');
        card.className = 'favorite-card';
        card.innerHTML = `
            <p>"${escapeHtml(quote.text)}"</p>
            <p>— ${escapeHtml(quote.author)}</p>
        `;
        favoritesList.appendChild(card);
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const quoteSection = document.querySelector('.quote-section');
    quoteSection.insertBefore(errorDiv, quoteSection.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    const originalText = favoriteBtn.textContent;
    favoriteBtn.textContent = message;
    favoriteBtn.disabled = true;
    
    setTimeout(() => {
        favoriteBtn.textContent = originalText;
        favoriteBtn.disabled = false;
    }, 2000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
