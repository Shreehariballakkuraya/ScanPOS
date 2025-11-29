app.controller('DashboardController', ['$scope', 'ReportsService', function($scope, ReportsService) {
    $scope.title = 'Dashboard';
    $scope.loading = true;
    $scope.stats = null;
    
    // Load dashboard statistics
    $scope.loadStats = function() {
        $scope.loading = true;
        ReportsService.getDashboardStats()
            .then(function(response) {
                $scope.stats = response.data;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading dashboard stats:', error);
                $scope.loading = false;
                alert('Failed to load dashboard statistics');
            });
    };
    
    // Initialize
    $scope.loadStats();
}]);
