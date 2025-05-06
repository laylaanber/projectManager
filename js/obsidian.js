/**
 * OBSIDIAN-STYLE PROJECT MANAGER
 * Main JavaScript file for dashboard functionality
 */

// DOM Element references for the UI components
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

// Application state variables
let currentUser = null;
let projects = [];
let teamMembers = [];
let editingProjectId = null;
let currentView = 'card';

/**
 * INITIALIZATION
 * Sets up the application when the page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    // Redirect to login if not authenticated
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize application data and UI
    currentUser = getCurrentUser();
    updateCurrentDate();
    loadProjects();
    loadTeamMembers();
    setupEventListeners();
    updateUserUI();
    updateDashboard();

    // Create a close button for mobile sidebar
    const closeSidebarBtn = document.createElement('button');
    closeSidebarBtn.className = 'close-sidebar';
    closeSidebarBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeSidebarBtn.setAttribute('aria-label', 'Close Sidebar');
    
    // Add to sidebar header
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        sidebarHeader.appendChild(closeSidebarBtn);
        
        // Event listener for close button
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
    
    // Also close sidebar when clicking on navigation items in mobile view
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Check if we're in mobile view (sidebar has position: fixed)
            const isMobile = window.getComputedStyle(sidebar).position === 'fixed';
            if (isMobile) {
                sidebar.classList.remove('open');
            }
        });
    });
    
    // Close sidebar when clicking outside in mobile view
    document.addEventListener('click', (e) => {
        const isMobile = window.getComputedStyle(sidebar).position === 'fixed';
        if (isMobile && 
            sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            e.target !== toggleSidebarBtn) {
            sidebar.classList.remove('open');
        }
    });
});

/**
 * EVENT LISTENERS
 * Sets up all interactive elements on the page
 */
function setupEventListeners() {
    // Sidebar toggle functionality
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }
    
    // Navigation item click handling
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Allow regular navigation for links to other pages
            if (this.getAttribute('href') && 
                (this.getAttribute('href').includes('.html') || 
                 this.getAttribute('href').startsWith('http'))) {
                return;
            }
            
            // Handle view changes within the current page
            e.preventDefault();
            const view = this.getAttribute('data-view');
            if (view) {
                changeView(view);
            }
        });
    });
    
    // View mode toggle buttons (card, list, timeline)
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.getAttribute('data-view');
            updateViewMode();
        });
    });
    
    // Project creation button
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openProjectModal();
        });
    }
    
    // Modal close buttons
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
/**
 * DASHBOARD FUNCTIONS
 * Methods for updating the main dashboard elements
 */

// Updates the current date display in the header
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

// Updates all dashboard widgets with current data
function updateDashboard() {
    updateProjectProgress();
    updateUpcomingDeadlines();
    updateRecentActivity();
    updateProjectsTimeline();
    updateRecentProjectsNav();
}

// Updates the project progress widget with completion percentages
function updateProjectProgress() {
    if (!projectProgressElement) return;
    
    projectProgressElement.innerHTML = '';
    
    // Show message if no projects available
    if (!projects.length) {
        projectProgressElement.innerHTML = '<p class="empty-state">No projects available.</p>';
        return;
    }
    
    // Display projects sorted by progress (lowest to highest)
    const projectsToShow = [...projects]
        .sort((a, b) => calculateProgress(a) - calculateProgress(b))
        .slice(0, 5); // Show only top 5
    
    projectsToShow.forEach(project => {
        const progressPercentage = calculateProgress(project);
        
        // Create progress item elements
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
        
        // Assemble the progress item
        progressHeader.appendChild(progressTitle);
        progressHeader.appendChild(progressPercentageEl);
        progressBar.appendChild(progressFill);
        progressItem.appendChild(progressHeader);
        progressItem.appendChild(progressBar);
        
        // Make progress items clickable to navigate to project details
        progressItem.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        projectProgressElement.appendChild(progressItem);
    });
}

