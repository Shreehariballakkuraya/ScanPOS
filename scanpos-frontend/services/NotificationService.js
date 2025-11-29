app.service('NotificationService', ['$timeout', function($timeout) {
    var service = this;
    var container = null;
    
    // Initialize notification container
    service.init = function() {
        if (container) return;
        
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; width: 350px;';
        document.body.appendChild(container);
    };
    
    // Show notification
    service.show = function(message, type, duration) {
        service.init();
        
        type = type || 'info'; // info, success, warning, error
        duration = duration || 4000;
        
        var notification = document.createElement('div');
        notification.className = 'toast-notification toast-' + type;
        
        var icon = getIcon(type);
        
        notification.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Animate in
        setTimeout(function() {
            notification.classList.add('toast-show');
        }, 10);
        
        // Auto remove
        if (duration > 0) {
            $timeout(function() {
                notification.classList.remove('toast-show');
                setTimeout(function() {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }, duration);
        }
    };
    
    // Helper methods
    service.success = function(message, duration) {
        service.show(message, 'success', duration);
    };
    
    service.error = function(message, duration) {
        service.show(message, 'error', duration);
    };
    
    service.warning = function(message, duration) {
        service.show(message, 'warning', duration);
    };
    
    service.info = function(message, duration) {
        service.show(message, 'info', duration);
    };
    
    // Get icon for type
    function getIcon(type) {
        switch(type) {
            case 'success':
                return '<i class="bi bi-check-circle-fill"></i>';
            case 'error':
                return '<i class="bi bi-x-circle-fill"></i>';
            case 'warning':
                return '<i class="bi bi-exclamation-triangle-fill"></i>';
            case 'info':
            default:
                return '<i class="bi bi-info-circle-fill"></i>';
        }
    }
}]);
