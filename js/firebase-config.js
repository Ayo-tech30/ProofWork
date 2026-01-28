// Firebase Configuration
// Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBS1SqJ6eL4Ftca0BFi24NjwGAQuV3cc6k",
  authDomain: "proofwork-d656d.firebaseapp.com",
  projectId: "proofwork-d656d",
  storageBucket: "proofwork-d656d.firebasestorage.app",
  messagingSenderId: "674495700504",
  appId: "1:674495700504:web:66acd0c8f3d9232b76ad6d",
  measurementId: "G-9KYD0G9SK6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User signed in:', user.uid);
        
        // Update user display in UI
        const userNameElements = document.querySelectorAll('#userName');
        userNameElements.forEach(el => {
            el.textContent = user.displayName || user.email.split('@')[0];
        });
    } else {
        console.log('No user signed in');
        
        // Redirect to login if on protected page
        const protectedPages = ['dashboard', 'profile', 'tasks', 'submit-work', 'reputation'];
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
});

// Helper function to get current user data
async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        return userDoc.exists ? { uid: user.uid, ...userDoc.data() } : null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Helper function to calculate reputation score
function calculateReputationScore(userData) {
    const projects = userData.completedProjects || 0;
    const reviews = userData.reviewScore || 0;
    const complexity = userData.complexityBonus || 0;
    const diversity = userData.skillDiversity || 0;
    
    return (projects * 20) + (reviews * 10) + complexity + diversity;
}

// Helper function to get reputation level
function getReputationLevel(score) {
    if (score >= 5000) return { name: 'Legend', icon: '🔥', color: '#8b5cf6' };
    if (score >= 2500) return { name: 'Master', icon: '👑', color: '#f59e0b' };
    if (score >= 1000) return { name: 'Expert', icon: '🎯', color: '#10b981' };
    if (score >= 500) return { name: 'Professional', icon: '💼', color: '#6366f1' };
    if (score >= 100) return { name: 'Apprentice', icon: '⚡', color: '#3b82f6' };
    return { name: 'Newcomer', icon: '🌱', color: '#64748b' };
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        window.location.href = '../index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Attach logout to buttons
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});
