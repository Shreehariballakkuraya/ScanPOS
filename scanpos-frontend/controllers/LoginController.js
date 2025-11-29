app.controller('LoginController', ['$scope', '$location', '$http', '$window', 'API_URL', 'ErrorHandlerService', function($scope, $location, $http, $window, API_URL, ErrorHandlerService) {
    $scope.credentials = {
        email: '',
        password: ''
    };
    $scope.error = '';
    $scope.loading = false;
    
    // Redirect if already logged in
    if ($window.localStorage.getItem('scanpos_token')) {
        $location.path('/dashboard');
    }
    
    $scope.login = function() {
        $scope.error = '';
        $scope.loading = true;
        
        ErrorHandlerService.retryOperation(function() {
            return $http.post(API_URL + '/api/auth/login', {
                email: $scope.credentials.email,
                password: $scope.credentials.password
            });
        }, 1, 1000) // Only retry once for login
        .then(function(response) {
            // Store token and user
            $window.localStorage.setItem('scanpos_token', response.data.access_token);
            $window.localStorage.setItem('scanpos_user', JSON.stringify(response.data.user));
            
            // Redirect to dashboard
            $location.path('/dashboard');
        })
        .catch(function(error) {
            var errorInfo = ErrorHandlerService.parseError(error);
            $scope.error = errorInfo.message;
            
            // Log to console for debugging
            console.error('Login error:', error);
        })
        .finally(function() {
            $scope.loading = false;
        });
    };
}]);
