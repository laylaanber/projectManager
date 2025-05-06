/**
 * PROJECTS CONTROLLER
 * 
 * This file manages the projects listing page functionality including:
 * - Loading and displaying projects
 * - Filtering and sorting projects
 * - Creating, editing, and deleting projects
 */

// --------------------------------------------------------------------------
// DOM ELEMENT REFERENCES
// --------------------------------------------------------------------------
const projectsList = document.getElementById('projects-list');
const noProjectsMessage = document.getElementById('no-projects');
const newProjectBtn = document.getElementById('new-project-btn');
const newProjectHeaderBtn = document.getElementById('new-project-header-btn');
const createFirstProjectBtn = document.getElementById('create-first-project');
const projectModal = document.getElementById('project-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelProjectBtn = document.getElementById('cancel-project');
const projectForm = document.getElementById('project-form');
const modalTitle = document.getElementById('modal-title');
const searchInput = document.getElementById('search-projects');
const statusFilter = document.getElementById('status-filter');
const sortProjects = document.getElementById('sort-projects');

// --------------------------------------------------------------------------
// APPLICATION STATE
// --------------------------------------------------------------------------
let projectsUser = null;     // Current logged-in user
let allProjects = [];        // All projects from storage
let editingProjectId = null; // ID of project being edited (null if creating new)
let teamMembers = [];        // Team members for selection

// --------------------------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('Projects page initialized');
    
    // Redirect to login if not authenticated
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get current user
    projectsUser = getCurrentUser();
    console.log('Current user:', projectsUser);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load data
    loadProjects();
    loadTeamMembers();
    
    // Update user info
    updateUserInfo();
    
    // Check URL for query parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
        // Open project modal if query parameter specified
        openProjectModal();
    }
});

// --------------------------------------------------------------------------
// EVENT LISTENERS
// --------------------------------------------------------------------------
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Toggle sidebar
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.toggle('open');
        });
    }
    
    // Project creation buttons
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openProjectModal();
        });
    }
    
    if (newProjectHeaderBtn) {
        newProjectHeaderBtn.addEventListener('click', function() {
            openProjectModal();
        });
    }
    
    if (createFirstProjectBtn) {
        createFirstProjectBtn.addEventListener('click', function() {
            openProjectModal();
        });
    }
    
    // Project modal controls
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProjectModal);
    }
    
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeProjectModal();
        });
    }
    
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProject();
        });
    }
    
    // Filter and search controls
    if (searchInput) {
        searchInput.addEventListener('input', filterAndDisplayProjects);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAndDisplayProjects);
    }
    
    if (sortProjects) {
        sortProjects.addEventListener('change', filterAndDisplayProjects);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === projectModal) {
            closeProjectModal();
        }
    });
}

// --------------------------------------------------------------------------
// PROJECT MANAGEMENT
// --------------------------------------------------------------------------
function loadProjects() {
    console.log('Loading projects');
    
    // Get projects from localStorage
    const projectsKey = `orangeAcademyProjects_${projectsUser.userId}`;
    allProjects = JSON.parse(localStorage.getItem(projectsKey)) || [];
    
    console.log(`Loaded ${allProjects.length} projects`);
    
    // Display projects
    filterAndDisplayProjects();
    
    // Update sidebar navigation
    updateRecentProjectsNav();
}

