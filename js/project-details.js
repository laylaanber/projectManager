/**
 * Project Details Controller
 * Handles all functionality for the project details page
 */

// DOM Elements
const projectTitleElement = document.getElementById('project-title');
const projectTitleBreadcrumb = document.getElementById('project-title-breadcrumb');
const projectStatusElement = document.getElementById('project-status');
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

// Application State - Using different variable names to avoid conflicts
let projectDetailUser = null;
let currentProject = null;
let editingTaskId = null;
let currentProjectId = null;

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
    projectDetailUser = getCurrentUser();
    
    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('id');
    
    if (!currentProjectId) {
        // No project ID provided, redirect to projects list
        window.location.href = 'projects.html';
        return;
    }

    // Load project data
    loadProject();
    
    // Only after project is loaded, continue with the rest
    if (currentProject) {
        // Set up event listeners
        setupEventListeners();
        
        // Update UI with user info
        updateUserInfo();
        
        // Set up sidebar navigation
        setupSidebarNavigation();
    } else {
        console.error("Failed to load project data");
    }
});

// ==============================================
// EVENT LISTENERS
// ==============================================
function setupEventListeners() {
    // Add task button
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            openTaskModal();
        });
    }
    
    // Close task modal
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', closeTaskModal);
    }
    
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', closeTaskModal);
    }
    
    // Save task form
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTask();
        });
    }
    
    // Filter tasks
    if (taskFilterSelect) {
        taskFilterSelect.addEventListener('change', filterTasks);
    }
    
    // Search tasks
    if (taskSearchInput) {
        taskSearchInput.addEventListener('input', filterTasks);
    }
    
    // Edit project button
    if (editProjectBtn) {
        editProjectBtn.addEventListener('click', function() {
            openEditProjectModal();
        });
    }
    
    // Delete project button
    if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener('click', deleteProject);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (taskModal && e.target === taskModal) {
            closeTaskModal();
        }
        
        const projectModal = document.getElementById('project-modal');
        if (projectModal && e.target === projectModal) {
            projectModal.style.display = 'none';
        }
    });
    
    // Toggle sidebar on mobile
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('open');
            }
        });
    }
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
    
    // New project button in sidebar
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'projects.html?new=true';
        });
    }
}

// ==============================================
// PROJECT FUNCTIONS
// ==============================================
function loadProject() {
    // Get projects from localStorage
    const projectsKey = `orangeAcademyProjects_${projectDetailUser.userId}`;
    const projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
    
    // Find the current project
    currentProject = projects.find(p => p.id === currentProjectId);
    
    if (!currentProject) {
        // Project not found, redirect to projects list
        alert('Project not found');
        window.location.href = 'projects.html';
        return;
    }
    
    // Initialize tasks array if it doesn't exist
    if (!currentProject.tasks) {
        currentProject.tasks = [];
    }
    
    // Update page title
    document.title = `${currentProject.name} - Orange Project Manager`;
    
    // Update UI with project data
    updateProjectUI();
}

function updateProjectUI() {
    // Set project title
    if (projectTitleElement) {
        projectTitleElement.textContent = currentProject.name;
    }
    
    if (projectTitleBreadcrumb) {
        projectTitleBreadcrumb.textContent = currentProject.name;
    }
    
    // Set project status - Add more debugging
    if (projectStatusElement) {
        console.log("Current project status in updateProjectUI:", currentProject.status);
        projectStatusElement.textContent = capitalizeFirstLetter(currentProject.status);
        const statusClass = getStatusClass(currentProject.status);
        console.log("Getting status class for:", currentProject.status, "result:", statusClass);
        projectStatusElement.className = `status-badge status-${statusClass}`;
        console.log("Applied status class:", statusClass);
    }
    
    // Set project duration
    if (projectDurationElement) {
        const startDate = formatDate(new Date(currentProject.startDate));
        const endDate = formatDate(new Date(currentProject.deadline));
        projectDurationElement.textContent = `${startDate} - ${endDate}`;
    }
    
    // Set time remaining
    if (timeRemainingElement) {
        const timeRemaining = getTimeRemaining(currentProject.deadline);
        if (timeRemaining.overdue) {
            timeRemainingElement.textContent = `Overdue by ${Math.abs(timeRemaining.days)} days`;
            timeRemainingElement.classList.add('overdue');
        } else {
            timeRemainingElement.textContent = `${timeRemaining.days} days left`;
            if (timeRemaining.days <= 7) {
                timeRemainingElement.classList.add('urgent');
            }
        }
    }
    
    // Set project team - simplified approach
    if (projectTeamElement) {
        projectTeamElement.innerHTML = 'Team functionality temporarily disabled';
    }
    
    // Set project description
    if (projectDescriptionElement) {
        projectDescriptionElement.textContent = currentProject.description || 'No description provided';
    }
    
    // Update progress indicators
    updateProgressIndicators();
    
    // Render tasks
    renderTasks();
    
    // Update document title to reflect status changes
    document.title = `${currentProject.name} (${capitalizeFirstLetter(currentProject.status)}) - Orange Project Manager`;
}

