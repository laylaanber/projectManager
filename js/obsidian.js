// ==============================================
// OBSIDIAN-STYLE PROJECT MANAGER
// ==============================================

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const navItems = document.querySelectorAll('.nav-item');
const contentViews = document.querySelectorAll('.content-view');
const viewButtons = document.querySelectorAll('.view-btn');
const newProjectBtn = document.getElementById('new-project-btn');
const projectModal = document.getElementById('project-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelProjectBtn = document.getElementById('cancel-project');
const projectForm = document.getElementById('project-form');
const currentDateElement = document.getElementById('current-date');
const userInfoElement = document.getElementById('user-info');
const recentProjectsNavElement = document.getElementById('recent-projects-nav');
const projectProgressElement = document.getElementById('project-progress');
const upcomingDeadlinesElement = document.getElementById('upcoming-deadlines');
const recentActivityElement = document.getElementById('recent-activity');
const projectsTimelineElement = document.getElementById('projects-timeline');
const globalSearchInput = document.getElementById('global-search');

// Application State
let currentUser = null;
let projects = [];
let teamMembers = [];
let editingProjectId = null;
let currentView = 'card';

// ==============================================
// INITIALIZATION
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get current user
    currentUser = getCurrentUser();
    
    // Set current date
    updateCurrentDate();
    
    // Load data
    loadProjects();
    loadTeamMembers();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI with user info
    updateUserUI();
    
    // Initialize dashboard
    updateDashboard();
});

// ==============================================
// EVENT LISTENERS
// ==============================================
function setupEventListeners() {
    // Toggle sidebar
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Navigation items
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Set active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content view
            const view = this.getAttribute('data-view');
            contentViews.forEach(content => content.classList.remove('active'));
            document.getElementById(`${view}-view`).classList.add('active');
            
            // On mobile, close sidebar after navigation
            if (window.innerWidth < 768) {
                sidebar.classList.remove('open');
            }
        });
    });
    
    // View control buttons
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.getAttribute('data-view');
            
            // Update view based on selection
            updateViewMode();
        });
    });
    
    // New project button
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openProjectModal();
        });
    }
    
    // Close modal buttons
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProjectModal);
    }
    
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', closeProjectModal);
    }
    
    // Project form submission
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProject();
        });
    }
    
    // Search functionality
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (document.getElementById('projects-view').classList.contains('active')) {
                filterProjects(searchTerm);
            }
            
            // Highlight search terms in the dashboard
            highlightSearchTerms(searchTerm);
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === projectModal) {
            closeProjectModal();
        }
    });
}

