// ==============================================
// PROJECTS CONTROLLER
// ==============================================

// DOM Elements
const projectsList = document.getElementById('projects-list');
const noProjectsMessage = document.getElementById('no-projects');
const newProjectBtn = document.getElementById('new-project-btn');
const newProjectHeaderBtn = document.getElementById('new-project-header-btn');
const createFirstProjectBtn = document.getElementById('create-first-project');
const projectModal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const projectForm = document.getElementById('project-form');
const projectName = document.getElementById('project-name');
const projectDescription = document.getElementById('project-description');
const projectStartDate = document.getElementById('project-start-date');
const projectDeadline = document.getElementById('project-deadline');
const projectStatus = document.getElementById('project-status');
const teamSelection = document.getElementById('team-selection');
const saveProjectBtn = document.getElementById('save-project');
const cancelProjectBtn = document.getElementById('cancel-project');
const closeModalBtn = document.querySelector('.close-modal');
const searchInput = document.getElementById('search-projects');
const statusFilter = document.getElementById('status-filter');
const sortProjects = document.getElementById('sort-projects');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const recentProjectsNavElement = document.getElementById('recent-projects-nav');
const userInfoElement = document.getElementById('user-info');

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
    
    // Initialize sidebar toggle
    initSidebar();
    
    // Load projects
    loadProjects();
    
    // Load team members
    loadTeamMembers();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI with user info
    updateUserUI();
    
    // Update recent projects in sidebar
    updateRecentProjectsNav();
});

// ==============================================
// EVENT LISTENERS
// ==============================================
function setupEventListeners() {
    // New project buttons
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => openProjectModal());
    }
    
    if (newProjectHeaderBtn) {
        newProjectHeaderBtn.addEventListener('click', () => openProjectModal());
    }
    
    // Create first project button
    if (createFirstProjectBtn) {
        createFirstProjectBtn.addEventListener('click', () => openProjectModal());
    }
    
    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProjectModal);
    }
    
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', closeProjectModal);
    }
    
    // Save project
    if (projectForm) {
        projectForm.addEventListener('submit', handleSaveProject);
    }
    
    // Search projects
    if (searchInput) {
        searchInput.addEventListener('input', filterProjects);
    }
    
    // Filter by status
    if (statusFilter) {
        statusFilter.addEventListener('change', filterProjects);
    }
    
    // Sort projects
    if (sortProjects) {
        sortProjects.addEventListener('change', filterProjects);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (projectModal && e.target === projectModal) {
            closeProjectModal();
        }
    });
    
    // Handle sidebar navigation
    setupSidebarNavigation();
}

function setupSidebarNavigation() {
    // Make sure sidebar links work properly
    const dashboardLink = document.querySelector('a[href="dashboard.html"]');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
    }
    
    const projectsLink = document.querySelector('a[href="projects.html"]');
    if (projectsLink) {
        projectsLink.addEventListener('click', function() {
            window.location.href = 'projects.html';
        });
    }
    
    const calendarLink = document.querySelector('a[href="calendar.html"]');
    if (calendarLink) {
        calendarLink.addEventListener('click', function() {
            window.location.href = 'calendar.html';
        });
    }
    
    const teamLink = document.querySelector('a[href="team.html"]');
    if (teamLink) {
        teamLink.addEventListener('click', function() {
            window.location.href = 'team.html';
        });
    }
}

// ==============================================
// PROJECTS MANAGEMENT
// ==============================================
function loadProjects() {
    // Get projects from local storage
    const projectsKey = `orangeAcademyProjects_${currentUser.userId}`;
    projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
    
    // Display projects
    renderProjects();
}

function saveProjects() {
    // Save projects to local storage
    const projectsKey = `orangeAcademyProjects_${currentUser.userId}`;
    localStorage.setItem(projectsKey, JSON.stringify(projects));
    
    // Update recent projects in sidebar
    updateRecentProjectsNav();
}