// Updates the upcoming deadlines widget
function updateUpcomingDeadlines() {
    if (!upcomingDeadlinesElement) return;
    
    upcomingDeadlinesElement.innerHTML = '';
    
    // Only show active projects (not completed or cancelled)
    const activeProjects = projects.filter(p => 
        p.status !== 'completed' && p.status !== 'cancelled'
    );
    
    if (!activeProjects.length) {
        upcomingDeadlinesElement.innerHTML = '<p class="empty-state">No upcoming deadlines.</p>';
        return;
    }
    
    // Sort projects by deadline (closest first)
    const sortedByDeadline = [...activeProjects]
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5); // Show only top 5
    
    sortedByDeadline.forEach(project => {
        const deadline = new Date(project.deadline);
        const today = new Date();
        const isOverdue = deadline < today;
        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        
        // Create deadline item elements
        const deadlineItem = document.createElement('div');
        deadlineItem.className = 'deadline-item';
        
        const deadlineInfo = document.createElement('div');
        deadlineInfo.className = 'deadline-info';
        
        const projectName = document.createElement('div');
        projectName.className = 'deadline-project';
        projectName.textContent = project.name;
        
        const deadlineDate = document.createElement('div');
        deadlineDate.className = 'deadline-date';
        
        // Format the deadline text based on days remaining
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
        
        // Assemble the deadline item
        deadlineInfo.appendChild(projectName);
        deadlineInfo.appendChild(deadlineDate);
        deadlineItem.appendChild(deadlineInfo);
        deadlineItem.appendChild(statusBadge);
        
        // Make deadline items clickable to navigate to project details
        deadlineItem.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        upcomingDeadlinesElement.appendChild(deadlineItem);
    });
}

// Updates the recent activity widget with latest project changes
function updateRecentActivity() {
    if (!recentActivityElement) return;
    
    recentActivityElement.innerHTML = '';
    
    if (!projects.length) {
        recentActivityElement.innerHTML = '<p class="empty-state">No recent activity.</p>';
        return;
    }
    
    // Sort projects by last updated date (most recent first)
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
        
        // Create activity item elements
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
        
        // Assemble the activity item
        activityHeader.appendChild(activityTitle);
        activityHeader.appendChild(activityTime);
        activityItem.appendChild(activityHeader);
        activityItem.appendChild(activityDescription);
        
        // Make activity items clickable to navigate to project details
        activityItem.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        recentActivityElement.appendChild(activityItem);
    });
}

