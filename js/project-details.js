/**
 * PROJECT DETAILS CONTROLLER
 * 
 * This file manages all functionality for the project details page, including:
 * - Project information display
 * - Task management (create, edit, delete)
 * - Progress tracking
 * - Status updates
 */

// --------------------------------------------------------------------------
// DOM ELEMENT REFERENCES
// --------------------------------------------------------------------------
const projectTitleElement = document.getElementById('project-title');
const projectTitleBreadcrumb = document.getElementById('project-title-breadcrumb');
const projectStatusElement = document.getElementById('project-status-badge');
const projectDurationElement = document.getElementById('project-duration');
const timeRemainingElement = document.getElementById('time-remaining');
const projectTeamElement = document.getElementById('project-team');
const progressPercentageElement = document.getElementById('progress-percentage');
const progressFillElement = document.getElementById('progress-fill');
const completedTasksElement = document.getElementById('completed-tasks');
const pendingTasksElement = document.getElementById('pending-tasks');
const totalTasksElement = document.getElementById('total-tasks');
const projectDescriptionElement = document.getElementById('project-description');
const tasksContainer = document.getElementById('tasks-container');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const closeTaskModalBtn = document.getElementById('close-task-modal');
const cancelTaskBtn = document.getElementById('cancel-task');
const saveTaskBtn = document.getElementById('save-task');
const taskModalTitle = document.getElementById('task-modal-title');
const taskNameInput = document.getElementById('task-name');
const taskDescriptionInput = document.getElementById('task-description');
const taskDueDateInput = document.getElementById('task-due-date');
const taskPriorityInput = document.getElementById('task-priority');
const taskAssigneeInput = document.getElementById('task-assignee');
const taskFilterSelect = document.getElementById('task-filter');
const taskSearchInput = document.getElementById('task-search');
const editProjectBtn = document.getElementById('edit-project-btn');
const deleteProjectBtn = document.getElementById('delete-project-btn');

// --------------------------------------------------------------------------
// APPLICATION STATE
// --------------------------------------------------------------------------
let projectDetailUser = null;  // Current logged-in user
let currentProject = null;     // Currently displayed project
let editingTaskId = null;      // ID of task being edited, null if creating new
let currentProjectId = null;   // ID of current project, extracted from URL

// --------------------------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Redirect to login if not authenticated
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get current user information
    projectDetailUser = getCurrentUser();
    
    // Extract project ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('id');
    
    // Redirect to projects list if no ID provided
    if (!currentProjectId) {
        window.location.href = 'projects.html';
        return;
    }

    // Load project data and initialize UI
    loadProject();
    
    if (currentProject) {
        setupEventListeners();
        updateUserInfo();
        setupSidebarNavigation();
    } else {
        console.error("Failed to load project data");
    }
});

// --------------------------------------------------------------------------
// EVENT HANDLERS
// --------------------------------------------------------------------------
function setupEventListeners() {
    // Task management events
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            openTaskModal();
        });
    }
    
    if (closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
    if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);
    
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTask();
        });
    }
    
    // Task filtering
    if (taskFilterSelect) taskFilterSelect.addEventListener('change', filterTasks);
    if (taskSearchInput) taskSearchInput.addEventListener('input', filterTasks);
    
    // Project management
    if (editProjectBtn) {
        editProjectBtn.addEventListener('click', function() {
            openEditProjectModal();
        });
    }
    
    if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener('click', deleteProject);
    }
    
    // Modal behavior - close when clicking outside
    window.addEventListener('click', function(e) {
        if (taskModal && e.target === taskModal) {
            closeTaskModal();
        }
        
        const projectModal = document.getElementById('project-modal');
        if (projectModal && e.target === projectModal) {
            projectModal.style.display = 'none';
        }
    });
    
    // Mobile sidebar toggle
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.toggle('open');
        });
    }
}

function setupSidebarNavigation() {
    // Configure sidebar navigation links
    const navLinks = {
        'dashboard': 'dashboard.html',
        'projects': 'projects.html',
        'calendar': 'calendar.html',
        'team': 'team.html'
    };
    
    // Add click handlers for navigation links
    Object.entries(navLinks).forEach(([id, url]) => {
        const link = document.querySelector(`a[href="${url}"]`);
        if (link) {
            link.addEventListener('click', function() {
                window.location.href = url;
            });
        }
    });
    
    // New project button
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'projects.html?new=true';
        });
    }
}