function renderProjects() {
    if (!projectsList) return;
    
    // Clear projects list
    projectsList.innerHTML = '';
    
    // Show or hide "no projects" message
    if (projects.length === 0) {
        if (noProjectsMessage) {
            noProjectsMessage.style.display = 'flex';
        }
        return;
    } else {
        if (noProjectsMessage) {
            noProjectsMessage.style.display = 'none';
        }
    }
    
    // Filter and sort projects based on current selection
    let filteredProjects = [...projects];
    
    // Apply search filter
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filteredProjects = filteredProjects.filter(project => 
            project.name.toLowerCase().includes(searchTerm) || 
            (project.description && project.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply status filter
    if (statusFilter && statusFilter.value !== 'all') {
        filteredProjects = filteredProjects.filter(project => 
            project.status === statusFilter.value
        );
    }
    
    // Apply sorting
    if (sortProjects) {
        const sortBy = sortProjects.value;
        
        filteredProjects.sort((a, b) => {
            switch(sortBy) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'deadline':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'newest':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }
    
    // Show no projects message if filtered list is empty
    if (filteredProjects.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'empty-state';
        noResults.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>No matching projects</h3>
            <p>Try adjusting your search or filters</p>
        `;
        projectsList.appendChild(noResults);
        return;
    }
    
    // Render each project
    filteredProjects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsList.appendChild(projectCard);
    });
}

function createProjectCard(project) {
    // Create project card element
    const card = document.createElement('div');
    card.className = `project-card status-${getStatusClass(project.status)}`;
    card.dataset.id = project.id;
    
    // Calculate progress if project has tasks
    let progressPercentage = 0;
    let completedTasks = 0;
    let totalTasks = 0;
    
    if (project.tasks && project.tasks.length > 0) {
        totalTasks = project.tasks.length;
        completedTasks = project.tasks.filter(task => task.completed).length;
        progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    }
    
    // Calculate time remaining
    const timeRemaining = getTimeRemaining(project.deadline);
    
    // Format dates
    const startDate = formatDate(new Date(project.startDate));
    const deadline = formatDate(new Date(project.deadline));
    
    // Get team member information
    const teamMembers = project.team && project.team.length > 0 ? 
        project.team.map(memberId => {
            const member = getTeamMember(memberId);
            return member ? member.name : 'Unknown';
        }).join(', ') : 
        'No team assigned';
    
    // Build HTML
    card.innerHTML = `
        <div class="project-header">
            <h3 class="project-title">${project.name}</h3>
            <span class="project-status">${project.status}</span>
        </div>
        <div class="project-body">
            <p class="project-description">${project.description || 'No description provided'}</p>
            
            <div class="project-progress">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${progressPercentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="task-count">${completedTasks}/${totalTasks} tasks completed</div>
            </div>
            
            <div class="project-details">
                <div class="detail-group">
                    <span class="detail-label"><i class="fas fa-calendar-alt"></i> Start:</span>
                    <span class="detail-value">${startDate}</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label"><i class="fas fa-clock"></i> Deadline:</span>
                    <span class="detail-value ${timeRemaining.overdue ? 'overdue' : timeRemaining.urgent ? 'urgent' : ''}">${deadline}</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label"><i class="fas fa-users"></i> Team:</span>
                    <span class="detail-value team-members" title="${teamMembers}">${teamMembers}</span>
                </div>
            </div>
        </div>
        <div class="project-footer">
            <button class="btn-view-project" data-id="${project.id}">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="btn-edit-project" data-id="${project.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-delete-project" data-id="${project.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    // Add event listeners
    const viewBtn = card.querySelector('.btn-view-project');
    const editBtn = card.querySelector('.btn-edit-project');
    const deleteBtn = card.querySelector('.btn-delete-project');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', () => viewProject(project.id));
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', () => editProject(project.id));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteProject(project.id));
    }
    
    return card;
}

function getStatusClass(status) {
    if (!status) return 'not-started';
    
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

function getTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate - now;
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    
    return {
        days: daysRemaining,
        urgent: daysRemaining <= 3 && daysRemaining > 0,
        overdue: daysRemaining < 0
    };
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function openProjectModal(projectId = null) {
    if (!projectModal) return;
    
    // Reset form fields
    resetFormFields();
    
    // Set modal title based on operation
    if (projectId) {
        modalTitle.textContent = 'Edit Project';
        editingProjectId = projectId;
        
        // Populate form with project data
        const project = projects.find(p => p.id === projectId);
        if (project) {
            projectName.value = project.name;
            projectDescription.value = project.description || '';
            projectStartDate.value = project.startDate;
            projectDeadline.value = project.deadline;
            projectStatus.value = project.status;
            
            // Select team members
            if (project.team && teamSelection) {
                const checkboxes = teamSelection.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = project.team.includes(checkbox.value);
                });
            }
        }
    } else {
        modalTitle.textContent = 'Create New Project';
        editingProjectId = null;
        
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        if (projectStartDate) projectStartDate.value = today;
        
        // Set default deadline (7 days from now)
        const defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 7);
        if (projectDeadline) projectDeadline.value = defaultDeadline.toISOString().split('T')[0];
    }
    
    // Show modal
    projectModal.style.display = 'block';
}

function closeProjectModal() {
    if (projectModal) {
        projectModal.style.display = 'none';
    }
    resetFormFields();
    editingProjectId = null;
}

function resetFormFields() {
    if (projectForm) projectForm.reset();
}

function handleSaveProject(e) {
    e.preventDefault();
    
    // Validate form
    if (!projectName.value.trim()) {
        alert('Please enter a project name');
        return;
    }
    
    if (!projectStartDate.value) {
        alert('Please select a start date');
        return;
    }
    
    if (!projectDeadline.value) {
        alert('Please select a deadline');
        return;
    }
    
    // Get selected team members
    let selectedTeam = [];
    if (teamSelection) {
        const checkboxes = teamSelection.querySelectorAll('input[type="checkbox"]:checked');
        selectedTeam = Array.from(checkboxes).map(cb => cb.value);
    }
    
    if (editingProjectId) {
        // Update existing project
        const projectIndex = projects.findIndex(p => p.id === editingProjectId);
        if (projectIndex !== -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                name: projectName.value.trim(),
                description: projectDescription.value.trim(),
                startDate: projectStartDate.value,
                deadline: projectDeadline.value,
                status: projectStatus.value,
                team: selectedTeam,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create new project
        const newProject = {
            id: Date.now().toString(),
            name: projectName.value.trim(),
            description: projectDescription.value.trim(),
            startDate: projectStartDate.value,
            deadline: projectDeadline.value,
            status: projectStatus.value,
            team: selectedTeam,
            tasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        projects.push(newProject);
    }
    
    // Save and render projects
    saveProjects();
    renderProjects();
    
    // Close modal
    closeProjectModal();
}

function viewProject(projectId) {
    // Redirect to project details page
    window.location.href = `project-details.html?id=${projectId}`;
}

function editProject(projectId) {
    openProjectModal(projectId);
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(project => project.id !== projectId);
        saveProjects();
        renderProjects();
    }
}

function filterProjects() {
    renderProjects();
}

// ==============================================
// TEAM MANAGEMENT
// ==============================================
function loadTeamMembers() {
    // Get team members from local storage
    const teamKey = `orangeAcademyTeam_${currentUser.userId}`;
    teamMembers = JSON.parse(localStorage.getItem(teamKey)) || [];
    
    // If no team members exist, create some demo team members
    if (teamMembers.length === 0) {
        createDemoTeamMembers();
    }
    
    // Populate team selection in project form
    populateTeamSelection();
}

function createDemoTeamMembers() {
    const demoMembers = [
        { id: '1001', name: 'John Smith', role: 'Developer' },
        { id: '1002', name: 'Emily Johnson', role: 'Designer' },
        { id: '1003', name: 'Michael Brown', role: 'Project Manager' },
        { id: '1004', name: 'Sarah Davis', role: 'QA Engineer' }
    ];
    
    teamMembers = demoMembers;
    const teamKey = `orangeAcademyTeam_${currentUser.userId}`;
    localStorage.setItem(teamKey, JSON.stringify(teamMembers));
}

function populateTeamSelection() {
    if (!teamSelection) return;
    
    // Clear existing options
    teamSelection.innerHTML = '';
    
    if (teamMembers.length === 0) {
        // Show message if no team members
        teamSelection.innerHTML = '<p>No team members available. Add team members first.</p>';
        return;
    }
    
    // Create checkbox for each team member
    teamMembers.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `team-member-${member.id}`;
        checkbox.value = member.id;
        checkbox.name = 'team-members';
        
        const label = document.createElement('label');
        label.htmlFor = `team-member-${member.id}`;
        label.textContent = member.name;
        
        memberDiv.appendChild(checkbox);
        memberDiv.appendChild(label);
        teamSelection.appendChild(memberDiv);
    });
}

function getTeamMember(id) {
    return teamMembers.find(member => member.id === id);
}

// ==============================================
// SIDEBAR & UI FUNCTIONS 
// ==============================================
function initSidebar() {
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('open');
            }
        });
    }
}