// ==============================================
// DASHBOARD FUNCTIONS
// ==============================================
function updateCurrentDate() {
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function updateDashboard() {
    updateProjectProgress();
    updateUpcomingDeadlines();
    updateRecentActivity();
    updateProjectsTimeline();
    updateRecentProjectsNav();
}

function updateProjectProgress() {
    if (!projectProgressElement) return;
    
    // Remove placeholders
    projectProgressElement.innerHTML = '';
    
    // If no projects, show message
    if (!projects.length) {
        projectProgressElement.innerHTML = '<p class="empty-state">No projects available.</p>';
        return;
    }
    
    // Sort projects by progress (lowest to highest)
    const projectsToShow = [...projects]
        .sort((a, b) => calculateProgress(a) - calculateProgress(b))
        .slice(0, 5); // Show only top 5
    
    projectsToShow.forEach(project => {
        const progressPercentage = calculateProgress(project);
        
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        
        const progressHeader = document.createElement('div');
        progressHeader.className = 'progress-item-header';
        
        const progressTitle = document.createElement('div');
        progressTitle.className = 'progress-title';
        progressTitle.textContent = project.name;
        
        const progressPercentageEl = document.createElement('div');
        progressPercentageEl.className = 'progress-percentage';
        progressPercentageEl.textContent = `${progressPercentage}%`;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.width = `${progressPercentage}%`;
        if (progressPercentage === 100) {
            progressFill.style.backgroundColor = 'var(--status-completed)';
        }
        
        progressHeader.appendChild(progressTitle);
        progressHeader.appendChild(progressPercentageEl);
        progressBar.appendChild(progressFill);
        progressItem.appendChild(progressHeader);
        progressItem.appendChild(progressBar);
        
        // Add click handler
        progressItem.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        projectProgressElement.appendChild(progressItem);
    });
}

function updateUpcomingDeadlines() {
    if (!upcomingDeadlinesElement) return;
    
    // Remove placeholders
    upcomingDeadlinesElement.innerHTML = '';
    
    // Filter projects that are not completed or cancelled
    const activeProjects = projects.filter(p => 
        p.status !== 'completed' && p.status !== 'cancelled'
    );
    
    // If no active projects, show message
    if (!activeProjects.length) {
        upcomingDeadlinesElement.innerHTML = '<p class="empty-state">No upcoming deadlines.</p>';
        return;
    }
    
    // Sort by deadline (closest first)
    const sortedByDeadline = [...activeProjects]
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5); // Show only top 5
    
    sortedByDeadline.forEach(project => {
        const deadline = new Date(project.deadline);
        const today = new Date();
        const isOverdue = deadline < today;
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        
        const deadlineItem = document.createElement('div');
        deadlineItem.className = 'deadline-item';
        
        const deadlineInfo = document.createElement('div');
        deadlineInfo.className = 'deadline-info';
        
        const projectName = document.createElement('div');
        projectName.className = 'deadline-project';
        projectName.textContent = project.name;
        
        const deadlineDate = document.createElement('div');
        deadlineDate.className = 'deadline-date';
        
        if (isOverdue) {
            deadlineDate.textContent = `Overdue by ${Math.abs(daysLeft)} days`;
            deadlineDate.style.color = 'var(--status-cancelled)';
        } else {
            deadlineDate.textContent = `${daysLeft} days left (${formatDate(deadline)})`;
            if (daysLeft <= 3) {
                deadlineDate.style.color = 'var(--status-hold)';
            }
        }
        
        const statusBadge = document.createElement('div');
        statusBadge.className = `deadline-status status-${getStatusClass(project.status)}`;
        statusBadge.textContent = project.status;
        
        deadlineInfo.appendChild(projectName);
        deadlineInfo.appendChild(deadlineDate);
        deadlineItem.appendChild(deadlineInfo);
        deadlineItem.appendChild(statusBadge);
        
        // Add click handler
        deadlineItem.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        upcomingDeadlinesElement.appendChild(deadlineItem);
    });
}

function updateRecentActivity() {
    if (!recentActivityElement) return;
    
    // Remove placeholders
    recentActivityElement.innerHTML = '';
    
    // If no projects, show message
    if (!projects.length) {
        recentActivityElement.innerHTML = '<p class="empty-state">No recent activity.</p>';
        return;
    }
    
    // Sort projects by last updated date
    const recentlyUpdated = [...projects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5); // Show only top 5
    
    recentlyUpdated.forEach(project => {
        const activity = {
            projectName: project.name,
            action: project.updatedAt ? 'updated' : 'created',
            time: formatDateRelative(new Date(project.updatedAt || project.createdAt)),
            description: `Status: ${project.status}`
        };
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const activityHeader = document.createElement('div');
        activityHeader.className = 'activity-header';
        
        const activityTitle = document.createElement('div');
        activityTitle.className = 'activity-title';
        activityTitle.textContent = `${project.name} ${activity.action}`;
        
        const activityTime = document.createElement('div');
        activityTime.className = 'activity-time';
        activityTime.textContent = activity.time;
        
        const activityDescription = document.createElement('div');
        activityDescription.className = 'activity-description';
        activityDescription.textContent = activity.description;
        
        activityHeader.appendChild(activityTitle);
        activityHeader.appendChild(activityTime);
        activityItem.appendChild(activityHeader);
        activityItem.appendChild(activityDescription);
        
        // Add click handler
        activityItem.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        recentActivityElement.appendChild(activityItem);
    });
}