// ==============================================
// TASK FUNCTIONS
// ==============================================
function openTaskModal(taskId = null) {
    if (!taskModal || !taskForm) return;

    // Reset form
    taskForm.reset();
    
    // Set default due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    taskDueDateInput.value = tomorrow.toISOString().split('T')[0];
    
    // Check if editing existing task
    if (taskId) {
        editingTaskId = taskId;
        taskModalTitle.textContent = 'Edit Task';
        
        // Find task
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
    
    // Show modal
    taskModal.style.display = 'block';
}

function closeTaskModal() {
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
    const assignee = ''; // No assignee for now
    
    // Validate input
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
                assignee,
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
            assignee,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Initialize tasks array if it doesn't exist
        if (!currentProject.tasks) {
            currentProject.tasks = [];
        }
        
        currentProject.tasks.push(newTask);
    }
    
    // Save project and update UI
    saveProject();
    closeTaskModal();
    updateProgressIndicators();
    renderTasks();
}

function renderTasks() {
    if (!tasksContainer) return;
    
    tasksContainer.innerHTML = '';
    
    // If no tasks, show empty state
    if (!currentProject.tasks || currentProject.tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-tasks">
                <i class="fas fa-tasks"></i>
                <p>No tasks yet. Add your first task to get started.</p>
            </div>
        `;
        return;
    }
    
    // Clone tasks array to avoid modifying the original
    let tasksToRender = [...currentProject.tasks];
    
    // Apply filters
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
    
    // Sort tasks: completed at the bottom, then by due date (earliest first)
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
    
    // If filtered results are empty
    if (tasksToRender.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-tasks">
                <i class="fas fa-filter"></i>
                <p>No tasks found matching your filters.</p>
            </div>
        `;
    }
}

// Include all the other necessary functions from your code...

// Utility functions to avoid conflicts with obsidian.js
function updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    if (!userInfoElement || !projectDetailUser) return;
    
    // Create initials from user's name
    const nameParts = projectDetailUser.fullname.split(' ');
    const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
        : nameParts[0].substring(0, 2).toUpperCase();
    
    // Update user info in sidebar
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

function logoutUser() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('orangeAcademySession');
        
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

// Add all the missing function implementations...

// Add these functions at the end of the file

function createTaskCard(task) {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.id = task.id;
    
    // Get assignee name if available - simplified
    let assigneeName = 'Unassigned';
    
    // Check if task is overdue
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = !task.completed && dueDate < now;
    
    // Create task card HTML
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
    
    // Task checkbox event
    const taskCheckbox = taskCard.querySelector('.task-checkbox');
    taskCheckbox.addEventListener('change', function() {
        toggleTaskCompletion(task.id, this.checked);
    });
    
    // Edit button event
    const editBtn = taskCard.querySelector('.task-btn.edit');
    editBtn.addEventListener('click', () => openTaskModal(task.id));
    
    // Delete button event
    const deleteBtn = taskCard.querySelector('.task-btn.delete');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return taskCard;
}

function toggleTaskCompletion(taskId, completed) {
    // Find task index
    const taskIndex = currentProject.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    // Update task completion status
    currentProject.tasks[taskIndex].completed = completed;
    
    // If task is completed, update completion timestamp
    if (completed) {
        currentProject.tasks[taskIndex].completedAt = new Date().toISOString();
    } else {
        delete currentProject.tasks[taskIndex].completedAt;
    }
    
    // Save project
    saveProject();
    
    // Update UI
    updateProgressIndicators();
    renderTasks();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Remove task from project
        currentProject.tasks = currentProject.tasks.filter(task => task.id !== taskId);
        
        // Save project and update UI
        saveProject();
        updateProgressIndicators();
        renderTasks();
    }
}

