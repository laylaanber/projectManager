// ==============================================
// PROJECTS CONTROLLER
// ==============================================

// DOM Elements
const projectsList = document.getElementById('projects-list');
const noProjectsMessage = document.getElementById('no-projects');
const newProjectBtn = document.getElementById('new-project-btn');
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

// Application State
let currentUser = null;
let projects = [];
let teamMembers = [];
let editingProjectId = null;

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
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Load projects
    loadProjects();
    
    // Load team members
    loadTeamMembers();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update navigation with user info
    updateUserUI();
});

// ==============================================
// EVENT LISTENERS
// ==============================================
function setupEventListeners() {
    // New project button
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => openProjectModal());
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
}

function renderProjects() {
    if (!projectsList) return;
    
    // Clear projects list
    projectsList.innerHTML = '';
    
    // Show or hide "no projects" message
    if (projects.length === 0) {
        if (noProjectsMessage) {
            noProjectsMessage.style.display = 'block';
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
            project.description.toLowerCase().includes(searchTerm)
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
                case 'deadline-asc':
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'deadline-desc':
                    return new Date(b.deadline) - new Date(a.deadline);
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'recent':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                default:
                    return 0;
            }
        });
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
    card.className = 'project-card';
    card.dataset.id = project.id;
    
    // Get status class for styling
    const statusClass = getStatusClass(project.status);
    
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
    const teamMembers = project.team ? project.team.map(memberId => {
        const member = getTeamMember(memberId);
        return member ? member.name : 'Unknown';
    }).join(', ') : 'No team assigned';
    
    // Build HTML
    card.innerHTML = `
        <div class="project-header ${statusClass}">
            <h3 class="project-title">${project.name}</h3>
            <span class="project-status">${project.status}</span>
        </div>
        <div class="project-body">
            <p class="project-description">${project.description}</p>
            
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
                    <span class="detail-value ${timeRemaining.urgent ? 'urgent' : ''}">${deadline}</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label"><i class="fas fa-users"></i> Team:</span>
                    <span class="detail-value team-members">${teamMembers}</span>
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
    switch(status.toLowerCase()) {
        case 'not started':
            return 'status-not-started';
        case 'in progress':
            return 'status-progress';
        case 'on hold':
            return 'status-hold';
        case 'completed':
            return 'status-completed';
        case 'cancelled':
            return 'status-cancelled';
        default:
            return '';
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
            projectDescription.value = project.description;
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
    
    // Populate team selection in project form
    populateTeamSelection();
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

function updateUserUI() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update the navigation with user info
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Check if user info already exists
    if (!navLinks.querySelector('.user-info')) {
        // Add user info link
        const userInfoLink = document.createElement('a');
        userInfoLink.href = '#';
        userInfoLink.className = 'user-info';
        userInfoLink.innerHTML = `<i class="fas fa-user"></i> ${user.fullname}`;
        navLinks.appendChild(userInfoLink);
        
        // Add logout link
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        navLinks.appendChild(logoutLink);
    }
}

function logout() {
    localStorage.removeItem('orangeAcademySession');
    window.location.href = 'login.html';
}

// ==============================================
// MOBILE NAVIGATION
// ==============================================
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            
            // Animate hamburger
            const spans = menuToggle.querySelectorAll('span');
            if (spans.length >= 3) {
                spans[0].classList.toggle('rotate-down');
                spans[1].classList.toggle('fade-out');
                spans[2].classList.toggle('rotate-up');
            }
        });
    }
}