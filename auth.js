// auth.js
const AUTH_CONFIG = {
    // Change this password!
    PASSWORD: '3442Dink&72!',
    STORAGE_KEY: 'financial_tracker_auth'
};

// Check if user is already authenticated
function checkExistingAuth() {
    const authData = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    if (authData) {
        const { timestamp, password } = JSON.parse(authData);
        
        // Check if session is still valid (24 hours)
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        
        if (!isExpired && password === AUTH_CONFIG.PASSWORD) {
            // Redirect to main app if we're on auth page
            if (window.location.pathname.includes('auth.html')) {
                window.location.href = 'index.html';
            }
            return true;
        } else {
            // Clear expired or invalid auth
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
        }
    }
    return false;
}

// Password check function
function checkPassword() {
    const inputPassword = document.getElementById('password').value;
    const errorElement = document.getElementById('auth-error');
    
    if (inputPassword === AUTH_CONFIG.PASSWORD) {
        // Store authentication with timestamp
        const authData = {
            password: AUTH_CONFIG.PASSWORD,
            timestamp: Date.now()
        };
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(authData));
        
        // Redirect to main app
        window.location.href = 'index.html';
    } else {
        errorElement.textContent = 'Incorrect password. Please try again.';
        errorElement.classList.add('show');
        
        // Clear error after 3 seconds
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 3000);
    }
}

// Logout function
function logout() {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
    window.location.href = 'auth.html';
}

// Add logout button to main app (we'll call this from script.js)
function addLogoutButton() {
    const nav = document.querySelector('.nav');
    if (nav) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = '🚪 Logout';
        logoutBtn.className = 'nav-btn';
        logoutBtn.onclick = logout;
        nav.appendChild(logoutBtn);
    }
}

// Handle Enter key in password field
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    // Check existing auth on page load
    if (!window.location.pathname.includes('auth.html')) {
        if (!checkExistingAuth()) {
            window.location.href = 'auth.html';
        }
    }
});