function filterTasks() {
    renderTasks();
}

function saveProject() {
    if (!projectDetailUser || !projectDetailUser.userId || !currentProject || !currentProject.id) {
        console.error("Cannot save project: Missing user or project information");
        return;
    }

    // Get projects from localStorage
    const projectsKey = `orangeAcademyProjects_${projectDetailUser.userId}`;
    const projects = JSON.parse(localStorage.getItem(projectsKey)) || [];
    
    // Find project index
    const projectIndex = projects.findIndex(p => p.id === currentProject.id);
    
    if (projectIndex !== -1) {
        // Update project in array
        projects[projectIndex] = {
            ...currentProject,
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem(projectsKey, JSON.stringify(projects));
        
        // Log success for debugging
        console.log(`Project "${currentProject.name}" saved successfully with status "${currentProject.status}"`);
    } else {
        console.error(`Project with ID ${currentProject.id} not found in storage`);
    }
}

function updateProgressIndicators() {
    let completedCount = 0;
    let totalCount = 0;
    
    if (currentProject.tasks && currentProject.tasks.length > 0) {
        totalCount = currentProject.tasks.length;
        completedCount = currentProject.tasks.filter(task => task.completed).length;
    }
    
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const pendingCount = totalCount - completedCount;
    
    // Update UI elements
    if (progressPercentageElement) {
        progressPercentageElement.textContent = `${progressPercentage}%`;
    }
    
    if (progressFillElement) {
        progressFillElement.style.width = `${progressPercentage}%`;
        
        // Change color based on completion
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
    
    if (completedTasksElement) {
        completedTasksElement.textContent = completedCount;
    }
    
    if (pendingTasksElement) {
        pendingTasksElement.textContent = pendingCount;
    }
    
    if (totalTasksElement) {
        totalTasksElement.textContent = totalCount;
    }
}

function openEditProjectModal() {
    // Get project modal
    const projectModal = document.getElementById('project-modal');
    if (!projectModal) {
        console.error("Project modal element not found");
        return;
    }
    
    // Make sure currentProject exists
    if (!currentProject) {
        console.error("No project loaded to edit");
        return;
    }
    
    // Fill in project details
    const projectNameInput = document.getElementById('project-name');
    const projectDescInput = document.getElementById('project-description');
    const projectStartDateInput = document.getElementById('project-start-date');
    const projectDeadlineInput = document.getElementById('project-deadline');
    
    // Use let instead of const for projectStatusInput so we can reassign it if needed
    let projectStatusInput = document.getElementById('project-status');
    
    if (projectNameInput) projectNameInput.value = currentProject.name || '';
    if (projectDescInput) projectDescInput.value = currentProject.description || '';
    if (projectStartDateInput) projectStartDateInput.value = currentProject.startDate || '';
    if (projectDeadlineInput) projectDeadlineInput.value = currentProject.deadline || '';
    
    console.log("Current project status before setting dropdown:", currentProject.status);
    
    // Set the current status in the dropdown
    if (projectStatusInput) {
        // Directly verify the dropdown element
        console.log("Dropdown element found:", !!projectStatusInput);
        console.log("Dropdown options count:", projectStatusInput.options ? projectStatusInput.options.length : "no options");
        
        // First ensure the status dropdown has all required options
        const statusOptions = ['not started', 'in progress', 'on hold', 'completed', 'cancelled'];
        
        // Check if we need to recreate the dropdown
        let needToRecreate = false;
        
        if (!projectStatusInput.options || projectStatusInput.options.length === 0) {
            needToRecreate = true;
            console.log("Need to recreate dropdown because no options found");
        }
        
        if (needToRecreate) {
            // Create a new select element
            const newStatusInput = document.createElement('select');
            newStatusInput.id = 'project-status';
            newStatusInput.name = 'project-status'; // Add name attribute
            
            // Add the options
            statusOptions.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = capitalizeFirstLetter(status);
                newStatusInput.appendChild(option);
            });
            
            // Replace the old dropdown
            if (projectStatusInput.parentNode) {
                projectStatusInput.parentNode.replaceChild(newStatusInput, projectStatusInput);
                projectStatusInput = newStatusInput;
                console.log("Dropdown recreated with options:", statusOptions.length);
            }
        }
        
        // Set the selected status - make sure this happens AFTER recreating if needed
        console.log("Setting dropdown to:", currentProject.status || 'not started');
        projectStatusInput.value = currentProject.status || 'not started';
        
        // Verify the dropdown value was actually set
        console.log("Dropdown value after setting:", projectStatusInput.value);
        
        // Add specific change event listener to track the value
        projectStatusInput.addEventListener('change', function() {
            console.log("Status changed to:", this.value);
            // Store selected value in a data attribute to ensure it's available when submitting
            this.setAttribute('data-selected-value', this.value);
        });
    }
    
    // Handle team selection
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
    
    // Add event listeners for the modal
    const closeProjectModalBtn = document.getElementById('close-project-modal');
    const cancelProjectBtn = document.getElementById('cancel-project');
    const projectForm = document.getElementById('project-form');
    
    if (closeProjectModalBtn) {
        closeProjectModalBtn.addEventListener('click', function() {
            projectModal.style.display = 'none';
        });
    }
    
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', function() {
            projectModal.style.display = 'none';
        });
    }
    
    if (projectForm) {
        // Clone the form to remove any existing event listeners
        const newForm = projectForm.cloneNode(true);
        projectForm.parentNode.replaceChild(newForm, projectForm);
        
        // Add event listener to the new form
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // For debugging:
            const statusValue = document.getElementById('project-status').value;
            console.log("Selected status on submit:", statusValue);
            
            saveProjectChanges();
        });
    }
}

