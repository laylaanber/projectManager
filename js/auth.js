/**
 * Orange Coding Academy Authentication System
 * Handles user login, registration, and session management
 */

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorMessage = document.getElementById('error-message');
const regErrorMessage = document.getElementById('reg-error-message');
const passwordToggles = document.querySelectorAll('.toggle-password');

// If on password entry page, set up password visibility toggle
passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
        const passwordField = this.previousElementSibling;
        const icon = this.querySelector('i');
        
        // Toggle password visibility
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordField.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Password strength meter (if on registration page)
if (registerForm) {
    const passwordInput = document.getElementById('reg-password');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text span');
    const confirmPassword = document.getElementById('confirm-password');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        
        // Remove all previous classes
        document.querySelector('.password-strength').className = 'password-strength';
        
        // Add appropriate class based on strength
        if (password) {
            document.querySelector('.password-strength').classList.add(`strength-${strength.level}`);
            strengthText.textContent = strength.text;
        } else {
            strengthText.textContent = 'Weak';
        }
    });
    
    // Check password match
    confirmPassword.addEventListener('input', function() {
        if (this.value && this.value !== passwordInput.value) {
            this.setCustomValidity('Passwords do not match');
        } else {
            this.setCustomValidity('');
        }
    });
}

// Login form submission
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember').checked;
        
        // Validate input
        if (!email || !password) {
            showError(errorMessage, 'Please enter both email and password');
            return;
        }
        
        // Attempt login
        login(email, password, rememberMe);
    });
}

// Registration form submission
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        
        // Validate input
        if (!fullname || !email || !password) {
            showError(regErrorMessage, 'Please fill in all fields');
            return;
        }
        
        if (password !== confirmPass) {
            showError(regErrorMessage, 'Passwords do not match');
            return;
        }
        
        // Check password strength
        const strength = checkPasswordStrength(password);
        if (strength.level === 'weak') {
            showError(regErrorMessage, 'Please use a stronger password');
            return;
        }
        
        // Attempt registration
        register(fullname, email, password);
    });
}

/**
 * Perform login
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Remember user session
 */
function login(email, password, rememberMe) {
    // Get users from local storage
    const users = JSON.parse(localStorage.getItem('orangeAcademyUsers')) || [];
    
    // Find user with matching email
    const user = users.find(u => u.email === email);
    
    // Check if user exists and password matches
    if (user && user.password === password) {
        // Create session
        const session = {
            userId: user.id,
            fullname: user.fullname,
            email: user.email,
            loggedIn: true,
            timestamp: new Date().getTime()
        };
        
        // Store session
        localStorage.setItem('orangeAcademySession', JSON.stringify(session));
        
        // Redirect directly to dashboard instead of index.html
        window.location.href = 'dashboard.html';
    } else {
        showError(errorMessage, 'Invalid email or password');
    }
}

/**
 * Register a new user
 * @param {string} fullname - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
function register(fullname, email, password) {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('orangeAcademyUsers')) || [];
    
    // Check if email is already in use
    if (users.some(user => user.email === email)) {
        showError(regErrorMessage, 'Email is already registered');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        fullname,
        email,
        password,
        created: new Date().toISOString()
    };
    
    // Add user to storage
    users.push(newUser);
    localStorage.setItem('orangeAcademyUsers', JSON.stringify(users));
    
    // Show success message and redirect
    regErrorMessage.textContent = 'Registration successful! Redirecting to login...';
    regErrorMessage.style.color = 'var(--success-color)';
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

/**
 * Check if user is logged in
 * @returns {boolean} Login status
 */
function isLoggedIn() {
    const session = JSON.parse(localStorage.getItem('orangeAcademySession'));
    return !!(session && session.loggedIn);
}

/**
 * Get current user information
 * @returns {object|null} User object or null if not logged in
 */
function getCurrentUser() {
    if (!isLoggedIn()) return null;
    
    const session = JSON.parse(localStorage.getItem('orangeAcademySession'));
    return {
        id: session.userId,
        fullname: session.fullname,
        email: session.email
    };
}

/**
 * Log out the current user
 */
function logout() {
    localStorage.removeItem('orangeAcademySession');
    window.location.href = 'login.html';
}

/**
 * Display error message
 * @param {HTMLElement} element - Error message element
 * @param {string} message - Error message to display
 */
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    
    // Clear error after 5 seconds
    setTimeout(() => {
        element.textContent = '';
    }, 5000);
}

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {object} Strength assessment with level and description
 */
function checkPasswordStrength(password) {
    if (!password) {
        return { level: 'weak', text: 'Weak' };
    }
    
    const lengthScore = password.length >= 8 ? 1 : 0;
    const uppercaseScore = /[A-Z]/.test(password) ? 1 : 0;
    const lowercaseScore = /[a-z]/.test(password) ? 1 : 0;
    const digitScore = /\d/.test(password) ? 1 : 0;
    const specialScore = /[^A-Za-z0-9]/.test(password) ? 1 : 0;
    
    const score = lengthScore + uppercaseScore + lowercaseScore + digitScore + specialScore;
    
    if (score <= 2) {
        return { level: 'weak', text: 'Weak' };
    } else if (score === 3) {
        return { level: 'medium', text: 'Medium' };
    } else if (score === 4) {
        return { level: 'good', text: 'Good' };
    } else {
        return { level: 'strong', text: 'Strong' };
    }
}

// Check if user is logged in and handle page access
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // If user is on login or register page but already logged in, redirect to dashboard
    if ((currentPage === 'login.html' || currentPage === 'register.html') && isLoggedIn()) {
        window.location.href = 'dashboard.html'; // Changed from index.html to dashboard.html
        return;
    }
    
    // If user is on main page but not logged in, redirect to login
    if ((currentPage === 'index.html' || currentPage === 'dashboard.html') && !isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
});