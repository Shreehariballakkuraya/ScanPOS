// ScanPOS AngularJS Application
var app = angular.module('scanPosApp', ['ngRoute']);

// API Configuration
// Use current hostname but with port 5000 for API
// This way it works on both PC (localhost) and phone (IP address)
app.constant('API_URL', window.location.protocol + '//' + window.location.hostname + ':5000');

// Route Configuration
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'LoginController'
        })
        .when('/dashboard', {
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardController',
            requireAuth: true
        })
        .when('/billing', {
            templateUrl: 'views/billing.html',
            controller: 'BillingController',
            requireAuth: true
        })
        .when('/products', {
            templateUrl: 'views/products.html',
            controller: 'ProductsController',
            requireAuth: true
        })
        .when('/invoices', {
            templateUrl: 'views/invoices.html',
            controller: 'InvoicesController',
            requireAuth: true
        })
        .when('/reports', {
            templateUrl: 'views/reports.html',
            controller: 'ReportsController',
            requireAuth: true
        })
        .when('/scan', {
            templateUrl: 'views/scan.html',
            controller: 'ScanController',
            requireAuth: false  // Can work without auth for simplicity
        })
        .otherwise({
            redirectTo: '/login'
        });
}]);

// HTTP Interceptor for JWT Token
app.factory('AuthInterceptor', ['$q', '$location', '$window', function($q, $location, $window) {
    return {
        request: function(config) {
            var token = $window.localStorage.getItem('scanpos_token');
            if (token) {
                config.headers.Authorization = 'Bearer ' + token;
            }
            return config;
        },
        responseError: function(response) {
            if (response.status === 401) {
                $window.localStorage.removeItem('scanpos_token');
                $window.localStorage.removeItem('scanpos_user');
                $location.path('/login');
            }
            return $q.reject(response);
        }
    };
}]);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
}]);

// Run block - Check authentication on route change
app.run(['$rootScope', '$location', '$window', function($rootScope, $location, $window) {
    
    // Initialize authentication state
    function updateAuthState() {
        var token = $window.localStorage.getItem('scanpos_token');
        var userJson = $window.localStorage.getItem('scanpos_user');
        
        $rootScope.isAuth = !!token;
        $rootScope.currentUser = userJson ? JSON.parse(userJson) : {};
    }
    
    // Update on initial load
    updateAuthState();
    
    // Check authentication before each route change
    $rootScope.$on('$routeChangeStart', function(event, next) {
        updateAuthState();
        
        // If route requires auth and user is not authenticated
        if (next && next.requireAuth && !$rootScope.isAuth) {
            event.preventDefault();
            $location.path('/login');
        }
        
        // If user is authenticated and tries to go to login, redirect to dashboard
        if (next && next.$$route && next.$$route.originalPath === '/login' && $rootScope.isAuth) {
            event.preventDefault();
            $location.path('/dashboard');
        }
    });
    
    // Update auth state after successful route change
    $rootScope.$on('$routeChangeSuccess', function() {
        updateAuthState();
    });
    
    // Helper function for templates
    $rootScope.isAuthenticated = function() {
        return $rootScope.isAuth;
    };
    
    // Logout function
    $rootScope.logout = function() {
        $window.localStorage.removeItem('scanpos_token');
        $window.localStorage.removeItem('scanpos_user');
        updateAuthState();
        $location.path('/login');
    };
}]);