// --------------------------------------------------------------------------
// PROJECT MANAGEMENT
// --------------------------------------------------------------------------
function loadProject() {
    // Get all projects from localStorage
    const projectsKey = `orangeAcademyProjects_${projectDetailUser.userId}`;
    const projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
    
    // Find the requested project
    currentProject = projects.find(p => p.id === currentProjectId);
    
    if (!currentProject) {
        alert('Project not found');
        window.location.href = 'projects.html';
        return;
    }
    
    // Ensure tasks array exists
    if (!currentProject.tasks) currentProject.tasks = [];
    
    // Set page title with project name
    document.title = `${currentProject.name} - Orange Project Manager`;
    
    // Update UI components
    updateProjectUI();
}

function updateProjectUI() {
    // Update project title elements
    if (projectTitleElement) projectTitleElement.textContent = currentProject.name;
    if (projectTitleBreadcrumb) projectTitleBreadcrumb.textContent = currentProject.name;
    
    // Update status badge
    if (projectStatusElement) {
        const currentStatus = currentProject.status || 'not started';
        projectStatusElement.textContent = capitalizeFirstLetter(currentStatus);
        const statusClass = getStatusClass(currentStatus);
        projectStatusElement.className = `status-badge status-${statusClass}`;
    }
    
    // Update project timeline information
    if (projectDurationElement) {
        const startDate = formatDate(new Date(currentProject.startDate));
        const endDate = formatDate(new Date(currentProject.deadline));
        projectDurationElement.textContent = `${startDate} - ${endDate}`;
    }
    
    // Update time remaining indicator
    if (timeRemainingElement) {
        const timeRemaining = getTimeRemaining(currentProject.deadline);
        if (timeRemaining.overdue) {
            timeRemainingElement.textContent = `Overdue by ${Math.abs(timeRemaining.days)} days`;
            timeRemainingElement.classList.add('overdue');
        } else {
            timeRemainingElement.textContent = `${timeRemaining.days} days left`;
            if (timeRemaining.days <= 7) timeRemainingElement.classList.add('urgent');
        }
    }
    
    // Update team members
    if (projectTeamElement) {
        projectTeamElement.innerHTML = 'Team functionality temporarily disabled';
    }
    
    // Update project description
    if (projectDescriptionElement) {
        projectDescriptionElement.textContent = currentProject.description || 'No description provided';
    }
    
    // Update progress visualization and task counts
    updateProgressIndicators();
    
    // Render task list
    renderTasks();
    
    // Update page title to show project and status
    document.title = `${currentProject.name} (${capitalizeFirstLetter(currentProject.status)}) - Orange Project Manager`;
}

function saveProject() {
    // Validate required data
    if (!projectDetailUser || !projectDetailUser.userId || !currentProject || !currentProject.id) {
        console.error("Cannot save project: Missing user or project information");
        return;
    }

    // Get all projects
    const projectsKey = `orangeAcademyProjects_${projectDetailUser.userId}`;
    const projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
    
    // Find this project in the array
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    
    if (projectIndex !== -1) {
        // Update project in array
        projects[projectIndex] = {
            ...currentProject,
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem(projectsKey, JSON.stringify(projects));
    } else {
        console.error(`Project with ID ${currentProject.id} not found in storage`);
    }
}

function openEditProjectModal() {
    // Get project modal
    const projectModal = document.getElementById('project-modal');
    if (!projectModal) return;
    
    // Ensure currentProject exists
    if (!currentProject) return;
    
    // Fill in project form with current values
    const projectNameInput = document.getElementById('project-name');
    const projectDescInput = document.getElementById('project-description');
    const projectStartDateInput = document.getElementById('project-start-date');
    const projectDeadlineInput = document.getElementById('project-deadline');
    const projectStatusInput = document.getElementById('project-status');
    
    if (projectNameInput) projectNameInput.value = currentProject.name || '';
    if (projectDescInput) projectDescInput.value = currentProject.description || '';
    if (projectStartDateInput) projectStartDateInput.value = currentProject.startDate || '';
    if (projectDeadlineInput) projectDeadlineInput.value = currentProject.deadline || '';
    
    // Set dropdown to current status
    if (projectStatusInput) {
        projectStatusInput.value = currentProject.status || 'not started';
    }
    
    // Team selection (disabled in this version)
    const teamSelectionDiv = document.getElementById('team-selection');
    if (teamSelectionDiv) {
        teamSelectionDiv.innerHTML = '<p>Team member selection is temporarily disabled</p>';
    }
    
    // Update modal title and save button
    const modalTitle = document.getElementById('modal-title');
    const saveButton = document.getElementById('save-project');
    
    if (modalTitle) modalTitle.textContent = 'Edit Project';
    if (saveButton) saveButton.textContent = 'Save Changes';
    
    // Show modal
    projectModal.style.display = 'block';
    
    // Reset event listeners to prevent duplicates
    
    // 1. Close button
    const closeProjectModalBtn = document.getElementById('close-project-modal');
    if (closeProjectModalBtn) {
        const newCloseBtn = closeProjectModalBtn.cloneNode(true);
        closeProjectModalBtn.parentNode.replaceChild(newCloseBtn, closeProjectModalBtn);
        
        newCloseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            projectModal.style.display = 'none';
        });
    }
    
    // 2. Cancel button
    const cancelProjectBtn = document.getElementById('cancel-project');
    if (cancelProjectBtn) {
        const newCancelBtn = cancelProjectBtn.cloneNode(true);
        cancelProjectBtn.parentNode.replaceChild(newCancelBtn, cancelProjectBtn);
        
        newCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            projectModal.style.display = 'none';
        });
    }
    
    // 3. Form submission
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        const newForm = projectForm.cloneNode(true);
        projectForm.parentNode.replaceChild(newForm, projectForm);
        
        // Reattach event listeners to buttons in the cloned form
        const newCloseBtn = newForm.querySelector('#close-project-modal');
        const newCancelBtn = newForm.querySelector('#cancel-project');
        
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', function() {
                projectModal.style.display = 'none';
            });
        }
        
        if (newCancelBtn) {
            newCancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                projectModal.style.display = 'none';
            });
        }
        
        // Add submit event listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProjectChanges();
        });
    }
}