function updateProjectsTimeline() {
    if (!projectsTimelineElement) return;
    
    // Remove placeholders
    projectsTimelineElement.innerHTML = '';
    
    // If no projects, show message
    if (!projects.length) {
        projectsTimelineElement.innerHTML = '<p class="empty-state">No projects to display.</p>';
        return;
    }
    
    // Find the earliest start date and latest deadline
    let earliestDate = new Date();
    let latestDate = new Date();
    
    projects.forEach(project => {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.deadline);
        
        if (startDate < earliestDate) earliestDate = startDate;
        if (endDate > latestDate) latestDate = endDate;
    });
    
    // Ensure we have at least 3 months of timeline
    const minEndDate = new Date(earliestDate);
    minEndDate.setMonth(minEndDate.getMonth() + 3);
    if (latestDate < minEndDate) latestDate = minEndDate;
    
    // Add some padding
    earliestDate.setDate(1); // Start at the beginning of the month
    latestDate.setMonth(latestDate.getMonth() + 1, 0); // End at the end of the month
    
    // Create timeline container
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    
    // Create months for the header
    const months = [];
    const startMonth = new Date(earliestDate);
    const endMonth = new Date(latestDate);
    
    // Create month headers
    const timelineHeader = document.createElement('div');
    timelineHeader.className = 'timeline-header';
    
    // Add empty cell for project names
    const emptyCell = document.createElement('div');
    emptyCell.className = 'timeline-row-label';
    timelineHeader.appendChild(emptyCell);
    
    // Get all months between start and end
    while (startMonth <= endMonth) {
        const month = startMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
        months.push(new Date(startMonth));
        
        const monthCell = document.createElement('div');
        monthCell.className = 'timeline-header-cell';
        monthCell.textContent = month;
        timelineHeader.appendChild(monthCell);
        
        startMonth.setMonth(startMonth.getMonth() + 1);
    }
    
    timeline.appendChild(timelineHeader);
    
    // Calculate total days in timeline
    const totalDays = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24));
    
    // Create project rows
    projects.forEach(project => {
        const projectStartDate = new Date(project.startDate);
        const projectEndDate = new Date(project.deadline);
        
        const timelineRow = document.createElement('div');
        timelineRow.className = 'timeline-row';
        
        const rowLabel = document.createElement('div');
        rowLabel.className = 'timeline-row-label';
        rowLabel.textContent = project.name;
        rowLabel.title = project.name;
        
        const rowTrack = document.createElement('div');
        rowTrack.className = 'timeline-row-track';
        
        // Calculate position and width
        const startDayOffset = Math.ceil((projectStartDate - earliestDate) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((projectEndDate - projectStartDate) / (1000 * 60 * 60 * 24)) + 1;
        
        const leftPosition = (startDayOffset / totalDays) * 100;
        const width = (duration / totalDays) * 100;
        
        // Create the timeline bar
        const bar = document.createElement('div');
        bar.className = `timeline-bar timeline-bar-${getStatusClass(project.status)}`;
        bar.style.left = `${leftPosition}%`;
        bar.style.width = `${width}%`;
        bar.title = `${project.name}\nStart: ${formatDate(projectStartDate)}\nEnd: ${formatDate(projectEndDate)}\nStatus: ${project.status}`;
        
        // Add click handler
        bar.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        rowTrack.appendChild(bar);
        timelineRow.appendChild(rowLabel);
        timelineRow.appendChild(rowTrack);
        timeline.appendChild(timelineRow);
    });
    
    projectsTimelineElement.appendChild(timeline);
}

