const API_URL = 'http://localhost:5000';

const counterValue = document.getElementById('counterValue');
const incrementBtn = document.getElementById('incrementBtn');
const decrementBtn = document.getElementById('decrementBtn');
const resetBtn = document.getElementById('resetBtn');
const syncInfo = document.querySelector('.sync-info');

let currentCount = 0;

// Load counter value on page load
document.addEventListener('DOMContentLoaded', loadCounter);

// Button event listeners
incrementBtn.addEventListener('click', () => updateCounter(currentCount + 1));
decrementBtn.addEventListener('click', () => updateCounter(currentCount - 1));
resetBtn.addEventListener('click', () => updateCounter(0));

// Load counter from server
async function loadCounter() {
    try {
        const response = await fetch(`${API_URL}/count`);
        if (!response.ok) throw new Error('Failed to load counter');
        
        const data = await response.json();
        currentCount = data.count;
        displayCounter(currentCount);
    } catch (error) {
        console.error('Error loading counter:', error);
        showError('Failed to load counter. Make sure server is running on port 5000.');
    }
}

// Update counter on server
async function updateCounter(newValue) {
    try {
        const response = await fetch(`${API_URL}/count`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ count: newValue })
        });
        
        if (!response.ok) throw new Error('Failed to update counter');
        
        const data = await response.json();
        currentCount = data.count;
        displayCounter(currentCount);
        showSyncIndicator();
    } catch (error) {
        console.error('Error updating counter:', error);
        showError('Failed to update counter. Please try again.');
    }
}

// Display counter value
function displayCounter(value) {
    counterValue.textContent = value;
    counterValue.classList.add('animate');
    setTimeout(() => counterValue.classList.remove('animate'), 300);
}

// Show sync indicator
function showSyncIndicator() {
    syncInfo.classList.add('show');
    setTimeout(() => syncInfo.classList.remove('show'), 2000);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}
