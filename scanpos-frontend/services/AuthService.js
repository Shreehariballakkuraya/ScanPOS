app.service('AuthService', ['$http', '$window', 'API_URL', function($http, $window, API_URL) {
    var service = this;
    var TOKEN_KEY = 'scanpos_token';
    var USER_KEY = 'scanpos_user';
    
    // Login
    service.login = function(email, password) {
        return $http.post(API_URL + '/api/auth/login', {
            email: email,
            password: password
        }).then(function(response) {
            if (response.data.access_token) {
                service.setToken(response.data.access_token);
                service.setUser(response.data.user);
            }
            return response.data;
        });
    };
    
    // Logout
    service.logout = function() {
        $window.localStorage.removeItem(TOKEN_KEY);
        $window.localStorage.removeItem(USER_KEY);
    };
    
    // Check if authenticated
    service.isAuthenticated = function() {
        return !!service.getToken();
    };
    
    // Get token
    service.getToken = function() {
        return $window.localStorage.getItem(TOKEN_KEY);
    };
    
    // Set token
    service.setToken = function(token) {
        $window.localStorage.setItem(TOKEN_KEY, token);
    };
    
    // Get user
    service.getUser = function() {
        var user = $window.localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    };
    
    // Set user
    service.setUser = function(user) {
        $window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    };
}]);