function updateRecentProjectsNav() {
    if (!recentProjectsNavElement) return;
    
    // Remove placeholders
    recentProjectsNavElement.innerHTML = '';
    
    // If no projects, show message
    if (!projects.length) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'nav-placeholder-message';
        emptyMessage.textContent = 'No projects yet';
        recentProjectsNavElement.appendChild(emptyMessage);
        return;
    }
    
    // Sort projects by created date (most recent first)
    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Show only top 5
    
    recentProjects.forEach(project => {
        const projectLink = document.createElement('a');
        projectLink.href = `project-details.html?id=${project.id}`;
        projectLink.className = 'nav-item';
        
        // Status icon
        const statusIcon = document.createElement('i');
        
        switch(project.status.toLowerCase()) {
            case 'not started':
                statusIcon.className = 'fas fa-circle-dot';
                break;
            case 'in progress':
                statusIcon.className = 'fas fa-circle-play';
                break;
            case 'on hold':
                statusIcon.className = 'fas fa-circle-pause';
                break;
            case 'completed':
                statusIcon.className = 'fas fa-circle-check';
                break;
            case 'cancelled':
                statusIcon.className = 'fas fa-circle-xmark';
                break;
            default:
                statusIcon.className = 'fas fa-circle';
        }
        
        // Set icon color based on status
        statusIcon.style.color = `var(--status-${getStatusClass(project.status)})`;
        
        // Project name
        const projectName = document.createTextNode(project.name);
        
        projectLink.appendChild(statusIcon);
        projectLink.appendChild(projectName);
        
        recentProjectsNavElement.appendChild(projectLink);
    });
}

// ==============================================
// PROJECT FUNCTIONS
// ==============================================
function loadProjects() {
    const projectsKey = `orangeAcademyProjects_${currentUser.userId}`;
    projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
}

function loadTeamMembers() {
    const teamKey = `orangeAcademyTeam_${currentUser.userId}`;
    teamMembers = JSON.parse(localStorage.getItem(teamKey)) || [];
    
    populateTeamSelection();
}

function saveProjects() {
    const projectsKey = `orangeAcademyProjects_${currentUser.userId}`;
    localStorage.setItem(projectsKey, JSON.stringify(projects));
}

function calculateProgress(project) {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
}

function populateTeamSelection() {
    const teamSelectionEl = document.getElementById('team-selection');
    if (!teamSelectionEl) return;
    
    teamSelectionEl.innerHTML = '';
    
    if (teamMembers.length === 0) {
        teamSelectionEl.innerHTML = '<p>No team members available</p>';
        return;
    }
    
    teamMembers.forEach(member => {
        const option = document.createElement('div');
        option.className = 'team-member-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `team-member-${member.id}`;
        checkbox.value = member.id;
        
        const label = document.createElement('label');
        label.htmlFor = `team-member-${member.id}`;
        label.textContent = member.name;
        
        option.appendChild(checkbox);
        option.appendChild(label);
        teamSelectionEl.appendChild(option);
    });
}

function openProjectModal(projectId = null) {
    // Reset form
    projectForm.reset();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('project-start-date').value = today;
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('project-deadline').value = nextWeek.toISOString().split('T')[0];
    
    // Check if editing
    if (projectId) {
        editingProjectId = projectId;
        document.getElementById('modal-title').textContent = 'Edit Project';
        
        // Find project
        const project = projects.find(p => p.id === projectId);
        if (project) {
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-description').value = project.description;
            document.getElementById('project-start-date').value = project.startDate;
            document.getElementById('project-deadline').value = project.deadline;
            document.getElementById('project-status').value = project.status;
            
            // Select team members
            if (project.team) {
                const checkboxes = document.querySelectorAll('#team-selection input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = project.team.includes(cb.value);
                });
            }
        }
    } else {
        editingProjectId = null;
        document.getElementById('modal-title').textContent = 'New Project';
    }
    
    // Show modal
    projectModal.style.display = 'block';
}

function closeProjectModal() {
    projectModal.style.display = 'none';
    editingProjectId = null;
}

