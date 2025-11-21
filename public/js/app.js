const API_URL = 'https://127.0.0.1:8000/api';
let currentUser = null;
let token = localStorage.getItem('token');

// DOM Elements
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const usernameDisplay = document.getElementById('username-display');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.close');
const authForm = document.getElementById('auth-form');
const modalTitle = document.getElementById('modal-title');
const usernameInput = document.getElementById('username');
const bioInput = document.getElementById('bio');
const postContent = document.getElementById('post-content');
const charCount = document.getElementById('char-count');
const postBtn = document.getElementById('post-btn');
const postsFeed = document.getElementById('posts-feed');

let isRegisterMode = false;

// Initialize
init();

async function init() {
    if (token) {
        await loadCurrentUser();
    }
    await loadPosts();
    setupEventListeners();
}

function setupEventListeners() {
    loginBtn.addEventListener('click', () => openAuthModal(false));
    registerBtn.addEventListener('click', () => openAuthModal(true));
    logoutBtn.addEventListener('click', logout);
    closeModal.addEventListener('click', () => authModal.classList.add('hidden'));
    authForm.addEventListener('submit', handleAuth);
    postContent.addEventListener('input', updateCharCount);
    postBtn.addEventListener('click', createPost);
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.add('hidden');
        }
    });
}

function openAuthModal(register = false) {
    isRegisterMode = register;
    modalTitle.textContent = register ? 'Inscription' : 'Connexion';
    usernameInput.classList.toggle('hidden', !register);
    bioInput.classList.toggle('hidden', !register);
    authModal.classList.remove('hidden');
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isRegisterMode) {
        const username = usernameInput.value;
        const bio = bioInput.value;
        await register(email, password, username, bio);
    } else {
        await login(email, password);
    }
}

async function register(email, password, username, bio) {
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                plainPassword: password,
                username,
                bio
            })
        });

        if (response.ok) {
            alert('Inscription réussie ! Tu peux te connecter maintenant 🔥');
            authModal.classList.add('hidden');
            authForm.reset();
        } else {
            const error = await response.json();
            alert(`Erreur: ${error.message || 'Impossible de créer le compte'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur réseau 💀');
    }
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            await loadCurrentUser();
            authModal.classList.add('hidden');
            authForm.reset();
            await loadPosts();
        } else {
            alert('Identifiants incorrects 💀');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur réseau 💀');
    }
}

async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data['hydra:member'] && data['hydra:member'].length > 0) {
                currentUser = data['hydra:member'][0];
                updateUI();
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

function updateUI() {
    if (currentUser) {
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        usernameDisplay.textContent = `@${currentUser.username}`;
        document.querySelector('.post-creator').classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
        document.querySelector('.post-creator').classList.add('hidden');
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateUI();
    loadPosts();
}

function updateCharCount() {
    const remaining = 280 - postContent.value.length;
    charCount.textContent = remaining;
    charCount.style.color = remaining < 50 ? 'var(--warning)' : 'var(--text-secondary)';
}

async function createPost() {
    if (!token || !currentUser) {
        alert('Tu dois te connecter pour poster 💀');
        return;
    }

    const content = postContent.value.trim();
    if (!content) {
        alert('Écris quelque chose fdp 🔥');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content,
                author: `/api/users/${currentUser.id}`
            })
        });

        if (response.ok) {
            postContent.value = '';
            updateCharCount();
            await loadPosts();
        } else {
            const error = await response.json();
            alert(`Erreur: ${error.message || 'Impossible de poster'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur réseau 💀');
    }
}

async function loadPosts() {
    try {
        postsFeed.innerHTML = '<div class="loading">Chargement des patapims... 🔥</div>';
        
        const response = await fetch(`${API_URL}/posts?order[createdAt]=desc`);
        
        if (response.ok) {
            const data = await response.json();
            const posts = data['hydra:member'] || [];
            
            if (posts.length === 0) {
                postsFeed.innerHTML = '<div class="loading">Aucun post pour le moment 💀</div>';
                return;
            }
            
            postsFeed.innerHTML = posts.map(post => createPostHTML(post)).join('');
            setupPostActions();
        } else {
            postsFeed.innerHTML = '<div class="loading">Erreur de chargement 💀</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        postsFeed.innerHTML = '<div class="loading">Erreur réseau 💀</div>';
    }
}

function createPostHTML(post) {
    const date = new Date(post.createdAt);
    const timeAgo = getTimeAgo(date);
    const authorUsername = post.author?.username || 'Anonyme';
    
    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <span class="post-author">@${authorUsername}</span>
                <span class="post-date">${timeAgo}</span>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            <div class="post-actions">
                <button class="post-action like-btn" data-post-id="${post.id}">
                    ❤️ <span>${post.likesCount || 0}</span>
                </button>
                <button class="post-action repost-btn" data-post-id="${post.id}">
                    🔄 <span>${post.repostsCount || 0}</span>
                </button>
                <button class="post-action comment-btn" data-post-id="${post.id}">
                    💬 <span>0</span>
                </button>
            </div>
        </div>
    `;
}

function setupPostActions() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', () => likePost(btn.dataset.postId));
    });
}

async function likePost(postId) {
    if (!token) {
        alert('Connecte-toi pour liker 💀');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/likes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user: `/api/users/${currentUser.id}`,
                post: `/api/posts/${postId}`
            })
        });

        if (response.ok) {
            await loadPosts();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'à l\'instant';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}j`;
    
    return date.toLocaleDateString('fr-FR');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-refresh posts every 10 seconds
setInterval(loadPosts, 10000);