function saveProjectChanges() {
    // Get form input values
    const projectNameInput = document.getElementById('project-name');
    const projectDescInput = document.getElementById('project-description');
    const projectStartDateInput = document.getElementById('project-start-date');
    const projectDeadlineInput = document.getElementById('project-deadline');
    const statusDropdown = document.getElementById('project-status');
    
    // Validate required fields
    if (!projectNameInput || !projectNameInput.value.trim()) {
        alert('Project name is required');
        return;
    }
    
    if (!projectStartDateInput || !projectStartDateInput.value) {
        alert('Start date is required');
        return;
    }
    
    if (!projectDeadlineInput || !projectDeadlineInput.value) {
        alert('Deadline is required');
        return;
    }
    
    // Get status from dropdown
    let selectedStatus = 'not started'; // Default
    if (statusDropdown && statusDropdown.tagName === 'SELECT') {
        selectedStatus = statusDropdown.value;
    }
    
    // Keep the existing team
    const currentTeam = currentProject.team || [];
    
    // Create a clean copy of the project with updates
    const updatedProject = JSON.parse(JSON.stringify(currentProject));
    updatedProject.name = projectNameInput.value.trim();
    updatedProject.description = projectDescInput ? projectDescInput.value.trim() : '';
    updatedProject.startDate = projectStartDateInput.value;
    updatedProject.deadline = projectDeadlineInput.value;
    updatedProject.status = selectedStatus;
    updatedProject.team = currentTeam;
    updatedProject.updatedAt = new Date().toISOString();
    
    // Replace current project with updated version
    currentProject = updatedProject;
    
    // Save project to localStorage
    saveProject();
    
    // Update status badge immediately
    if (projectStatusElement) {
        projectStatusElement.textContent = capitalizeFirstLetter(selectedStatus);
        const statusClass = getStatusClass(selectedStatus);
        projectStatusElement.className = `status-badge status-${statusClass}`;
    }
    
    // Refresh entire UI
    updateProjectUI();
    
    // Hide modal
    const projectModal = document.getElementById('project-modal');
    if (projectModal) {
        projectModal.style.display = 'none';
    }
}

function deleteProject() {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        // Get projects from localStorage
        const projectsKey = `orangeAcademyProjects_${projectDetailUser.userId}`;
        const projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
        
        // Filter out the current project
        const updatedProjects = projects.filter(p => p.id !== currentProject.id);
        
        // Save updated list to localStorage
        localStorage.setItem(projectsKey, JSON.stringify(updatedProjects));
        
        // Return to projects list
        window.location.href = 'projects.html';
    }
}

// --------------------------------------------------------------------------
// TASK MANAGEMENT
// --------------------------------------------------------------------------
function openTaskModal(taskId = null) {
    if (!taskModal || !taskForm) return;

    // Reset form to default values
    taskForm.reset();
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    taskDueDateInput.value = tomorrow.toISOString().split('T')[0];
    
    // Check if editing existing task or creating new
    if (taskId) {
        editingTaskId = taskId;
        taskModalTitle.textContent = 'Edit Task';
        
        // Find and populate form with task data
        const task = currentProject.tasks.find(t => t.id === taskId);
        if (task) {
            taskNameInput.value = task.name;
            taskDescriptionInput.value = task.description || '';
            taskDueDateInput.value = task.dueDate;
            taskPriorityInput.value = task.priority;
        }
    } else {
        editingTaskId = null;
        taskModalTitle.textContent = 'Add New Task';
    }
    
    // Display the modal
    taskModal.style.display = 'block';
}

