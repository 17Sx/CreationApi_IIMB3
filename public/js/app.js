const API_URL = 'https://127.0.0.1:8000/api';
let currentUser = null;
let token = localStorage.getItem('token') || null;
let userLikes = new Set();

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
const usernameGroup = document.getElementById('username-group');
const bioGroup = document.getElementById('bio-group');
const postContent = document.getElementById('post-content');
const charCount = document.getElementById('char-count');
const postBtn = document.getElementById('post-btn');
const postsFeed = document.getElementById('posts-feed');

let isRegisterMode = false;

init();

async function init() {
    setupEventListeners();
    if (token) {
        await loadCurrentUser();
    }
    await loadPosts();
}

function setupEventListeners() {
    loginBtn?.addEventListener('click', () => openAuthModal(false));
    registerBtn?.addEventListener('click', () => openAuthModal(true));
    logoutBtn?.addEventListener('click', logout);
    closeModal?.addEventListener('click', () => authModal.classList.add('hidden'));

    const modalBackdrop = document.querySelector('.modal-backdrop');
    modalBackdrop?.addEventListener('click', () => authModal.classList.add('hidden'));

    authForm?.addEventListener('submit', handleAuth);
    postContent?.addEventListener('input', updateCharCount);
    postBtn?.addEventListener('click', createPost);
}

function openAuthModal(register = false) {
    isRegisterMode = register;
    modalTitle.textContent = register ? 'INSCRIPTION' : 'CONNEXION';
    usernameGroup.classList.toggle('hidden', !register);
    bioGroup.classList.toggle('hidden', !register);
    authModal.classList.remove('hidden');
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isRegisterMode) {
        await register(email, password);
    } else {
        await login(email, password);
    }
}

async function register(email, password) {
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                plainPassword: password,
                username: email,
                bio: bioInput.value || ''
            })
        });

        if (response.ok) {
            alert('Inscription réussie !');
            authModal.classList.add('hidden');
            authForm.reset();
        } else {
            const error = await response.json().catch(() => ({ message: 'Erreur inscription' }));
            alert(error.message || 'Erreur inscription');
        }
    } catch (error) {
        alert('Erreur réseau');
    }
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            await loadCurrentUser();
            authModal.classList.add('hidden');
            authForm.reset();
            loadPosts();
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erreur' }));
            alert(errorData.message || 'Identifiants incorrects');
        }
    } catch (error) {
        alert('Erreur réseau');
    }
}

