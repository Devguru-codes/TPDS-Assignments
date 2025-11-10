const API_URL = 'http://localhost:5001'; // Note: Lab 7 uses port 5001

const reviewForm = document.getElementById('reviewForm');
const bookTitle = document.getElementById('bookTitle');
const bookAuthor = document.getElementById('bookAuthor');
const bookRating = document.getElementById('bookRating');
const ratingValue = document.getElementById('ratingValue');
const bookReview = document.getElementById('bookReview');
const reviewsList = document.getElementById('reviewsList');

// Update rating display
bookRating.addEventListener('input', (e) => {
    ratingValue.textContent = e.target.value;
});

// Load reviews on page load
document.addEventListener('DOMContentLoaded', loadReviews);

// Form submission
reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addReview();
});

// Load all reviews
async function loadReviews() {
    try {
        reviewsList.innerHTML = '<div class="loading">Loading reviews...</div>';
        
        const response = await fetch(`${API_URL}/reviews`);
        if (!response.ok) throw new Error('Failed to load reviews');
        
        const reviews = await response.json();
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        showError('Failed to load reviews. Make sure the server is running on port 5001.');
    }
}

// Add new review
async function addReview() {
    const title = bookTitle.value.trim();
    const author = bookAuthor.value.trim();
    const rating = parseInt(bookRating.value);
    const review_text = bookReview.value.trim();
    
    if (!title || !author || !review_text) {
        showError('Please fill in all fields!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, rating, review_text })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add review');
        }
        
        bookTitle.value = '';
        bookAuthor.value = '';
        bookRating.value = 5;
        ratingValue.textContent = '5';
        bookReview.value = '';
        showSuccess('Review submitted successfully! 🎉');
        loadReviews();
    } catch (error) {
        console.error('Error adding review:', error);
        showError(error.message);
    }
}

// Filter reviews by rating
async function filterByRating(rating) {
    try {
        reviewsList.innerHTML = '<div class="loading">Filtering reviews...</div>';
        
        const response = await fetch(`${API_URL}/reviews/filter?rating=${rating}`);
        if (!response.ok) throw new Error('Failed to filter reviews');
        
        const reviews = await response.json();
        displayReviews(reviews, `Showing ${rating}-star reviews`);
    } catch (error) {
        console.error('Error filtering reviews:', error);
        showError('Failed to filter reviews. Please try again.');
    }
}

// Delete review
async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete review');
        
        showSuccess('Review deleted successfully!');
        loadReviews();
    } catch (error) {
        console.error('Error deleting review:', error);
        showError('Failed to delete review. Please try again.');
    }
}

// Display reviews
function displayReviews(reviews, message = '') {
    reviewsList.innerHTML = '';
    
    if (message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success';
        messageDiv.textContent = message;
        reviewsList.appendChild(messageDiv);
    }
    
    if (reviews.length === 0) {
        reviewsList.innerHTML += `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p>No reviews found. Be the first to review a book!</p>
            </div>
        `;
        return;
    }
    
    reviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-header">
                <div class="review-title-section">
                    <h3>${escapeHtml(review.title)}</h3>
                    <p class="review-author">by ${escapeHtml(review.author)}</p>
                </div>
                <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
            </div>
            
            <div class="review-text">${escapeHtml(review.review_text)}</div>
            
            <div class="review-footer">
                <span class="review-id">Review #${review.id}</span>
                <div class="review-actions">
                    <button class="btn btn-delete" onclick="deleteReview(${review.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
        reviewsList.appendChild(card);
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
