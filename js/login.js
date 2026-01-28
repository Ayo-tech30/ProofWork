// Login page functionality

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    // Hide previous errors
    errorMessage.style.display = 'none';
    
    // Get form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging In...';
    
    try {
        // Set persistence based on remember me
        if (rememberMe) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
        
        // Sign in
        await auth.signInWithEmailAndPassword(email, password);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        showError(getErrorMessage(error.code));
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log In';
    }
});

// Social authentication handlers
document.getElementById('googleLogin').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Google login error:', error);
        showError('Google login failed. Please try again.');
    }
});

document.getElementById('githubLogin').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        await auth.signInWithPopup(provider);
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('GitHub login error:', error);
        showError('GitHub login failed. Please try again.');
    }
});

document.getElementById('linkedinLogin').addEventListener('click', () => {
    showError('LinkedIn authentication coming soon!');
});

// Helper functions
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email. Please sign up.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    
    return errorMessages[errorCode] || 'Login failed. Please try again.';
}

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // Already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
});
