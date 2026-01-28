// Dashboard page functionality

let currentUser = null;
let userData = null;

// Load dashboard data
async function loadDashboard() {
    try {
        currentUser = auth.currentUser;
        if (!currentUser) return;
        
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        userData = userDoc.data();
        
        // Update UI with user data
        updateDashboardUI();
        
        // Load recent activity
        await loadRecentActivity();
        
        // Load featured tasks
        await loadFeaturedTasks();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateDashboardUI() {
    // Update user name
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = userData.fullName || currentUser.displayName || 'User';
    }
    
    // Update stats
    const reputationScore = calculateReputationScore(userData);
    document.getElementById('reputationScore').textContent = reputationScore;
    document.getElementById('completedProjects').textContent = userData.completedProjects || 0;
    document.getElementById('pendingReviews').textContent = userData.pendingReviews || 0;
    document.getElementById('skillBadges').textContent = userData.skillBadges || userData.skills?.length || 0;
}

async function loadRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    
    try {
        // Query recent submissions
        const submissions = await db.collection('submissions')
            .where('userId', '==', currentUser.uid)
            .orderBy('submittedAt', 'desc')
            .limit(5)
            .get();
        
        if (submissions.empty) {
            activityContainer.innerHTML = `
                <p style="color: var(--gray); text-align: center; padding: 40px;">
                    No recent activity. Start by submitting your first project!
                </p>
            `;
            return;
        }
        
        let activityHTML = '<div style="display: grid; gap: 12px;">';
        
        submissions.forEach(doc => {
            const data = doc.data();
            const statusBadge = getStatusBadge(data.status);
            const date = data.submittedAt?.toDate().toLocaleDateString() || 'Recently';
            
            activityHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg); border-radius: 8px;">
                    <div>
                        <h4 style="margin-bottom: 4px;">${data.title}</h4>
                        <p style="color: var(--gray); font-size: 14px;">${date}</p>
                    </div>
                    <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                </div>
            `;
        });
        
        activityHTML += '</div>';
        activityContainer.innerHTML = activityHTML;
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
        activityContainer.innerHTML = `
            <p style="color: var(--danger); text-align: center; padding: 20px;">
                Error loading activity. Please refresh the page.
            </p>
        `;
    }
}

async function loadFeaturedTasks() {
    const tasksContainer = document.getElementById('featuredTasks');
    
    try {
        // Query available tasks
        const tasks = await db.collection('tasks')
            .where('status', '==', 'open')
            .orderBy('postedAt', 'desc')
            .limit(3)
            .get();
        
        if (tasks.empty) {
            tasksContainer.innerHTML = `
                <p style="color: var(--gray); text-align: center; padding: 40px;">
                    No featured tasks available at the moment.
                </p>
            `;
            return;
        }
        
        let tasksHTML = '<div style="display: grid; gap: 16px;">';
        
        tasks.forEach(doc => {
            const data = doc.data();
            
            tasksHTML += `
                <div style="padding: 20px; background: var(--bg); border-radius: 8px; border-left: 4px solid var(--primary);">
                    <h4 style="margin-bottom: 8px;">${data.title}</h4>
                    <p style="color: var(--gray); margin-bottom: 12px; font-size: 14px;">${data.description.substring(0, 120)}...</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--success); font-weight: 700;">$${data.budget}</span>
                        <a href="tasks.html" class="btn-outline" style="font-size: 14px; padding: 6px 16px;">View Details</a>
                    </div>
                </div>
            `;
        });
        
        tasksHTML += '</div>';
        tasksContainer.innerHTML = tasksHTML;
        
    } catch (error) {
        console.error('Error loading featured tasks:', error);
    }
}

function getStatusBadge(status) {
    const badges = {
        'pending': { class: 'badge-warning', text: 'Under Review' },
        'approved': { class: 'badge-success', text: 'Approved' },
        'rejected': { class: 'badge-danger', text: 'Needs Revision' },
        'completed': { class: 'badge-success', text: 'Completed' }
    };
    
    return badges[status] || { class: 'badge-primary', text: status };
}

// Initialize dashboard when auth state is ready
auth.onAuthStateChanged((user) => {
    if (user) {
        loadDashboard();
    }
});
