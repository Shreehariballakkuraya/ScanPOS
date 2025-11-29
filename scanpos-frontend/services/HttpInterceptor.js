// HTTP Interceptor for global request/response handling
app.factory('HttpInterceptor', ['$q', '$window', '$location', 'NotificationService', function($q, $window, $location, NotificationService) {
    return {
        // Add authentication token to all requests
        request: function(config) {
            var token = $window.localStorage.getItem('scanpos_token');
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = 'Bearer ' + token;
            }
            return config;
        },
        
        // Handle response errors globally
        responseError: function(response) {
            // Handle 401 Unauthorized (session expired)
            if (response.status === 401) {
                // Clear auth data
                $window.localStorage.removeItem('scanpos_token');
                $window.localStorage.removeItem('scanpos_user');
                
                // Only redirect if not already on login page
                if ($location.path() !== '/login') {
                    NotificationService.warning('Session expired. Please login again.');
                    $location.path('/login');
                }
            }
            
            // Handle 403 Forbidden
            if (response.status === 403) {
                NotificationService.error('Access denied. You do not have permission for this action.');
            }
            
            // Always reject the promise so controllers can handle errors
            return $q.reject(response);
        }
    };
}]);

// Register the interceptor
app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('HttpInterceptor');
}]);
