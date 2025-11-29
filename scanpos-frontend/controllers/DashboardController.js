app.controller('DashboardController', ['$scope', 'ReportsService', 'NotificationService', 'ErrorHandlerService', function($scope, ReportsService, NotificationService, ErrorHandlerService) {
    $scope.title = 'Dashboard';
    $scope.loading = true;
    $scope.stats = null;
    
    // Load dashboard statistics
    $scope.loadStats = function() {
        $scope.loading = true;
        
        ErrorHandlerService.retryOperation(function() {
            return ReportsService.getDashboardStats();
        }, 2, 1000)
            .then(function(response) {
                $scope.stats = response.data;
            })
            .catch(function(error) {
                ErrorHandlerService.handleError(error, 'Loading dashboard statistics');
            })
            .finally(function() {
                $scope.loading = false;
            });
    };
    
    // Initialize
    $scope.loadStats();
}]);
