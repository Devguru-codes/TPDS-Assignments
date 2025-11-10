const API_URL = 'http://localhost:5000';

const eventForm = document.getElementById('eventForm');
const eventTitle = document.getElementById('eventTitle');
const eventDate = document.getElementById('eventDate');
const eventDescription = document.getElementById('eventDescription');
const eventsList = document.getElementById('eventsList');
const filterDate = document.getElementById('filterDate');
const filterBtn = document.getElementById('filterBtn');
const clearFilterBtn = document.getElementById('clearFilterBtn');

// Load events on page load
document.addEventListener('DOMContentLoaded', loadEvents);

// Form submission
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addEvent();
});

// Filter events
filterBtn.addEventListener('click', filterEvents);
clearFilterBtn.addEventListener('click', () => {
    filterDate.value = '';
    loadEvents();
});

// Load all events
async function loadEvents() {
    try {
        eventsList.innerHTML = '<div class="loading">Loading events...</div>';
        
        const response = await fetch(`${API_URL}/events`);
        if (!response.ok) throw new Error('Failed to load events');
        
        const events = await response.json();
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Failed to load events. Make sure the server is running on port 5000.');
    }
}

// Add new event
async function addEvent() {
    const title = eventTitle.value.trim();
    const date = eventDate.value;
    const description = eventDescription.value.trim();
    
    if (!title || !date || !description) {
        showError('Please fill in all fields!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, date, description })
        });
        
        if (!response.ok) throw new Error('Failed to add event');
        
        eventTitle.value = '';
        eventDate.value = '';
        eventDescription.value = '';
        showSuccess('Event created successfully! 🎉');
        loadEvents();
    } catch (error) {
        console.error('Error adding event:', error);
        showError('Failed to add event. Please try again.');
    }
}

// Filter events by date
async function filterEvents() {
    const date = filterDate.value;
    
    if (!date) {
        showError('Please select a date to filter!');
        return;
    }
    
    try {
        eventsList.innerHTML = '<div class="loading">Filtering events...</div>';
        
        const response = await fetch(`${API_URL}/events/filter?date=${date}`);
        if (!response.ok) throw new Error('Failed to filter events');
        
        const events = await response.json();
        displayEvents(events, `Showing events for ${formatDate(date)}`);
    } catch (error) {
        console.error('Error filtering events:', error);
        showError('Failed to filter events. Please try again.');
    }
}

// Display events
function displayEvents(events, message = '') {
    eventsList.innerHTML = '';
    
    if (message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success';
        messageDiv.textContent = message;
        eventsList.appendChild(messageDiv);
    }
    
    if (events.length === 0) {
        eventsList.innerHTML += `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No events found. Create your first event!</p>
            </div>
        `;
        return;
    }
    
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="event-header">
                <h3 class="event-title">${escapeHtml(event.title)}</h3>
                <span class="event-date">${formatDate(event.date)}</span>
            </div>
            <p class="event-description">${escapeHtml(event.description)}</p>
            <span class="event-id">Event #${event.id}</span>
        `;
        eventsList.appendChild(card);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
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
