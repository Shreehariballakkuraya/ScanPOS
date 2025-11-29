app.controller('LoginController', ['$scope', '$location', '$http', '$window', 'API_URL', function($scope, $location, $http, $window, API_URL) {
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
        
        $http.post(API_URL + '/api/auth/login', {
            email: $scope.credentials.email,
            password: $scope.credentials.password
        })
        .then(function(response) {
            $scope.loading = false;
            
            // Store token and user
            $window.localStorage.setItem('scanpos_token', response.data.access_token);
            $window.localStorage.setItem('scanpos_user', JSON.stringify(response.data.user));
            
            // Redirect to dashboard
            $location.path('/dashboard');
        })
        .catch(function(error) {
            $scope.loading = false;
            $scope.error = error.data && error.data.message 
                ? error.data.message 
                : 'Login failed. Please check your credentials.';
        });
    };
}]);
