const API_URL = 'http://localhost:5000';

const userForm = document.getElementById('userForm');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const usersList = document.getElementById('usersList');

// Load users on page load
document.addEventListener('DOMContentLoaded', loadUsers);

// Form submission
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addUser();
});

// Load all users
async function loadUsers() {
    try {
        usersList.innerHTML = '<div class="empty-state">Loading users...</div>';
        
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Failed to load users');
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users. Make sure the server is running on port 5000.');
    }
}

// Add new user
async function addUser() {
    const name = userName.value.trim();
    const email = userEmail.value.trim();
    
    if (!name || !email) {
        showError('Please fill in all fields!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email })
        });
        
        if (!response.ok) throw new Error('Failed to add user');
        
        const newUser = await response.json();
        userName.value = '';
        userEmail.value = '';
        showSuccess('User added successfully!');
        loadUsers();
    } catch (error) {
        console.error('Error adding user:', error);
        showError('Failed to add user. Please try again.');
    }
}

// Display users
function displayUsers(users) {
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="empty-state">No users registered yet. Add one above! 👆</div>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <span class="user-id">ID: ${user.id}</span>
            <h3>${escapeHtml(user.name)}</h3>
            <p>📧 ${escapeHtml(user.email)}</p>
        `;
        usersList.appendChild(userCard);
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.children[1]);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.children[1]);
    
    setTimeout(() => successDiv.remove(), 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