// Creates a visual timeline of all projects
function updateProjectsTimeline() {
    if (!projectsTimelineElement) return;
    
    projectsTimelineElement.innerHTML = '';
    
    if (!projects.length) {
        projectsTimelineElement.innerHTML = '<div class="empty-message">No projects to display</div>';
        return;
    }
    
    // Find date range for all projects
    let earliestDate = new Date();
    let latestDate = new Date();
    
    projects.forEach(project => {
        const startDate = new Date(project.startDate);
        const deadlineDate = new Date(project.deadline);
        
        if (startDate < earliestDate) earliestDate = startDate;
        if (deadlineDate > latestDate) latestDate = deadlineDate;
    });
    
    // Ensure we have at least 3 months of timeline
    const minEndDate = new Date(earliestDate);
    minEndDate.setMonth(minEndDate.getMonth() + 3);
    if (latestDate < minEndDate) {
        latestDate = minEndDate;
    }
    
    // Format date range for display
    earliestDate.setDate(1); // Start from the 1st of the month
    latestDate.setMonth(latestDate.getMonth() + 1, 0); // End at the last day of the month
    
    // Create the timeline structure
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    
    // Create month headers for the timeline
    const timelineHeader = document.createElement('div');
    timelineHeader.className = 'timeline-header';
    
    // Add empty cell for project names
    const emptyCell = document.createElement('div');
    emptyCell.className = 'timeline-row-label';
    timelineHeader.appendChild(emptyCell);
    
    // Generate month columns for the timeline
    const months = [];
    const startMonth = new Date(earliestDate);
    const endMonth = new Date(latestDate);
    
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
    
    // Calculate the total span of days for positioning projects
    const totalDays = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24));
    
    // Create a row for each project in the timeline
    projects.forEach(project => {
        const projectStartDate = new Date(project.startDate);
        const projectDeadline = new Date(project.deadline);
        
        // Calculate position and width of the project bar
        const startOffset = Math.ceil((projectStartDate - earliestDate) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((projectDeadline - projectStartDate) / (1000 * 60 * 60 * 24)) + 1;
        
        const startPercent = (startOffset / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;
        
        // Create row elements
        const timelineRow = document.createElement('div');
        timelineRow.className = 'timeline-row';
        
        // Add project name column
        const projectLabel = document.createElement('div');
        projectLabel.className = 'timeline-row-label';
        projectLabel.textContent = project.name;
        projectLabel.title = project.name;
        timelineRow.appendChild(projectLabel);
        
        // Create the timeline track where the project bar sits
        const timelineTrack = document.createElement('div');
        timelineTrack.className = 'timeline-row-track';
        timelineRow.appendChild(timelineTrack);
        
        // Create the actual project bar
        const timelineBar = document.createElement('div');
        timelineBar.className = `timeline-bar timeline-bar-${getStatusClass(project.status)}`;
        timelineBar.style.left = `${startPercent}%`;
        timelineBar.style.width = `${widthPercent}%`;
        timelineBar.title = `${project.name}: ${formatDate(projectStartDate)} - ${formatDate(projectDeadline)}`;
        
        // Make project bars clickable to navigate to project details
        timelineBar.addEventListener('click', () => {
            window.location.href = `project-details.html?id=${project.id}`;
        });
        
        timelineTrack.appendChild(timelineBar);
        timeline.appendChild(timelineRow);
    });
    
    projectsTimelineElement.appendChild(timeline);
}

// Updates the recent projects navigation sidebar
function updateRecentProjectsNav() {
    const recentProjectsNavElement = document.getElementById('recent-projects-nav');
    if (!recentProjectsNavElement) return;
    
    // Verify user authentication
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.userId) {
        recentProjectsNavElement.innerHTML = '<div class="nav-placeholder-message">Sign in to see recent projects</div>';
        return;
    }
    
    // Detect if we're on a project details page to highlight current project
    let currentProjectId = null;
    if (window.location.pathname.includes('project-details.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        currentProjectId = urlParams.get('id');
    }
    
    recentProjectsNavElement.innerHTML = '';
    
    // Get projects from local storage
    const projectsKey = `orangeAcademyProjects_${currentUser.userId}`;
    const projectsList = JSON.parse(localStorage.getItem(projectsKey)) || [];
    
    if (projectsList.length === 0) {
        recentProjectsNavElement.innerHTML = '<div class="nav-placeholder-message">No projects yet</div>';
        return;
    }
    
    // Show most recently updated projects
    const recentProjects = [...projectsList]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5); // Show only top 5
    
    // Create navigation links for each project
    recentProjects.forEach(p => {
        if (!p) return; // Skip undefined projects
        
        // Create project link
        const projectLink = document.createElement('a');
        projectLink.href = `project-details.html?id=${p.id}`;
        projectLink.className = 'nav-item';
        
        // Highlight current project if we're viewing it
        if (currentProjectId && p.id === currentProjectId) {
            projectLink.classList.add('active');
        }
        
        // Create status icon based on project status
        const statusIcon = document.createElement('i');
        const status = (p.status || 'not started').toLowerCase();
        
        switch(status) {
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
        if (typeof getStatusClass === 'function') {
            statusIcon.style.color = `var(--status-${getStatusClass(p.status || 'not started')})`;
        }
        
        // Add project name
        const projectName = document.createTextNode(p.name || 'Unnamed Project');
        
        // Assemble the link
        projectLink.appendChild(statusIcon);
        projectLink.appendChild(projectName);
        
        recentProjectsNavElement.appendChild(projectLink);
    });
}

/**
 * PROJECT MANAGEMENT FUNCTIONS
 * Methods for loading, saving, and manipulating projects
 */

// Loads projects from local storage
function loadProjects() {
    const projectsKey = `orangeAcademyProjects_${currentUser.userId}`;
    projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
}

// Loads team members from local storage
function loadTeamMembers() {
    const teamKey = `orangeAcademyTeam_${currentUser.userId}`;
    teamMembers = JSON.parse(localStorage.getItem(teamKey)) || [];
    
    populateTeamSelection();
}

// Saves projects to local storage
function saveProjects() {
    const projectsKey = `orangeAcademyProjects_${currentUser.userId}`;
    localStorage.setItem(projectsKey, JSON.stringify(projects));
}

// Calculates project completion percentage based on task completion
function calculateProgress(project) {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
}

// Populates team member selection in project forms
function populateTeamSelection() {
    const teamSelectionEl = document.getElementById('team-selection');
    if (!teamSelectionEl) return;
    
    teamSelectionEl.innerHTML = '';
    
    if (teamMembers.length === 0) {
        teamSelectionEl.innerHTML = '<p>No team members available</p>';
        return;
    }
    
    // Create checkboxes for each team member
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

// Opens the project creation/editing modal
function openProjectModal(projectId = null) {
    // Reset form for new input
    projectForm.reset();
    
    // Set default dates for new projects
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('project-start-date').value = today;
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('project-deadline').value = nextWeek.toISOString().split('T')[0];
    
    // If editing existing project, populate form with project data
    if (projectId) {
        editingProjectId = projectId;
        document.getElementById('modal-title').textContent = 'Edit Project';
        
        const project = projects.find(p => p.id === projectId);
        if (project) {
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-description').value = project.description;
            document.getElementById('project-start-date').value = project.startDate;
            document.getElementById('project-deadline').value = project.deadline;
            document.getElementById('project-status').value = project.status;
            
            // Select team members for the project
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
    
    // Display the modal
    projectModal.style.display = 'block';
}

// Closes the project modal without saving changes
function closeProjectModal() {
    projectModal.style.display = 'none';
    editingProjectId = null;
}

// Saves project data from the modal form
function saveProject() {
    // Get form input values
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const startDate = document.getElementById('project-start-date').value;
    const deadline = document.getElementById('project-deadline').value;
    const status = document.getElementById('project-status').value;
    
    // Validate required fields
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
    
    // Save to localStorage and update UI
    saveProjects();
    closeProjectModal();
    updateDashboard();
}

/**
 * VIEW MANAGEMENT FUNCTIONS
 * Methods for handling different view modes and filtering
 */

// Updates the current view mode (card, list, timeline)
function updateViewMode() {
    // This would handle different view modes for projects
    console.log(`View mode changed to: ${currentView}`);
}

// Filters projects based on search term
function filterProjects(searchTerm = '') {
    // Filtering functionality for project views
}

// Highlights search terms in the UI
function highlightSearchTerms(searchTerm) {
    // Search term highlighting logic
    if (!searchTerm) return;
}

/**
 * USER AUTHENTICATION FUNCTIONS
 * Methods for handling user sessions
 */

// Checks if a user is logged in
function isLoggedIn() {
    const session = JSON.parse(localStorage.getItem('orangeAcademySession')) || {};
    return !!session.loggedIn;
}

// Gets the current user data from session storage
function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem('orangeAcademySession')) || {};
    return {
        userId: session.userId || 'guest',
        fullname: session.fullname || 'Guest User',
        email: session.email || 'guest@example.com'
    };
}

// Updates the UI with current user information
function updateUserUI() {
    if (!userInfoElement || !currentUser) return;
    
    // Create user initials for the avatar
    const nameParts = currentUser.fullname.split(' ');
    const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
        : nameParts[0].substring(0, 2).toUpperCase();
    
    // Update the user info display in the sidebar
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
    
    // Set up the user dropdown menu
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;
    
    const userMenu = document.createElement('div');
    userMenu.id = 'user-dropdown-menu';
    userMenu.className = 'user-menu';
    
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
    
    userProfile.appendChild(userMenu);
    
    // Set up logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Toggle dropdown menu on user profile click
    userInfoElement.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isVisible = userMenu.style.display === 'block';
        userMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (userMenu.style.display === 'block' &&
            !userInfoElement.contains(e.target) && 
            !userMenu.contains(e.target)) {
            userMenu.style.display = 'none';
        }
    });
}

// Logs out the current user
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('orangeAcademySession');
        
        // Add fade-out animation before redirecting
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

/**
 * UTILITY FUNCTIONS
 * Helper methods used throughout the application
 */

// Maps status strings to CSS class names
function getStatusClass(status) {
    if (!status) return 'not-started';
    
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
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

// Formats dates for display
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Formats dates in relative terms (e.g., "2 days ago")
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