function filterAndDisplayProjects() {
    console.log('Filtering and displaying projects');
    
    // Make a copy of all projects
    let filteredProjects = [...allProjects];
    
    // Apply search filter if search term exists
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim().toLowerCase();
        console.log('Filtering by search term:', searchTerm);
        
        filteredProjects = filteredProjects.filter(project => 
            project.name.toLowerCase().includes(searchTerm) || 
            (project.description && project.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply status filter if not set to "all"
    if (statusFilter && statusFilter.value !== 'all') {
        const filterStatus = statusFilter.value;
        console.log('Filtering by status:', filterStatus);
        
        filteredProjects = filteredProjects.filter(project => 
            project.status === filterStatus
        );
    }
    
    // Apply sorting
    if (sortProjects) {
        const sortBy = sortProjects.value;
        console.log('Sorting by:', sortBy);
        
        switch (sortBy) {
            case 'newest':
                filteredProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filteredProjects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'name-asc':
                filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredProjects.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'deadline':
                filteredProjects.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                break;
            default:
                // Default to newest first
                filteredProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }
    
    console.log(`Found ${filteredProjects.length} projects after filtering`);
    
    // Display the filtered and sorted projects
    renderProjects(filteredProjects);
}

function renderProjects(projectsList) {
    if (!projectsList) return;
    
    const projectsContainer = document.getElementById('projects-list');
    if (!projectsContainer) return;
    
    // Clear existing content
    projectsContainer.innerHTML = '';
    
    // Show no projects message if empty
    if (allProjects.length === 0) {
        if (noProjectsMessage) {
            noProjectsMessage.style.display = 'flex';
        }
        return;
    } else {
        if (noProjectsMessage) {
            noProjectsMessage.style.display = 'none';
        }
    }
    
    // Show no results message if filtered to empty
    if (projectsList.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'empty-state';
        noResults.innerHTML = `
            <i class="fas fa-filter"></i>
            <h3>No matching projects</h3>
            <p>Try adjusting your search or filters</p>
        `;
        projectsContainer.appendChild(noResults);
        return;
    }
    
    console.log(`Rendering ${projectsList.length} projects`);
    
    // Create project cards for each project
    projectsList.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsContainer.appendChild(projectCard);
    });
}

function createProjectCard(project) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.id = project.id;
    
    // Calculate progress
    let progressPercentage = 0;
    let completedTasks = 0;
    let totalTasks = project.tasks ? project.tasks.length : 0;
    
    if (project.tasks && project.tasks.length > 0) {
        completedTasks = project.tasks.filter(task => task.completed).length;
        progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    }
    
    // Calculate dates and time remaining
    const startDate = formatDate(new Date(project.startDate));
    const deadlineDate = formatDate(new Date(project.deadline));
    const timeRemaining = getTimeRemaining(project.deadline);
    const timeRemainingText = timeRemaining.overdue ? 
        `Overdue by ${Math.abs(timeRemaining.days)} days` : 
        `${timeRemaining.days} days left`;
    
    // Status class for styling
    const statusClass = getStatusClass(project.status);
    
    // Set background color for progress bar
    let progressColor = 'var(--status-progress)';
    if (progressPercentage === 100) {
        progressColor = 'var(--status-completed)';
    } else if (progressPercentage >= 75) {
        progressColor = 'var(--accent-blue)';
    } else if (progressPercentage >= 50) {
        progressColor = 'var(--accent-orange)';
    }
    
    // Build card HTML
    card.innerHTML = `
        <div class="project-header">
            <h3 class="project-title">${project.name}</h3>
            <span class="status-badge status-${statusClass}">
                ${project.status ? capitalizeFirstLetter(project.status) : 'Not Started'}
            </span>
        </div>
        <div class="project-body">
            <p class="project-description">${project.description || 'No description provided'}</p>
            
            <div class="project-details">
                <div class="detail-group">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${startDate} - ${deadlineDate}</span>
                </div>
                <div class="detail-group ${timeRemaining.overdue ? 'overdue' : timeRemaining.urgent ? 'urgent' : ''}">
                    <i class="fas fa-clock"></i>
                    <span>${timeRemainingText}</span>
                </div>
                <div class="detail-group">
                    <i class="fas fa-tasks"></i>
                    <span>${completedTasks}/${totalTasks} tasks completed</span>
                </div>
            </div>
            
            <div class="project-progress">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${progressPercentage}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%; background-color: ${progressColor};"></div>
                </div>
            </div>
        </div>
        <div class="project-footer">
            <div class="project-actions">
                <button class="btn-edit-project" title="Edit Project">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete-project" title="Delete Project">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-view-project" title="View Project">
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
    
    // Make the whole card clickable to navigate to project details
    card.addEventListener('click', function(e) {
        // Don't navigate if clicking on buttons
        if (e.target.closest('.project-actions button')) return;
        
        window.location.href = `project-details.html?id=${project.id}`;
    });
    
    // Add button event listeners
    const editBtn = card.querySelector('.btn-edit-project');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Don't trigger card click
            openProjectModal(project.id);
        });
    }
    
    const deleteBtn = card.querySelector('.btn-delete-project');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Don't trigger card click
            deleteProject(project.id);
        });
    }
    
    const viewBtn = card.querySelector('.btn-view-project');
    if (viewBtn) {
        viewBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Don't trigger card click
            window.location.href = `project-details.html?id=${project.id}`;
        });
    }
    
    return card;
}

function openProjectModal(projectId = null) {
    console.log('Opening project modal', projectId ? 'for editing' : 'for creation');
    
    // Get form elements
    const projectNameInput = document.getElementById('project-name');
    const projectDescInput = document.getElementById('project-description');
    const projectStartDateInput = document.getElementById('project-start-date');
    const projectDeadlineInput = document.getElementById('project-deadline');
    const projectStatusInput = document.getElementById('project-status');
    const saveProjectBtn = document.getElementById('save-project');
    
    // Reset form
    if (projectForm) projectForm.reset();
    
    if (projectId) {
        // Edit existing project
        editingProjectId = projectId;
        modalTitle.textContent = 'Edit Project';
        if (saveProjectBtn) saveProjectBtn.textContent = 'Update Project';
        
        // Find project
        const project = allProjects.find(p => p.id === projectId);
        if (project) {
            // Fill form with project data
            if (projectNameInput) projectNameInput.value = project.name || '';
            if (projectDescInput) projectDescInput.value = project.description || '';
            if (projectStartDateInput) projectStartDateInput.value = project.startDate || '';
            if (projectDeadlineInput) projectDeadlineInput.value = project.deadline || '';
            if (projectStatusInput) projectStatusInput.value = project.status || 'not started';
            
            // Select team members if applicable
            populateTeamSelection(project.team);
        }
    } else {
        // Create new project
        editingProjectId = null;
        modalTitle.textContent = 'New Project';
        if (saveProjectBtn) saveProjectBtn.textContent = 'Create Project';
        
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        if (projectStartDateInput) projectStartDateInput.value = today;
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (projectDeadlineInput) projectDeadlineInput.value = nextWeek.toISOString().split('T')[0];
        
        populateTeamSelection();
    }
    
    // Show modal
    if (projectModal) projectModal.style.display = 'block';
    
    // Reset event listeners to prevent duplicates for the cancel button
    if (cancelProjectBtn) {
        const newCancelBtn = cancelProjectBtn.cloneNode(true);
        cancelProjectBtn.parentNode.replaceChild(newCancelBtn, cancelProjectBtn);
        
        newCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeProjectModal();
        });
    }
}

function closeProjectModal() {
    console.log('Closing project modal');
    if (projectModal) projectModal.style.display = 'none';
    editingProjectId = null;
}

function saveProject() {
    console.log('Saving project', editingProjectId ? 'editing existing' : 'creating new');
    
    // Get form values
    const projectName = document.getElementById('project-name').value.trim();
    const projectDesc = document.getElementById('project-description').value.trim();
    const projectStartDate = document.getElementById('project-start-date').value;
    const projectDeadline = document.getElementById('project-deadline').value;
    const projectStatus = document.getElementById('project-status').value;
    
    // Validate form
    if (!projectName) {
        alert('Project name is required');
        return;
    }
    
    if (!projectStartDate) {
        alert('Start date is required');
        return;
    }
    
    if (!projectDeadline) {
        alert('Deadline is required');
        return;
    }
    
    // Get selected team members
    const selectedTeam = [];
    const teamCheckboxes = document.querySelectorAll('#team-selection input[type="checkbox"]:checked');
    teamCheckboxes.forEach(checkbox => {
        selectedTeam.push(checkbox.value);
    });
    
    if (editingProjectId) {
        // Update existing project
        const projectIndex = allProjects.findIndex(p => p.id === editingProjectId);
        if (projectIndex !== -1) {
            // Keep existing tasks and other properties
            allProjects[projectIndex] = {
                ...allProjects[projectIndex],
                name: projectName,
                description: projectDesc,
                startDate: projectStartDate,
                deadline: projectDeadline,
                status: projectStatus,
                team: selectedTeam,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create new project
        const newProject = {
            id: Date.now().toString(),
            name: projectName,
            description: projectDesc,
            startDate: projectStartDate,
            deadline: projectDeadline,
            status: projectStatus,
            team: selectedTeam,
            tasks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        allProjects.push(newProject);
    }
    
    // Save to localStorage
    saveProjects();
    
    // Close modal and refresh projects list
    closeProjectModal();
    filterAndDisplayProjects();
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        console.log('Deleting project:', projectId);
        
        // Remove project from array
        allProjects = allProjects.filter(project => project.id !== projectId);
        
        // Save to localStorage
        saveProjects();
        
        // Refresh projects list
        filterAndDisplayProjects();
    }
}

function saveProjects() {
    // Save projects to localStorage
    const projectsKey = `orangeAcademyProjects_${projectsUser.userId}`;
    localStorage.setItem(projectsKey, JSON.stringify(allProjects));
    
    console.log(`Saved ${allProjects.length} projects to localStorage`);
    
    // Update sidebar navigation
    updateRecentProjectsNav();
}

// --------------------------------------------------------------------------
// TEAM MANAGEMENT
// --------------------------------------------------------------------------
function loadTeamMembers() {
    // Get team members from localStorage
    const teamKey = `orangeAcademyTeam_${projectsUser.userId}`;
    teamMembers = JSON.parse(localStorage.getItem(teamKey)) || [];
    
    // Create demo team members if none exist
    if (teamMembers.length === 0) {
        createDemoTeamMembers();
    }
    
    console.log(`Loaded ${teamMembers.length} team members`);
}

function createDemoTeamMembers() {
    console.log('Creating demo team members');
    
    // Create some default team members for demo purposes
    const demoTeam = [
        { id: 'tm1', name: 'John Smith', role: 'Developer' },
        { id: 'tm2', name: 'Emily Johnson', role: 'Designer' },
        { id: 'tm3', name: 'Michael Brown', role: 'Project Manager' },
        { id: 'tm4', name: 'Sarah Lee', role: 'QA Engineer' }
    ];
    
    teamMembers = demoTeam;
    
    // Save to localStorage
    const teamKey = `orangeAcademyTeam_${projectsUser.userId}`;
    localStorage.setItem(teamKey, JSON.stringify(teamMembers));
}

function populateTeamSelection(selectedIds = []) {
    const teamSelectionContainer = document.getElementById('team-selection');
    if (!teamSelectionContainer) return;
    
    // Clear existing content
    teamSelectionContainer.innerHTML = '';
    
    if (teamMembers.length === 0) {
        teamSelectionContainer.innerHTML = '<p>No team members available</p>';
        return;
    }
    
    // Create checkbox for each team member
    teamMembers.forEach(member => {
        const memberOption = document.createElement('div');
        memberOption.className = 'team-member-option';
        
        const isSelected = selectedIds && selectedIds.includes(member.id);
        
        memberOption.innerHTML = `
            <input type="checkbox" id="team-member-${member.id}" value="${member.id}" ${isSelected ? 'checked' : ''}>
            <label for="team-member-${member.id}">${member.name} (${member.role})</label>
        `;
        
        teamSelectionContainer.appendChild(memberOption);
    });
}

// --------------------------------------------------------------------------
// UI UTILITIES
// --------------------------------------------------------------------------
function updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    if (!userInfoElement || !projectsUser) return;
    
    // Create user avatar initials
    const nameParts = projectsUser.fullname.split(' ');
    const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
        : nameParts[0].substring(0, 2).toUpperCase();
    
    // Update user info display
    userInfoElement.innerHTML = `
        <div class="user-avatar">${initials}</div>
        <div class="user-details">
            <div class="user-name">${projectsUser.fullname}</div>
            <div class="user-email">${projectsUser.email}</div>
        </div>
        <div class="user-dropdown">
            <i class="fas fa-chevron-down"></i>
        </div>
    `;
    
    // Setup user dropdown menu
    setupUserDropdown(userInfoElement);
}

function updateRecentProjectsNav() {
    const recentProjectsNavElement = document.getElementById('recent-projects-nav');
    if (!recentProjectsNavElement) return;
    
    // Clear previous content
    recentProjectsNavElement.innerHTML = '';
    
    if (allProjects.length === 0) {
        recentProjectsNavElement.innerHTML = '<div class="nav-placeholder-message">No projects yet</div>';
        return;
    }
    
    // Show most recently updated projects
    const recentProjects = [...allProjects]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5); // Show only top 5
    
    // Create navigation links for each project
    recentProjects.forEach(project => {
        const projectLink = document.createElement('a');
        projectLink.href = `project-details.html?id=${project.id}`;
        projectLink.className = 'nav-item';
        
        // Create status icon based on project status
        const statusIcon = document.createElement('i');
        const status = (project.status || 'not started').toLowerCase();
        
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
        statusIcon.style.color = `var(--status-${getStatusClass(project.status || 'not started')})`;
        
        // Project name
        const projectName = document.createTextNode(project.name || 'Unnamed Project');
        
        // Assemble the link
        projectLink.appendChild(statusIcon);
        projectLink.appendChild(projectName);
        
        recentProjectsNavElement.appendChild(projectLink);
    });
}

function setupUserDropdown(userInfoElement) {
    // Remove any existing dropdown menu
    const existingMenu = document.getElementById('user-dropdown-menu');
    if (existingMenu) existingMenu.remove();
    
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile) return;
    
    // Create dropdown menu
    const userMenu = document.createElement('div');
    userMenu.id = 'user-dropdown-menu';
    userMenu.className = 'user-menu';
    userMenu.style.display = 'none';
    
    // Menu items
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

// --------------------------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------------------------
function getTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate - now;
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    
    return {
        days: Math.abs(daysRemaining),
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

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// --------------------------------------------------------------------------
// AUTHENTICATION FUNCTIONS
// --------------------------------------------------------------------------
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