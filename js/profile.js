// Profile page functionality

let currentUser = null;
let userData = null;

// Load profile data
async function loadProfile() {
    try {
        currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        userData = userDoc.data();
        
        updateProfileUI();
        await loadWorkHistory();
        await loadReviews();
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfileUI() {
    // Update user initials
    const initials = getInitials(userData.fullName || currentUser.email);
    document.getElementById('userInitials').textContent = initials;
    
    // Update profile info
    document.getElementById('profileName').textContent = userData.fullName || 'User';
    document.getElementById('userRole').textContent = userData.role === 'worker' ? 'Worker' : 'Employer';
    document.getElementById('profileEmail').textContent = userData.email;
    document.getElementById('profileBio').textContent = userData.bio || 'No bio added yet.';
    
    // Update profile links
    const linksContainer = document.getElementById('profileLinks');
    linksContainer.innerHTML = '';
    
    if (userData.github) {
        linksContainer.innerHTML += `
            <a href="${userData.github}" target="_blank" class="btn-outline" style="font-size: 14px; padding: 8px 16px;">
                <i class="fab fa-github"></i> GitHub
            </a>
        `;
    }
    
    if (userData.linkedin) {
        linksContainer.innerHTML += `
            <a href="${userData.linkedin}" target="_blank" class="btn-outline" style="font-size: 14px; padding: 8px 16px;">
                <i class="fab fa-linkedin"></i> LinkedIn
            </a>
        `;
    }
    
    if (userData.portfolio) {
        linksContainer.innerHTML += `
            <a href="${userData.portfolio}" target="_blank" class="btn-outline" style="font-size: 14px; padding: 8px 16px;">
                <i class="fas fa-link"></i> Portfolio
            </a>
        `;
    }
    
    // Update skills
    const skillsList = document.getElementById('skillsList');
    if (userData.skills && userData.skills.length > 0) {
        skillsList.innerHTML = userData.skills.map(skill => 
            `<span class="badge badge-primary">${skill}</span>`
        ).join('');
    } else {
        skillsList.innerHTML = '<p style="color: var(--gray);">No skills added yet.</p>';
    }
    
    // Populate edit form
    document.getElementById('editFullName').value = userData.fullName || '';
    document.getElementById('editBio').value = userData.bio || '';
    document.getElementById('editSkills').value = userData.skills?.join(', ') || '';
    document.getElementById('editGithub').value = userData.github || '';
    document.getElementById('editLinkedin').value = userData.linkedin || '';
    document.getElementById('editPortfolio').value = userData.portfolio || '';
}

async function loadWorkHistory() {
    const workHistory = document.getElementById('workHistory');
    
    try {
        const submissions = await db.collection('submissions')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'approved')
            .orderBy('submittedAt', 'desc')
            .get();
        
        if (submissions.empty) {
            workHistory.innerHTML = `
                <p style="color: var(--gray); text-align: center; padding: 40px;">
                    No projects submitted yet. <a href="submit-work.html">Submit your first project!</a>
                </p>
            `;
            return;
        }
        
        let html = '<div style="display: grid; gap: 20px;">';
        
        submissions.forEach(doc => {
            const data = doc.data();
            const date = data.submittedAt?.toDate().toLocaleDateString() || 'Recently';
            
            html += `
                <div style="padding: 24px; background: var(--bg); border-radius: 12px; border-left: 4px solid var(--success);">
                    <h3 style="margin-bottom: 8px;">${data.title}</h3>
                    <p style="color: var(--gray); margin-bottom: 12px;">${data.description}</p>
                    <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                        ${data.technologies?.split(',').map(tech => 
                            `<span class="badge badge-primary">${tech.trim()}</span>`
                        ).join('') || ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--gray);">
                        <span><i class="fas fa-calendar"></i> Completed: ${date}</span>
                        ${data.githubUrl ? `<a href="${data.githubUrl}" target="_blank"><i class="fab fa-github"></i> View Code</a>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        workHistory.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading work history:', error);
    }
}

async function loadReviews() {
    const reviewsList = document.getElementById('reviewsList');
    
    try {
        const reviews = await db.collection('reviews')
            .where('workerId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        if (reviews.empty) {
            reviewsList.innerHTML = `
                <p style="color: var(--gray); text-align: center; padding: 40px;">
                    No reviews yet. Complete tasks to receive feedback!
                </p>
            `;
            return;
        }
        
        let html = '<div style="display: grid; gap: 16px;">';
        
        reviews.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt?.toDate().toLocaleDateString() || 'Recently';
            const stars = '⭐'.repeat(data.rating);
            
            html += `
                <div style="padding: 20px; background: var(--bg); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>${data.clientName || 'Anonymous Client'}</strong>
                        <span style="font-size: 18px;">${stars}</span>
                    </div>
                    <p style="color: var(--gray); margin-bottom: 8px;">${data.comment}</p>
                    <small style="color: var(--gray);">${date}</small>
                </div>
            `;
        });
        
        html += '</div>';
        reviewsList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Handle profile edit form
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const updatedData = {
            fullName: document.getElementById('editFullName').value,
            bio: document.getElementById('editBio').value,
            skills: document.getElementById('editSkills').value.split(',').map(s => s.trim()).filter(s => s),
            github: document.getElementById('editGithub').value,
            linkedin: document.getElementById('editLinkedin').value,
            portfolio: document.getElementById('editPortfolio').value
        };
        
        await db.collection('users').doc(currentUser.uid).update(updatedData);
        
        // Update display name in auth
        await currentUser.updateProfile({
            displayName: updatedData.fullName
        });
        
        // Close modal and reload
        document.getElementById('editModal').style.display = 'none';
        
        // Reload profile
        userData = { ...userData, ...updatedData };
        updateProfileUI();
        
        alert('Profile updated successfully!');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
    }
});

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Initialize profile when auth state is ready
auth.onAuthStateChanged((user) => {
    if (user) {
        loadProfile();
    }
});
