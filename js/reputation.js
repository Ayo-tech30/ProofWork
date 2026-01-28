// Reputation page functionality

let currentUser = null;
let userData = null;

// Load reputation data
async function loadReputation() {
    try {
        currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        userData = userDoc.data();
        
        updateReputationUI();
        await loadReputationHistory();
        
    } catch (error) {
        console.error('Error loading reputation:', error);
    }
}

function updateReputationUI() {
    // Calculate total reputation
    const projectPoints = (userData.completedProjects || 0) * 20;
    const reviewPoints = (userData.reviewScore || 0) * 10;
    const complexityPoints = userData.complexityBonus || 0;
    const diversityPoints = userData.skillDiversity || (userData.skills?.length || 0) * 5;
    
    const totalReputation = projectPoints + reviewPoints + complexityPoints + diversityPoints;
    
    // Update main score
    document.getElementById('reputationScore').textContent = totalReputation;
    
    // Update breakdown
    document.getElementById('projectPoints').textContent = projectPoints;
    document.getElementById('reviewPoints').textContent = reviewPoints;
    document.getElementById('complexityPoints').textContent = complexityPoints;
    document.getElementById('diversityPoints').textContent = diversityPoints;
    
    // Get level info
    const level = getReputationLevel(totalReputation);
    document.getElementById('reputationLevel').textContent = level.name;
    
    // Calculate progress to next level
    const levelThresholds = [0, 100, 500, 1000, 2500, 5000];
    let currentLevelIndex = 0;
    
    for (let i = 0; i < levelThresholds.length; i++) {
        if (totalReputation >= levelThresholds[i]) {
            currentLevelIndex = i;
        }
    }
    
    if (currentLevelIndex < levelThresholds.length - 1) {
        const currentThreshold = levelThresholds[currentLevelIndex];
        const nextThreshold = levelThresholds[currentLevelIndex + 1];
        const pointsInLevel = totalReputation - currentThreshold;
        const pointsNeeded = nextThreshold - currentThreshold;
        const progress = (pointsInLevel / pointsNeeded) * 100;
        const pointsToNext = nextThreshold - totalReputation;
        
        document.getElementById('reputationProgress').style.width = `${progress}%`;
        document.getElementById('pointsToNext').textContent = pointsToNext;
        document.getElementById('nextLevelText').style.display = 'block';
    } else {
        // Max level reached
        document.getElementById('reputationProgress').style.width = '100%';
        document.getElementById('nextLevelText').textContent = 'Maximum level achieved! 🎉';
    }
}

function getReputationLevel(score) {
    if (score >= 5000) return { name: 'Legend', icon: '🔥', color: '#8b5cf6' };
    if (score >= 2500) return { name: 'Master', icon: '👑', color: '#f59e0b' };
    if (score >= 1000) return { name: 'Expert', icon: '🎯', color: '#10b981' };
    if (score >= 500) return { name: 'Professional', icon: '💼', color: '#6366f1' };
    if (score >= 100) return { name: 'Apprentice', icon: '⚡', color: '#3b82f6' };
    return { name: 'Newcomer', icon: '🌱', color: '#64748b' };
}

async function loadReputationHistory() {
    const historyContainer = document.getElementById('reputationHistory');
    
    try {
        // Load submissions
        const submissions = await db.collection('submissions')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'approved')
            .orderBy('submittedAt', 'desc')
            .limit(10)
            .get();
        
        // Load reviews
        const reviews = await db.collection('reviews')
            .where('workerId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        // Combine and sort by date
        let history = [];
        
        submissions.forEach(doc => {
            const data = doc.data();
            history.push({
                type: 'project',
                title: data.title,
                date: data.submittedAt?.toDate(),
                points: calculateProjectPoints(data)
            });
        });
        
        reviews.forEach(doc => {
            const data = doc.data();
            history.push({
                type: 'review',
                title: `Review from ${data.clientName || 'Client'}`,
                date: data.createdAt?.toDate(),
                points: data.rating * 10,
                rating: data.rating
            });
        });
        
        // Sort by date
        history.sort((a, b) => b.date - a.date);
        
        if (history.length === 0) {
            historyContainer.innerHTML = `
                <p style="color: var(--gray); text-align: center; padding: 40px;">
                    No activity yet. Complete your first project to start building reputation!
                </p>
            `;
            return;
        }
        
        let html = '<div style="display: grid; gap: 12px;">';
        
        history.forEach(item => {
            const icon = item.type === 'project' ? 'fa-check-circle' : 'fa-star';
            const color = item.type === 'project' ? 'var(--success)' : 'var(--warning)';
            const dateStr = item.date?.toLocaleDateString() || 'Recently';
            
            html += `
                <div style="display: flex; gap: 16px; padding: 16px; background: var(--bg); border-radius: 8px; align-items: center;">
                    <div style="width: 48px; height: 48px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                        <i class="fas ${icon}" style="font-size: 20px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 4px;">${item.title}</h4>
                        <p style="color: var(--gray); font-size: 14px;">${dateStr}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 24px; font-weight: 700; color: ${color};">+${item.points}</div>
                        <p style="color: var(--gray); font-size: 12px;">points</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        historyContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading reputation history:', error);
    }
}

function calculateProjectPoints(project) {
    // Base points for completion
    let points = 20;
    
    // Bonus for complexity (number of technologies)
    const techCount = project.technologies?.split(',').length || 0;
    points += Math.min(techCount * 5, 30);
    
    // Bonus for having client verification
    if (project.clientEmail) {
        points += 10;
    }
    
    return points;
}

// Initialize when auth state is ready
auth.onAuthStateChanged((user) => {
    if (user) {
        loadReputation();
    }
});
