/**
 * Simplified Sidebar Toggle Functionality
 * For Mobile and Small Screens
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get core elements
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    
    // Exit if elements don't exist
    if (!sidebar || !toggleBtn) {
        console.error('Sidebar elements not found');
        return;
    }
    
    // Create simple overlay
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '900'; // Below sidebar but above content
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    // Create close button for mobile
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-sidebar';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '15px';
    closeBtn.style.right = '15px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#a0a0a6';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.zIndex = '1001';
    
    // Add close button to sidebar
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        sidebarHeader.appendChild(closeBtn);
    }
    
    // Add critical CSS styles directly
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @media screen and (max-width: 768px) {
            .sidebar {
                position: fixed !important;
                top: 0;
                left: 0;
                height: 100%;
                width: 280px;
                transform: translateX(-100%) !important;
                transition: transform 0.3s ease !important;
                z-index: 1000;
                background-color: var(--bg-secondary, #1c1c22);
            }
            
            .sidebar.open {
                transform: translateX(0) !important;
                box-shadow: 0 0 15px rgba(0,0,0,0.5);
            }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Simple toggle function
    function toggleSidebar() {
        const isOpen = sidebar.classList.contains('open');
        
        if (isOpen) {
            sidebar.classList.remove('open');
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        } else {
            sidebar.classList.add('open');
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Add event listeners
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
    });
    
    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
    });
    
    overlay.addEventListener('click', function() {
        toggleSidebar();
    });
    
    // Close sidebar when clicking nav items (in mobile)
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        });
    });
});