const API_URL = 'http://localhost:5002';
let token = localStorage.getItem('token');
let currentUsername = localStorage.getItem('username');

// Auth forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const projectForm = document.getElementById('projectForm');

// Check if already logged in
if (token) {
    showMainSection();
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        token = data.token;
        currentUsername = data.username;
        localStorage.setItem('token', token);
        localStorage.setItem('username', currentUsername);
        showMainSection();
    } catch (err) {
        showError(err.message);
    }
});

// Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        showSuccess('Registration successful! Please login.');
        showLogin();
    } catch (err) {
        showError(err.message);
    }
});

// Project form
projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDesc').value;
    const budget = document.getElementById('projectBudget').value;
    
    try {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, budget })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        projectForm.reset();
        showSuccess('Project posted!');
        loadProjects();
    } catch (err) {
        showError(err.message);
    }
});

function showLogin() {
    document.querySelector('.tabs button:first-child').classList.add('active');
    document.querySelector('.tabs button:last-child').classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
}

function showRegister() {
    document.querySelector('.tabs button:first-child').classList.remove('active');
    document.querySelector('.tabs button:last-child').classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
}

function showMainSection() {
    authSection.style.display = 'none';
    mainSection.style.display = 'block';
    document.getElementById('username').textContent = currentUsername;
    loadProjects();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    token = null;
    location.reload();
}

async function loadProjects() {
    try {
        const res = await fetch(`${API_URL}/projects`);
        const projects = await res.json();
        displayProjects(projects);
    } catch (err) {
        showError('Failed to load projects');
    }
}

function displayProjects(projects) {
    const list = document.getElementById('projectsList');
    list.innerHTML = '';
    
    if (projects.length === 0) {
        list.innerHTML = '<div class="empty-state">No projects yet. Post the first one!</div>';
        return;
    }
    
    projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${esc(p.title)}</h3>
                <span class="project-budget">$${p.budget}</span>
            </div>
            <p class="project-desc">${esc(p.description)}</p>
            <div class="project-footer">
                <div class="project-meta">Posted by: ${esc(p.username)}</div>
                <div class="project-actions">
                    ${p.username === currentUsername ? 
                        `<button class="btn btn-delete" onclick="deleteProject(${p.id})">Delete</button>` :
                        `<button class="btn btn-bid" onclick="showBidForm(${p.id})">Place Bid</button>`
                    }
                    <button class="btn btn-view-bids" onclick="toggleBids(${p.id})">View Bids</button>
                </div>
            </div>
            <div id="bid-form-${p.id}" style="display:none" class="bid-form">
                <input type="number" id="bid-amount-${p.id}" placeholder="Your bid amount" min="1">
                <button class="btn btn-bid" onclick="submitBid(${p.id})">Submit Bid</button>
            </div>
            <div id="bids-${p.id}" style="display:none"></div>
        `;
        list.appendChild(card);
    });
}

function showBidForm(projectId) {
    const form = document.getElementById(`bid-form-${projectId}`);
    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
}

async function submitBid(projectId) {
    const amount = document.getElementById(`bid-amount-${projectId}`).value;
    if (!amount) return alert('Please enter bid amount');
    
    try {
        const res = await fetch(`${API_URL}/bids`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ project_id: projectId, amount })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        showSuccess('Bid submitted!');
        document.getElementById(`bid-form-${projectId}`).style.display = 'none';
        document.getElementById(`bid-amount-${projectId}`).value = '';
    } catch (err) {
        showError(err.message);
    }
}

async function toggleBids(projectId) {
    const bidsDiv = document.getElementById(`bids-${projectId}`);
    if (bidsDiv.style.display !== 'none') {
        bidsDiv.style.display = 'none';
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/bids/${projectId}`);
        const bids = await res.json();
        
        bidsDiv.innerHTML = '<div class="bids-section"><h4>Bids:</h4>';
        if (bids.length === 0) {
            bidsDiv.innerHTML += '<p>No bids yet</p>';
        } else {
            bids.forEach(b => {
                bidsDiv.innerHTML += `<div class="bid-item"><span>${esc(b.username)}</span><strong>$${b.amount}</strong></div>`;
            });
        }
        bidsDiv.innerHTML += '</div>';
        bidsDiv.style.display = 'block';
    } catch (err) {
        showError('Failed to load bids');
    }
}

async function deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    
    try {
        const res = await fetch(`${API_URL}/projects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to delete');
        showSuccess('Project deleted!');
        loadProjects();
    } catch (err) {
        showError(err.message);
    }
}

function showError(msg) {
    const div = document.createElement('div');
    div.className = 'error';
    div.textContent = msg;
    document.querySelector('.container').insertBefore(div, document.querySelector('.container').firstChild);
    setTimeout(() => div.remove(), 3000);
}

function showSuccess(msg) {
    const div = document.createElement('div');
    div.className = 'success';
    div.textContent = msg;
    document.querySelector('.container').insertBefore(div, document.querySelector('.container').firstChild);
    setTimeout(() => div.remove(), 3000);
}

function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
