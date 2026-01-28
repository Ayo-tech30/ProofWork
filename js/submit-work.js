// Submit work page functionality

let currentUser = null;

// Handle form submission
document.getElementById('submitWorkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    
    // Validate checkboxes
    if (!document.getElementById('originalWork').checked || !document.getElementById('accurateInfo').checked) {
        alert('Please confirm both certifications before submitting.');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const submissionData = {
            userId: currentUser.uid,
            projectType: document.getElementById('projectType').value,
            title: document.getElementById('projectTitle').value,
            description: document.getElementById('projectDescription').value,
            technologies: document.getElementById('technologies').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            projectUrl: document.getElementById('projectUrl').value,
            githubUrl: document.getElementById('githubUrl').value,
            documentation: document.getElementById('documentation').value,
            clientEmail: document.getElementById('clientEmail').value,
            achievements: document.getElementById('achievements').value,
            challenges: document.getElementById('challenges').value,
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle file uploads if any
        const files = document.getElementById('projectFiles').files;
        if (files.length > 0) {
            submissionData.fileCount = files.length;
            // In production, upload files to Firebase Storage
            // For now, just store file names
            submissionData.fileNames = Array.from(files).map(f => f.name);
        }
        
        // Save to Firestore
        const docRef = await db.collection('submissions').add(submissionData);
        
        // Update user stats
        await db.collection('users').doc(currentUser.uid).update({
            pendingReviews: firebase.firestore.FieldValue.increment(1)
        });
        
        // Show success message
        successMessage.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Reset form
        document.getElementById('submitWorkForm').reset();
        
        // Re-enable button after delay
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Review';
        }, 3000);
        
        // Reload previous submissions
        loadPreviousSubmissions();
        
    } catch (error) {
        console.error('Error submitting work:', error);
        alert('Failed to submit work. Please try again.');
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Review';
    }
});

// Load previous submissions
async function loadPreviousSubmissions() {
    try {
        const submissions = await db.collection('submissions')
            .where('userId', '==', currentUser.uid)
            .orderBy('submittedAt', 'desc')
            .limit(5)
            .get();
        
        const container = document.getElementById('previousSubmissions');
        const noSubmissionsMsg = document.getElementById('noSubmissions');
        
        if (submissions.empty) {
            noSubmissionsMsg.style.display = 'block';
            return;
        }
        
        noSubmissionsMsg.style.display = 'none';
        
        let html = '<div style="display: grid; gap: 16px;">';
        
        submissions.forEach(doc => {
            const data = doc.data();
            const statusBadge = getStatusBadge(data.status);
            const date = data.submittedAt?.toDate().toLocaleDateString() || 'Recently';
            
            html += `
                <div style="padding: 20px; background: var(--bg); border-radius: 8px; border-left: 4px solid ${statusBadge.color};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <h3 style="margin-bottom: 4px;">${data.title}</h3>
                            <p style="color: var(--gray); font-size: 14px;">Submitted ${date}</p>
                        </div>
                        <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                        ${data.technologies.split(',').slice(0, 3).map(tech => 
                            `<span class="badge badge-primary">${tech.trim()}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.querySelector('div').innerHTML = html;
        
    } catch (error) {
        console.error('Error loading previous submissions:', error);
    }
}

function getStatusBadge(status) {
    const badges = {
        'pending': { 
            class: 'badge-warning', 
            text: 'Under Review',
            color: 'var(--warning)'
        },
        'approved': { 
            class: 'badge-success', 
            text: 'Approved',
            color: 'var(--success)'
        },
        'rejected': { 
            class: 'badge-danger', 
            text: 'Needs Revision',
            color: 'var(--danger)'
        }
    };
    
    return badges[status] || badges['pending'];
}

// Set max date to today
document.getElementById('endDate').max = new Date().toISOString().split('T')[0];
document.getElementById('startDate').max = new Date().toISOString().split('T')[0];

// Initialize when auth state is ready
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadPreviousSubmissions();
    }
});