function saveProjectChanges() {
    // Get form inputs
    const projectNameInput = document.getElementById('project-name');
    const projectDescInput = document.getElementById('project-description');
    const projectStartDateInput = document.getElementById('project-start-date');
    const projectDeadlineInput = document.getElementById('project-deadline');
    
    // Get the status dropdown
    const projectStatusInput = document.getElementById('project-status');
    
    // Validate form
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
    
    // Debug the status dropdown
    console.log("Status dropdown:", projectStatusInput);
    
    // Get the status value using multiple methods to ensure we capture it
    // Method 1: direct value
    let selectedStatus = projectStatusInput ? projectStatusInput.value : "not started";
    console.log("Method 1 - Direct value:", selectedStatus);
    
    // Method 2: data attribute if set
    if (projectStatusInput && projectStatusInput.hasAttribute('data-selected-value')) {
        selectedStatus = projectStatusInput.getAttribute('data-selected-value');
        console.log("Method 2 - Data attribute:", selectedStatus);
    }
    
    // Method 3: selected index
    if (projectStatusInput && projectStatusInput.selectedIndex >= 0) {
        const selectedOption = projectStatusInput.options[projectStatusInput.selectedIndex];
        if (selectedOption) {
            selectedStatus = selectedOption.value;
            console.log("Method 3 - Selected option:", selectedStatus);
        }
    }
    
    // Keep the existing team
    const currentTeam = currentProject.team || [];
    
    // Update project data with the selected status
    currentProject.name = projectNameInput.value.trim();
    currentProject.description = projectDescInput ? projectDescInput.value.trim() : '';
    currentProject.startDate = projectStartDateInput.value;
    currentProject.deadline = projectDeadlineInput.value;
    currentProject.status = selectedStatus;
    currentProject.team = currentTeam;
    currentProject.updatedAt = new Date().toISOString();
    
    console.log("Final selected status:", selectedStatus);
    console.log("Saving project with status:", currentProject.status);
    
    // Save project
    saveProject();
    
    // Update UI
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
        
        // Remove current project
        const updatedProjects = projects.filter(p => p.id !== currentProject.id);
        
        // Save to localStorage
        localStorage.setItem(projectsKey, JSON.stringify(updatedProjects));
        
        // Redirect to projects page
        window.location.href = 'projects.html';
    }
}

function updateRecentProjectsNav() {
    const recentProjectsNavElement = document.getElementById('recent-projects-nav');
    if (!recentProjectsNavElement) return;
    
    // Clear previous content
    recentProjectsNavElement.innerHTML = '';
    
    // Simple placeholder message
    recentProjectsNavElement.innerHTML = '<div class="nav-placeholder-message">Recent projects navigation is temporarily disabled</div>';
}

// Utility functions
function getStatusClass(status) {
    if (!status) return 'not-started';
    
    // Log the input status for debugging
    console.log("getStatusClass called with:", status);
    
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
            console.warn(`Unknown status: "${status}", defaulting to "not-started"`);
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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}