function closeTaskModal() {
    // Hide modal and reset editing state
    if (taskModal) {
        taskModal.style.display = 'none';
    }
    editingTaskId = null;
}

function saveTask() {
    // Get form data
    const name = taskNameInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const dueDate = taskDueDateInput.value;
    const priority = taskPriorityInput.value;
    
    // Validate required fields
    if (!name || !dueDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (editingTaskId) {
        // Update existing task
        const taskIndex = currentProject.tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            currentProject.tasks[taskIndex] = {
                ...currentProject.tasks[taskIndex],
                name,
                description,
                dueDate,
                priority,
                assignee: '',
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create new task
        const newTask = {
            id: Date.now().toString(),
            name,
            description,
            dueDate,
            priority,
            assignee: '',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Initialize tasks array if needed
        if (!currentProject.tasks) {
            currentProject.tasks = [];
        }
        
        currentProject.tasks.push(newTask);
    }
    
    // Save project with updated tasks
    saveProject();
    closeTaskModal();
    
    // Update UI components
    updateProgressIndicators();
    renderTasks();
}

function renderTasks() {
    if (!tasksContainer) return;
    
    tasksContainer.innerHTML = '';
    
    // Show empty state if no tasks
    if (!currentProject.tasks || currentProject.tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-tasks">
                <i class="fas fa-tasks"></i>
                <p>No tasks yet. Add your first task to get started.</p>
            </div>
        `;
        return;
    }
    
    // Create a working copy of tasks
    let tasksToRender = [...currentProject.tasks];
    
    // Apply filtering
    const filterValue = taskFilterSelect ? taskFilterSelect.value : 'all';
    const searchTerm = taskSearchInput ? taskSearchInput.value.toLowerCase().trim() : '';
    
    if (filterValue === 'completed') {
        tasksToRender = tasksToRender.filter(task => task.completed);
    } else if (filterValue === 'pending') {
        tasksToRender = tasksToRender.filter(task => !task.completed);
    }
    
    if (searchTerm) {
        tasksToRender = tasksToRender.filter(task => 
            task.name.toLowerCase().includes(searchTerm) || 
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort tasks: incomplete first, then by due date
    tasksToRender.sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    // Render each task
    tasksToRender.forEach(task => {
        const taskCard = createTaskCard(task);
        tasksContainer.appendChild(taskCard);
    });
    
    // Show 'no results' message if filtered to empty
    if (tasksToRender.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-tasks">
                <i class="fas fa-filter"></i>
                <p>No tasks found matching your filters.</p>
            </div>
        `;
    }
}

function createTaskCard(task) {
    // Create task card container
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.id = task.id;
    
    // Check if task is overdue
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = !task.completed && dueDate < now;
    
    // Build task card HTML
    taskCard.innerHTML = `
        <div class="task-header">
            <div class="task-title">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-name">${task.name}</span>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="task-details">
            <div class="task-description">${task.description || 'No description provided'}</div>
            <div class="task-meta">
                <div class="task-meta-item ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(dueDate)}</span>
                </div>
                <div class="task-meta-item priority-${task.priority}">
                    <i class="fas fa-flag"></i>
                    <span>${capitalizeFirstLetter(task.priority)} Priority</span>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners to interactive elements
    
    // Task completion toggle
    const taskCheckbox = taskCard.querySelector('.task-checkbox');
    taskCheckbox.addEventListener('change', function() {
        toggleTaskCompletion(task.id, this.checked);
    });
    
    // Edit button
    const editBtn = taskCard.querySelector('.task-btn.edit');
    editBtn.addEventListener('click', () => openTaskModal(task.id));
    
    // Delete button
    const deleteBtn = taskCard.querySelector('.task-btn.delete');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return taskCard;
}

function toggleTaskCompletion(taskId, completed) {
    // Find task in project
    const taskIndex = currentProject.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    // Update completion status
    currentProject.tasks[taskIndex].completed = completed;
    
    // Track completion time
    if (completed) {
        currentProject.tasks[taskIndex].completedAt = new Date().toISOString();
    } else {
        delete currentProject.tasks[taskIndex].completedAt;
    }
    
    // Save changes and update UI
    saveProject();
    updateProgressIndicators();
    renderTasks();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Remove task from project
        currentProject.tasks = currentProject.tasks.filter(task => task.id !== taskId);
        
        // Save changes and update UI
        saveProject();
        updateProgressIndicators();
        renderTasks();
    }
}

function filterTasks() {
    // Re-render tasks with current filter settings
    renderTasks();
}

// --------------------------------------------------------------------------
// PROGRESS TRACKING
// --------------------------------------------------------------------------
function updateProgressIndicators() {
    // Calculate task completion statistics
    let completedCount = 0;
    let totalCount = 0;
    
    if (currentProject.tasks && currentProject.tasks.length > 0) {
        totalCount = currentProject.tasks.length;
        completedCount = currentProject.tasks.filter(task => task.completed).length;
    }
    
    // Calculate progress percentage
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const pendingCount = totalCount - completedCount;
    
    // Auto-update project status based on progress
    if (totalCount > 0) {
        const oldStatus = currentProject.status;
        
        // If all tasks complete, set to completed
        if (progressPercentage === 100 && currentProject.status !== 'completed') {
            currentProject.status = 'completed';
            
            // Update the status badge in the UI
            if (projectStatusElement) {
                projectStatusElement.textContent = capitalizeFirstLetter(currentProject.status);
                const statusClass = getStatusClass(currentProject.status);
                projectStatusElement.className = `status-badge status-${statusClass}`;
            }
            
            saveProject();
        } 
        // If any tasks incomplete but status is completed, revert to in progress
        else if (progressPercentage < 100 && currentProject.status === 'completed') {
            currentProject.status = 'in progress';
            
            // Update the status badge in the UI
            if (projectStatusElement) {
                projectStatusElement.textContent = capitalizeFirstLetter(currentProject.status);
                const statusClass = getStatusClass(currentProject.status);
                projectStatusElement.className = `status-badge status-${statusClass}`;
            }
            
            saveProject();
        }
    }
    
    // Update progress visualization
    if (progressPercentageElement) {
        progressPercentageElement.textContent = `${progressPercentage}%`;
    }
    
    if (progressFillElement) {
        progressFillElement.style.width = `${progressPercentage}%`;
        
        // Change color based on completion level
        if (progressPercentage === 100) {
            progressFillElement.style.backgroundColor = 'var(--status-completed)';
        } else if (progressPercentage >= 75) {
            progressFillElement.style.backgroundColor = 'var(--accent-blue)';
        } else if (progressPercentage >= 50) {
            progressFillElement.style.backgroundColor = 'var(--accent-orange)';
        } else if (progressPercentage >= 25) {
            progressFillElement.style.backgroundColor = 'var(--status-hold)';
        } else {
            progressFillElement.style.backgroundColor = 'var(--status-progress)';
        }
    }
    
    // Update task counters
    if (completedTasksElement) completedTasksElement.textContent = completedCount;
    if (pendingTasksElement) pendingTasksElement.textContent = pendingCount;
    if (totalTasksElement) totalTasksElement.textContent = totalCount;
    
    // Update document title to reflect project status
    document.title = `${currentProject.name} (${capitalizeFirstLetter(currentProject.status)}) - Orange Project Manager`;
}

// --------------------------------------------------------------------------
// USER INTERFACE UTILITIES
// --------------------------------------------------------------------------
function updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    if (!userInfoElement || !projectDetailUser) return;
    
    // Create user avatar initials
    const nameParts = projectDetailUser.fullname.split(' ');
    const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
        : nameParts[0].substring(0, 2).toUpperCase();
    
    // Update user display in sidebar
    userInfoElement.innerHTML = `
        <div class="user-avatar">${initials}</div>
        <div class="user-details">
            <div class="user-name">${projectDetailUser.fullname}</div>
            <div class="user-email">${projectDetailUser.email}</div>
        </div>
        <div class="user-dropdown">
            <i class="fas fa-chevron-down"></i>
        </div>
    `;
    
    setupUserDropdown(userInfoElement);
}

function setupUserDropdown(userInfoElement) {
    // Remove any existing dropdown
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
            logoutUser();
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
// AUTHENTICATION
// --------------------------------------------------------------------------
function logoutUser() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('orangeAcademySession');
        
        // Add fade-out transition
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

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

// --------------------------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------------------------
function getStatusClass(status) {
    if (!status) return 'not-started';
    
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
        case 'not started': return 'not-started';
        case 'in progress': return 'progress';
        case 'on hold': return 'hold';
        case 'completed': return 'completed';
        case 'cancelled': return 'cancelled';
        default: return 'not-started';
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

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}