function updateRecentProjectsNav() {
    if (!recentProjectsNavElement) return;
    
    // Clear previous content
    recentProjectsNavElement.innerHTML = '';
    
    if (projects.length === 0) {
        recentProjectsNavElement.innerHTML = '<div class="nav-placeholder-message">No projects yet</div>';
        return;
    }
    
    // Sort projects by updated date (most recent first)
    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5); // Show only top 5
    
    // Create nav items
    recentProjects.forEach(p => {
        const projectLink = document.createElement('a');
        projectLink.href = `project-details.html?id=${p.id}`;
        projectLink.className = 'nav-item';
        
        // Status icon
        const statusIcon = document.createElement('i');
        
        switch(p.status.toLowerCase()) {
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
        statusIcon.style.color = `var(--status-${getStatusClass(p.status)})`;
        
        // Project name
        const projectName = document.createTextNode(p.name);
        
        projectLink.appendChild(statusIcon);
        projectLink.appendChild(projectName);
        
        recentProjectsNavElement.appendChild(projectLink);
    });
}

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
    
    // Add dropdown menu and functionality
    setupUserDropdown(userInfoElement);
}

function setupUserDropdown(userInfoElement) {
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
    userMenu.style.display = 'none';
    
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
    
    // Add logout event handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Toggle menu visibility
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

// ==============================================
// USER AUTHENTICATION FUNCTIONS
// ==============================================
function isLoggedIn() {
    const session = JSON.parse(localStorage.getItem('orangeAcademySession'));
    return !!(session && session.loggedIn);
}

function getCurrentUser() {
    if (!isLoggedIn()) return null;
    
    const session = JSON.parse(localStorage.getItem('orangeAcademySession'));
    return {
        userId: session.userId,
        fullname: session.fullname,
        email: session.email
    };
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('orangeAcademySession');
        
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}