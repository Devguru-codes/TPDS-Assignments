const API_URL = 'http://localhost:5003';
let token = localStorage.getItem('token') || '';
let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
let currentPage = 1;
let totalPages = 1;
const jobsPerPage = 5;
let searchQuery = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showApp();
        loadJobs();
        loadRecommendedJobs();
    } else {
        showAuth();
    }
});

// Auth Functions
function showLogin() {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error || 'Login failed';
            return;
        }

        token = data.token;
        currentUser = { username: data.username, skills: data.skills };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));

        errorEl.textContent = '';
        showApp();
        loadJobs();
        loadRecommendedJobs();
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const skills = document.getElementById('register-skills').value;
    const errorEl = document.getElementById('register-error');

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, skills })
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error || 'Registration failed';
            return;
        }

        errorEl.textContent = '';
        alert('Registration successful! Please login.');
        showLogin();
        document.getElementById('register-form').reset();
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
    }
}

function handleLogout() {
    token = '';
    currentUser = {};
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuth();
}

function showAuth() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('username-display').textContent = `👤 ${currentUser.username}`;
    document.getElementById('user-skills').textContent = currentUser.skills;
}

// Job Functions
async function handlePostJob(event) {
    event.preventDefault();
    const title = document.getElementById('job-title').value;
    const description = document.getElementById('job-description').value;
    const skills_required = document.getElementById('job-skills').value;

    try {
        const response = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, skills_required })
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Failed to post job');
            return;
        }

        alert('Job posted successfully!');
        document.getElementById('job-title').value = '';
        document.getElementById('job-description').value = '';
        document.getElementById('job-skills').value = '';
        loadJobs();
        loadRecommendedJobs();
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

async function loadJobs() {
    const jobsContainer = document.getElementById('all-jobs');
    jobsContainer.innerHTML = '<p class="loading">Loading jobs...</p>';

    try {
        const response = await fetch(`${API_URL}/jobs?page=${currentPage}&limit=${jobsPerPage}&search=${searchQuery}`);
        const data = await response.json();

        if (!response.ok) {
            jobsContainer.innerHTML = '<p class="loading">Failed to load jobs</p>';
            return;
        }

        totalPages = Math.ceil(data.total / jobsPerPage);
        updatePagination();

        if (data.jobs.length === 0) {
            jobsContainer.innerHTML = '<p class="loading">No jobs found</p>';
            return;
        }

        jobsContainer.innerHTML = data.jobs.map(job => createJobCard(job, false)).join('');
    } catch (error) {
        jobsContainer.innerHTML = '<p class="loading">Network error</p>';
    }
}

async function loadRecommendedJobs() {
    const jobsContainer = document.getElementById('recommended-jobs');
    jobsContainer.innerHTML = '<p class="loading">Loading recommendations...</p>';

    try {
        const response = await fetch(`${API_URL}/jobs/recommended`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            jobsContainer.innerHTML = '<p class="loading">Failed to load recommendations</p>';
            return;
        }

        const jobs = await response.json();

        if (jobs.length === 0) {
            jobsContainer.innerHTML = '<p class="loading">No recommended jobs yet. Try adding more skills!</p>';
            return;
        }

        jobsContainer.innerHTML = jobs.map(job => createJobCard(job, true)).join('');
    } catch (error) {
        jobsContainer.innerHTML = '<p class="loading">Network error</p>';
    }
}

function createJobCard(job, isRecommended) {
    const isOwner = job.user_id === currentUser.id || job.username === currentUser.username;
    
    return `
        <div class="job-card ${isRecommended ? 'recommended' : ''}">
            <h4>${job.title}</h4>
            <p><strong>Description:</strong> ${job.description}</p>
            <p><strong>Required Skills:</strong> ${job.skills_required}</p>
            <p><strong>Posted by:</strong> ${job.username}</p>
            ${job.score ? `<p><strong>Match Score:</strong> ${job.score} skill(s) match</p>` : ''}
            <div class="job-actions">
                <button class="btn-apply" onclick="applyToJob(${job.id})">Apply</button>
                <button class="btn-view" onclick="viewApplicants(${job.id})">View Applicants</button>
                ${isOwner ? `<button class="btn-delete" onclick="deleteJob(${job.id})">Delete</button>` : ''}
            </div>
            <div id="applicants-${job.id}"></div>
        </div>
    `;
}

async function applyToJob(jobId) {
    try {
        const response = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ job_id: jobId })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Failed to apply');
            return;
        }

        alert('Application submitted successfully!');
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

async function viewApplicants(jobId) {
    const container = document.getElementById(`applicants-${jobId}`);
    
    try {
        const response = await fetch(`${API_URL}/applications/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            container.innerHTML = '<div class="applicants-section"><p>Failed to load applicants</p></div>';
            return;
        }

        const applicants = await response.json();

        if (applicants.length === 0) {
            container.innerHTML = '<div class="applicants-section"><h5>Applicants:</h5><p>No applicants yet</p></div>';
        } else {
            const applicantsList = applicants.map(app => `<p>👤 ${app.username}</p>`).join('');
            container.innerHTML = `<div class="applicants-section"><h5>Applicants (${applicants.length}):</h5>${applicantsList}</div>`;
        }
    } catch (error) {
        container.innerHTML = '<div class="applicants-section"><p>Network error</p></div>';
    }
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Failed to delete job');
            return;
        }

        alert('Job deleted successfully!');
        loadJobs();
        loadRecommendedJobs();
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// Search and Pagination
function handleSearch() {
    searchQuery = document.getElementById('search-input').value;
    currentPage = 1;
    loadJobs();
}

function updatePagination() {
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = currentPage >= totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadJobs();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadJobs();
    }
}
