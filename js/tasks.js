// Tasks page functionality

let currentUser = null;
let allTasks = [];

// Load tasks
async function loadTasks() {
    try {
        currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const tasksSnapshot = await db.collection('tasks')
            .where('status', '==', 'open')
            .orderBy('postedAt', 'desc')
            .get();
        
        allTasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayTasks(allTasks);
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        
        // If no tasks in database, show sample tasks (already in HTML)
        console.log('Using sample tasks from HTML');
    }
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="card">
                <p style="color: var(--gray); text-align: center; padding: 40px;">
                    No tasks match your filters. Try adjusting your search criteria.
                </p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    tasks.forEach(task => {
        const skills = task.skills || [];
        const postedDate = task.postedAt?.toDate() ? getRelativeTime(task.postedAt.toDate()) : 'Recently';
        
        html += `
            <div class="card" style="border-left: 4px solid var(--primary); cursor: pointer; transition: all 0.3s;" onclick="showTaskDetails('${task.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin-bottom: 8px; font-size: 20px;">${task.title}</h3>
                        <p style="color: var(--gray); margin-bottom: 12px;">${task.description}</p>
                    </div>
                    <span class="badge badge-success" style="font-size: 18px; padding: 8px 16px;">$${task.budget}</span>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                    ${skills.map(skill => `<span class="badge badge-primary">${skill}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--gray); flex-wrap: wrap; gap: 12px;">
                    <span><i class="fas fa-clock"></i> ${task.duration || 'Flexible'}</span>
                    <span><i class="fas fa-star"></i> Min. Reputation: ${task.minReputation || 0}</span>
                    <span><i class="fas fa-user-tie"></i> ${task.employer || 'Posted by employer'}</span>
                    <span><i class="fas fa-calendar"></i> ${postedDate}</span>
                </div>
            </div>
        `;
    });
    
    tasksList.innerHTML = html;
}

// Apply filters
document.getElementById('applyFilters')?.addEventListener('click', () => {
    const skill = document.getElementById('filterSkill').value;
    const budget = document.getElementById('filterBudget').value;
    const duration = document.getElementById('filterDuration').value;
    const minRep = parseInt(document.getElementById('filterExperience').value) || 0;
    
    let filtered = allTasks;
    
    // Filter by skill
    if (skill) {
        filtered = filtered.filter(task => 
            task.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        );
    }
    
    // Filter by budget
    if (budget) {
        const [min, max] = budget.split('-').map(b => parseInt(b.replace('+', '')) || Infinity);
        filtered = filtered.filter(task => {
            const taskBudget = task.budget || 0;
            return taskBudget >= min && (max === Infinity || taskBudget <= max);
        });
    }
    
    // Filter by duration
    if (duration) {
        filtered = filtered.filter(task => 
            task.durationType === duration
        );
    }
    
    // Filter by minimum reputation
    if (minRep > 0) {
        filtered = filtered.filter(task => 
            (task.minReputation || 0) <= minRep
        );
    }
    
    displayTasks(filtered);
});

// Show task details in modal
window.showTaskDetails = async function(taskId) {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    // Find task
    let task;
    if (typeof taskId === 'number') {
        // Sample task from HTML
        const sampleTasks = [
            {
                title: 'Build React Dashboard for Analytics',
                description: 'Looking for experienced React developer to create responsive analytics dashboard with charts and data visualization. The project requires expertise in React, modern JavaScript, and data visualization libraries like Chart.js or Recharts.',
                budget: 1500,
                duration: '2-3 weeks',
                minReputation: 500,
                employer: 'TechCorp Inc.',
                skills: ['React', 'JavaScript', 'Chart.js'],
                requirements: [
                    'Minimum 2 years React experience',
                    'Portfolio showing dashboard projects',
                    'Knowledge of REST APIs',
                    'Responsive design expertise'
                ],
                deliverables: [
                    'Fully functional React dashboard',
                    'Source code with documentation',
                    'Unit tests',
                    'Deployment guide'
                ]
            }
        ];
        task = sampleTasks[taskId - 1] || sampleTasks[0];
    } else {
        task = allTasks.find(t => t.id === taskId);
    }
    
    if (!task) return;
    
    modalTitle.textContent = task.title;
    
    modalContent.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px;">Description</h3>
            <p style="color: var(--gray); line-height: 1.8;">${task.description}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
            <div>
                <h4 style="margin-bottom: 8px; color: var(--gray);">Budget</h4>
                <p style="font-size: 24px; font-weight: 700; color: var(--success);">$${task.budget}</p>
            </div>
            <div>
                <h4 style="margin-bottom: 8px; color: var(--gray);">Duration</h4>
                <p style="font-size: 18px; font-weight: 600;">${task.duration}</p>
            </div>
        </div>
        
        <div style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px;">Required Skills</h3>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${task.skills?.map(skill => `<span class="badge badge-primary">${skill}</span>`).join('') || 'N/A'}
            </div>
        </div>
        
        ${task.requirements ? `
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 12px;">Requirements</h3>
                <ul style="color: var(--gray); line-height: 1.8; margin-left: 20px;">
                    ${task.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${task.deliverables ? `
            <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 12px;">Deliverables</h3>
                <ul style="color: var(--gray); line-height: 1.8; margin-left: 20px;">
                    ${task.deliverables.map(del => `<li>${del}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
        
        <div style="padding: 16px; background: var(--bg); border-radius: 8px; border-left: 4px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="color: var(--gray); margin-bottom: 4px;">Posted by</p>
                    <h4>${task.employer || 'Employer'}</h4>
                </div>
                <div style="text-align: right;">
                    <p style="color: var(--gray); margin-bottom: 4px;">Min. Reputation Required</p>
                    <h4 style="color: var(--primary);">${task.minReputation || 0}</h4>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

// Initialize tasks when auth state is ready
auth.onAuthStateChanged((user) => {
    if (user) {
        loadTasks();
    }
});
