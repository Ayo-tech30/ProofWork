// Signup page functionality

// Show/hide role-specific fields
document.getElementById('role').addEventListener('change', (e) => {
    const role = e.target.value;
    const workerFields = document.getElementById('workerFields');
    const employerFields = document.getElementById('employerFields');
    
    if (role === 'worker') {
        workerFields.style.display = 'block';
        employerFields.style.display = 'none';
    } else if (role === 'employer') {
        workerFields.style.display = 'none';
        employerFields.style.display = 'block';
    } else {
        workerFields.style.display = 'none';
        employerFields.style.display = 'none';
    }
});

// Check URL parameters for pre-selected role
const urlParams = new URLSearchParams(window.location.search);
const roleParam = urlParams.get('role');
if (roleParam) {
    document.getElementById('role').value = roleParam;
    document.getElementById('role').dispatchEvent(new Event('change'));
}

// Handle form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Hide previous messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Get form data
    const role = document.getElementById('role').value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!role) {
        showError('Please select a role');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    
    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile
        await user.updateProfile({
            displayName: fullName
        });
        
        // Prepare user data
        const userData = {
            fullName: fullName,
            email: email,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reputationScore: 0,
            completedProjects: 0,
            pendingReviews: 0,
            skillBadges: 0
        };
        
        // Add role-specific data
        if (role === 'worker') {
            userData.skills = document.getElementById('skills').value.split(',').map(s => s.trim()).filter(s => s);
            userData.bio = document.getElementById('bio').value;
            userData.github = document.getElementById('github').value;
            userData.linkedin = document.getElementById('linkedin').value;
        } else if (role === 'employer') {
            userData.company = document.getElementById('company').value;
            userData.companySize = document.getElementById('companySize').value;
            userData.website = document.getElementById('website').value;
        }
        
        // Save to Firestore
        await db.collection('users').doc(user.uid).set(userData);
        
        // Show success message
        successMessage.textContent = 'Account created successfully! Redirecting...';
        successMessage.style.display = 'block';
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showError(getErrorMessage(error.code));
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
});

// Social authentication handlers
document.getElementById('googleSignup').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        // Check if user exists
        const userDoc = await db.collection('users').doc(result.user.uid).get();
        
        if (!userDoc.exists) {
            // New user - redirect to complete profile
            window.location.href = 'signup.html?social=google';
        } else {
            // Existing user - redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Google signup error:', error);
        showError('Google sign-up failed. Please try again.');
    }
});

document.getElementById('githubSignup').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        const userDoc = await db.collection('users').doc(result.user.uid).get();
        
        if (!userDoc.exists) {
            window.location.href = 'signup.html?social=github';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('GitHub signup error:', error);
        showError('GitHub sign-up failed. Please try again.');
    }
});

document.getElementById('linkedinSignup').addEventListener('click', () => {
    showError('LinkedIn authentication coming soon!');
});

// Helper functions
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
        'auth/weak-password': 'Password is too weak. Use at least 8 characters with numbers and symbols.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}