async function loadCurrentUser() {
    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateUI();
            await loadUserLikes();
        } else {
            token = null;
            localStorage.removeItem('token');
            currentUser = null;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function loadUserLikes() {
    if (!currentUser || !token) return;

    try {
        const response = await fetch(`${API_URL}/likes?user.id=${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const likes = data['hydra:member'] || [];
            userLikes = new Set(likes.map(like => {
                const postId = like.post?.id || like.post?.split('/').pop();
                return parseInt(postId);
            }).filter(id => !isNaN(id)));
        }
    } catch (error) {
        console.error('Error loading user likes:', error);
    }
}

function updateUI() {
    if (currentUser) {
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        usernameDisplay.textContent = `@${currentUser.username}`;
        document.querySelector('.post-creator')?.classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
        document.querySelector('.post-creator')?.classList.add('hidden');
    }
}

function logout() {
    token = null;
    currentUser = null;
    userLikes.clear();
    localStorage.removeItem('token');
    updateUI();
    loadPosts();
}

function updateCharCount() {
    if (!postContent) return;
    const remaining = 280 - postContent.value.length;
    charCount.textContent = remaining;
    charCount.style.color = remaining < 50 ? 'var(--accent-orange)' : 'var(--accent-cyan)';
}

async function createPost() {
    if (!token || !currentUser) {
        alert('Connecte-toi pour poster');
        return;
    }

    const content = postContent.value.trim();
    if (!content) {
        alert('Écris quelque chose');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            postContent.value = '';
            updateCharCount();
            loadPosts();
        } else {
            const error = await response.json().catch(() => ({ message: 'Erreur' }));
            alert(error.message || 'Erreur');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadPosts() {
    try {
        postsFeed.innerHTML = '<div class="loading">Chargement...</div>';
        const response = await fetch(`${API_URL}/posts?order[createdAt]=desc`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[loadPosts] Response error:', response.status, errorText);
            postsFeed.innerHTML = '<div class="loading">Erreur chargement</div>';
            return;
        }

        const data = await response.json();
        console.log('[loadPosts] API response:', data);

        // Gérer différents formats de réponse API Platform
        let posts = [];
        if (data['hydra:member']) {
            posts = data['hydra:member'];
        } else if (Array.isArray(data)) {
            posts = data;
        } else if (data.member) {
            posts = data.member;
        }

        console.log('[loadPosts] Parsed posts:', posts.length);

        if (posts.length === 0) {
            postsFeed.innerHTML = '<div class="loading">Aucun post</div>';
            return;
        }

        // Vérifier que les posts ont bien un id
        const validPosts = posts.filter(post => post && post.id);
        console.log('[loadPosts] Valid posts:', validPosts.length);

        if (validPosts.length === 0) {
            postsFeed.innerHTML = '<div class="loading">Aucun post valide</div>';
            return;
        }

        postsFeed.innerHTML = validPosts.map(post => createPostHTML(post)).join('');
        setupPostActions();
    } catch (error) {
        console.error('[loadPosts] Error:', error);
        postsFeed.innerHTML = '<div class="loading">Erreur réseau</div>';
    }
}

function createPostHTML(post) {
    const date = new Date(post.createdAt);
    const timeAgo = getTimeAgo(date);
    const authorUsername = post.author?.username || 'Anonyme';
    const isLiked = userLikes.has(parseInt(post.id));

    return `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <span class="post-author">@${authorUsername}</span>
                <span class="post-date">${timeAgo}</span>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            <div class="post-actions">
                <button class="post-action like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    LIKE <span class="like-count">${post.likesCount || 0}</span>
                </button>
                <button class="post-action comment-btn" data-post-id="${post.id}">
                    COMMENT <span class="comment-count">0</span>
                </button>
            </div>
            <div class="comments-section hidden" id="comments-${post.id}">
                <div class="comment-form">
                    <input type="text" class="comment-input" placeholder="Commentaire..." data-post-id="${post.id}">
                    <button class="comment-submit" data-post-id="${post.id}">ENVOYER</button>
                </div>
                <div class="comments-list" id="comments-list-${post.id}"></div>
            </div>
        </div>
    `;
}

function setupPostActions() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', () => likePost(btn.dataset.postId));
    });

    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleComments(btn.dataset.postId));
    });

    document.querySelectorAll('.comment-submit').forEach(btn => {
        btn.addEventListener('click', () => submitComment(btn.dataset.postId));
    });

    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitComment(input.dataset.postId);
        });
    });
}

async function likePost(postId) {
    if (!token || !currentUser) {
        alert('Connecte-toi pour liker');
        return;
    }

    const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    const likeCountSpan = likeBtn.querySelector('.like-count');
    const currentCount = parseInt(likeCountSpan.textContent) || 0;
    const isLiked = userLikes.has(parseInt(postId));

    try {
        if (isLiked) {
            const response = await fetch(`${API_URL}/likes?post.id=${postId}&user.id=${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const likes = data['hydra:member'] || [];
                if (likes.length > 0) {
                    const deleteResponse = await fetch(`${API_URL}/likes/${likes[0].id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (deleteResponse.ok || deleteResponse.status === 204) {
                        userLikes.delete(parseInt(postId));
                        likeBtn.classList.remove('liked');
                        likeCountSpan.textContent = Math.max(0, currentCount - 1);
                    }
                }
            }
        } else {
            const response = await fetch(`${API_URL}/likes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    post: `/api/posts/${postId}`
                })
            });

            if (response.ok) {
                userLikes.add(parseInt(postId));
                likeBtn.classList.add('liked');
                likeCountSpan.textContent = currentCount + 1;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);

    if (commentsSection.classList.contains('hidden')) {
        commentsSection.classList.remove('hidden');
        loadComments(postId);
    } else {
        commentsSection.classList.add('hidden');
    }
}

async function loadComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    const commentCountSpan = document.querySelector(`.comment-btn[data-post-id="${postId}"] .comment-count`);

    try {
        const response = await fetch(`${API_URL}/comments?post.id=${postId}&order[createdAt]=asc`);

        if (!response.ok) return;

        const data = await response.json();
        const comments = data['hydra:member'] || [];

        if (commentCountSpan) {
            commentCountSpan.textContent = comments.length;
        }

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="loading" style="padding: 20px; font-size: 14px;">Aucun commentaire</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const date = new Date(comment.createdAt);
            const timeAgo = getTimeAgo(date);
            const authorUsername = comment.author?.username || 'Anonyme';

            return `
                <div class="comment">
                    <div class="comment-header">
                        <span class="comment-author">@${authorUsername}</span>
                        <span class="comment-date">${timeAgo}</span>
                    </div>
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function submitComment(postId) {
    if (!token || !currentUser) {
        alert('Connecte-toi pour commenter');
        return;
    }

    const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
    const content = input.value.trim();

    if (!content) return;

    try {
        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content,
                post: `/api/posts/${postId}`
            })
        });

        if (response.ok) {
            input.value = '';
            loadComments(postId);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'maintenant';
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