function saveProject() {
    // Get form data
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const startDate = document.getElementById('project-start-date').value;
    const deadline = document.getElementById('project-deadline').value;
    const status = document.getElementById('project-status').value;
    
    // Validate
    if (!name || !startDate || !deadline) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Get selected team members
    const teamCheckboxes = document.querySelectorAll('#team-selection input:checked');
    const team = Array.from(teamCheckboxes).map(cb => cb.value);
    
    if (editingProjectId) {
        // Update existing project
        const projectIndex = projects.findIndex(p => p.id === editingProjectId);
        if (projectIndex !== -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                name,
                description,
                startDate,
                deadline,
                status,
                team,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create new project
        const newProject = {
            id: Date.now().toString(),
            name,
            description,
            startDate,
            deadline,
            status,
            team,
            tasks: [],
            createdAt: new Date().toISOString()
        };
        
        projects.push(newProject);
    }
    
    // Save projects
    saveProjects();
    
    // Close modal and update UI
    closeProjectModal();
    updateDashboard();
}

// ==============================================
// VIEW MANAGEMENT
// ==============================================
function updateViewMode() {
    // This would handle different view modes (card, list, timeline)
    // We'll implement if needed for projects view
    console.log(`View mode changed to: ${currentView}`);
}

function filterProjects(searchTerm = '') {
    // Will be used for filtering projects in the projects view
    // Implementation depends on how the projects view is structured
}

function highlightSearchTerms(searchTerm) {
    // This would highlight search terms in the current view
    // Implementation depends on the view structure
    if (!searchTerm) return;
}

// ==============================================
// USER AUTHENTICATION FUNCTIONS
// ==============================================
function isLoggedIn() {
    const session = JSON.parse(localStorage.getItem('orangeAcademySession')) || {};
    return !!session.loggedIn;
}

function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem('orangeAcademySession')) || {};
    return {
        userId: session.userId || 'guest',
        fullname: session.fullname || 'Guest User',
        email: session.email || 'guest@example.com'
    };
}

/**
 * Updates the user interface with the current user's information and sets up the dropdown menu
 */
function updateUserUI() {
    if (!userInfoElement || !currentUser) return;
    
    // Create initials from user's name
    const nameParts = currentUser.fullname.split(' ');
    const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
        : nameParts[0].substring(0, 2).toUpperCase();
    
    // Update user info in sidebar
    userInfoElement.innerHTML = `
        <div class="user-avatar">${initials}</div>
        <div class="user-details">
            <div class="user-name">${currentUser.fullname}</div>
            <div class="user-email">${currentUser.email}</div>
        </div>
        <div class="user-dropdown">
            <i class="fas fa-chevron-down"></i>
        </div>
    `;
    
    // Remove any existing dropdown menu
    const existingMenu = document.getElementById('user-dropdown-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Find the user profile container
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;
    
    // Create dropdown menu
    const userMenu = document.createElement('div');
    userMenu.id = 'user-dropdown-menu';
    userMenu.className = 'user-menu';
    
    // Set menu content
    userMenu.innerHTML = `
        <a href="#" class="user-menu-item" id="profile-btn">
            <i class="fas fa-user-circle"></i> Profile
        </a>
        <a href="#" class="user-menu-item" id="settings-btn">
            <i class="fas fa-cog"></i> Settings
        </a>
        <div class="user-menu-divider"></div>
        <a href="#" class="user-menu-item" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
        </a>
    `;
    
    // Append menu to the user profile div
    userProfile.appendChild(userMenu);
    
    // Set up click handler for logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Set up toggle functionality for user info
    userInfoElement.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isVisible = userMenu.style.display === 'block';
        userMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (userMenu.style.display === 'block' &&
            !userInfoElement.contains(e.target) && 
            !userMenu.contains(e.target)) {
            userMenu.style.display = 'none';
        }
    });
}

/**
 * Log out the current user with a confirmation dialog
 */
function logout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to log out?')) {
        // Clear session data
        localStorage.removeItem('orangeAcademySession');
        
        // Add a fade-out effect to the whole page
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s';
        
        // Redirect after animation
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'not started':
            return 'not-started';
        case 'in progress':
            return 'progress';
        case 'on hold':
            return 'hold';
        case 'completed':
            return 'completed';
        case 'cancelled':
            return 'cancelled';
        default:
            return 'not-started';
    }
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDateRelative(date) {
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return formatDate(date);
    }
}